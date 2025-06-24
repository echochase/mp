const express = require('express');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Attach io to the existing HTTP server, no port here
const io = new Server(server, {
  cors: {
    origin: [process.env.CLIENT_ORIGIN],
  }
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});

let rooms = {};

/**
 * ROOM STRUCTURE
 * rooms = {
 *   [roomId]: {
 *     id: string,
 *     players: [
 *       {
 *         name: string,
 *         socketId: string,
 *         hp: number,
 *         commands: string[]
 *       }
 *     ],
 *     leader: string,
 *     started: boolean,
 *     playerTurn: number,
 *     turnCount: number,
 *     actions: Array<Array<{
 *       playerName: string,
 *       action: string,
 *       targetName: string,
 *       result?: string
 *     }>>
 *   }
 * }
 */

/**
 * DECLARED ACTIONS
 * playerName: string,
 * actions: string[]
 */

function emitNextTurn(roomId) {
  const room = rooms[roomId];
  console.log("Turn " + room.turnCount, ": running emitnextturn");
  if (!room || room.players.length === 0) return;

  const totalPlayers = room.players.length;

  for (let i = 0; i < totalPlayers; i++) {
    const index = (room.playerTurn + 1 + i) % totalPlayers;
    const player = room.players[index];
    const isConnected = io.sockets.sockets.get(player.socketId);
    
    if (isConnected) {
      room.playerTurn = index;
      room.turnCount += 1;
      room.turnStage = "declaration";
      room.declaredActions = {};
      room.chosenActions = {};
      io.to(roomId).emit("stage-update", "declaration");
  
      if (room.turnCount > 1) {
        room.players.forEach(p => {
          if (p.hp <= 0) return;
          const power = rollPowerUp();
          if (!p.powerUps[power]) p.powerUps[power] = 0;
          p.powerUps[power]++;
          io.to(p.socketId).emit("power-up-received", p.name, power);
        });
      }
  
      io.to(roomId).emit("next-turn", {
        turnCount: room.turnCount,
      });
  
      io.to(roomId).emit("turn-log", `[Turn ${room.turnCount} has begun]`);
      return;
    }
  }

  console.log(`No connected players left to take the next turn in room ${roomId}`);
}

function rollPowerUp() {
  let powerUp;
  const roll = Math.random();
  if (roll < 0.4) powerUp = "special";
  else if (roll < 0.7) powerUp = "heal";
  else if (roll < 0.85) powerUp = "cruelty";
  else powerUp = "prowess";
  return powerUp;
}

function tryUsePowerUp(player, actionType, targetName = null) {
  if (!player || player.hp <= 0) return { success: false, result: "invalid player" };

  const powerUps = player.powerUps || {};

  switch (actionType) {
    case "prowess":
    case "heal":
    case "special":
    case "cruelty":
      if ((powerUps[actionType] || 0) > 0) {
        powerUps[actionType] -= 1;
        return { success: true, result: actionType === "heal" ? "healed" : actionType === "prowess" ? "ready" : `${actionType} used`, targetName };
      } else {
        return { success: false, result: `no ${actionType}` };
      }

    default:
      // Non-power-up actions like "attack" or "defend"
      return { success: true, result: actionType }; 
  }
}

function processTurn(roomId, currentActions) {
  const roomData = rooms[roomId];
  if (roomData.turnCount === 1) io.to(roomId).emit("turn-log", `[Turn 1 has begun]`);  

  const energyShields = new Set();
  const defends = new Set();
  const prowessMap = {};

  const eliminatedPlayers = new Set();
  const healedPlayers = new Set();
  const logs = [];
  // Step 1: Setup initial flags
  currentActions.forEach(action => {
    const player = roomData.players.find(p => p.name === action.playerName);
    if (!player) return;

    if (action.action === "defend") {
      defends.add(action.playerName);
      action.result = 'defended';
      io.to(roomId).emit("block-occurred", action.playerName);
    }

    if (action.action === "energy-shield") {
      energyShields.add(action.playerName);
      action.result = 'shielded';
      io.to(roomId).emit("shield-occurred", action.playerName);
    }

    if (action.action === "prowess" && action.targetName) {
      const result = tryUsePowerUp(player, "prowess", action.targetName);
      action.result = result.result;
      io.to(roomId).emit("prowess-occurred", action.playerName);
      if (result.success) prowessMap[action.playerName] = action.targetName;
    }
  });

  // Step 2: Process heal actions (before damage)
  currentActions.forEach(action => {
    if (action.action === "heal") {
      const player = roomData.players.find(p => p.name === action.playerName);
      if (!player) return;

      const result = tryUsePowerUp(player, "heal");
      io.to(roomId).emit("heal-occurred", action.playerName);
      action.result = result.result;
      if (result.success) {
        player.hp += 2;
        healedPlayers.add(player.name);
      }
    }    
  });

  // Step 3: Process all attacks
  currentActions.forEach(action => {
    if (!["attack", "special", "cruelty"].includes(action.action)) return;

    const attacker = roomData.players.find(p => p.name === action.playerName);
    const target = roomData.players.find(p => p.name === action.targetName);
    if (!attacker || !target) {
      action.result = 'invalid target';
      return;
    }

    if (target.hp <= 0) {
      action.result = 'but player was already eliminated!';
      return;
    }

    const wasBlockedByProwess = prowessMap[target.name] === attacker.name;
    const wasBlockedByEnergyShield = energyShields.has(target.name) && action.action !== 'attack';
    const wasBlockedByDefend = defends.has(target.name) && action.action === 'attack';

    if (action.action === "special" || action.action === "cruelty") {
      const result = tryUsePowerUp(attacker, action.action);
      action.result = result.result;
      if (!result.success) return;
    }
    
    let damage;
    
    if (action.action === "attack") {
      damage = 1;
      io.to(roomId).emit("attack-occurred", action.playerName);
    } else if (action.action === "special") {
      damage = 2;
      io.to(roomId).emit("special-occurred", action.playerName);
    } else damage = null;

    const isCruelty = action.action === "cruelty";

    if (wasBlockedByProwess) {
      action.result = "reflected";
      // Reflect the same damage
      const reflectedTarget = attacker;
      if (isCruelty) {
        reflectedTarget.hp = 0;
        eliminatedPlayers.add(reflectedTarget.name);
        io.to(roomId).emit("player-eliminated", reflectedTarget.name);
      } else {
        reflectedTarget.hp = Math.max(0, reflectedTarget.hp - damage);
        if (reflectedTarget.hp === 0) {
          eliminatedPlayers.add(reflectedTarget.name);
          io.to(roomId).emit("player-eliminated", reflectedTarget.name);
        }
      }
      return;
    }

    if (wasBlockedByEnergyShield || wasBlockedByDefend) {
      action.result = "blocked";
      return;
    }

    if (isCruelty) {
      target.hp = 0;
    } else {
      target.hp = Math.max(0, target.hp - damage);
    }

    action.result = "successful";
    if (target.hp === 0) {
      eliminatedPlayers.add(target.name);
      io.to(roomId).emit("player-eliminated", target.name);
    }
  });

  // Step 4: Update clients with new player state
  io.to(roomId).emit("players-update", roomData.players.map(p => ({
    name: p.name,
    hp: p.hp,
    powerUps: p.powerUps
  })));

  // Step 5: Emit turn logs
  currentActions.forEach(action => {
    const { playerName, action: act, targetName, result } = action;
    let msg = "";
    if (act === "defend") msg = `${playerName} defended`;
    else if (act === "energy-shield") msg = `${playerName} used an energy shield`;
    else if (act === "prowess") msg = `${playerName} activated prowess against ${targetName}`;
    else if (act === "heal") msg = `${playerName} healed +2 HP`;
    else if (["attack", "special", "cruelty"].includes(act)) {
      const type = act === "attack" ? "attacked" : act === "special" ? "used a special attack on" : "used cruelty on";
      msg = `${playerName} ${type} ${targetName}`;
      if (result === "blocked") msg += " (blocked)";
      else if (result === "reflected") msg += " (reflected)";
      else if (result === "successful") msg += " (successful)";
      else msg += ` (${result})`;
    }
    logs.push(msg);
  });

  eliminatedPlayers.forEach(name => logs.push(`${name} has been eliminated!`));

  const alivePlayers = roomData.players.filter(p => p.hp > 0);
  if (alivePlayers.length === 1) {
    io.to(roomId).emit("game-over", { type: "win", winner: alivePlayers[0].name });
  } else if (alivePlayers.length === 0) {
    io.to(roomId).emit("game-over", { type: "draw", winner: null });
  }

  return logs;
}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.on('create-room', (room, playerName) => {
    rooms[room] = {
      id: room,
      players: [{
        name: playerName,
        socketId: socket.id,
        hp: 5,
        commands: [],
        isEliminated: false,
        powerUps: {
          cruelty: 0,
          special: 0,
          heal: 0,
          prowess: 0,
          energyShield: 0,
        }
      }],
      leader: playerName,
      started: false,
      playerTurn: 0,
      turnCount: 0,
    };
    socket.join(room);
    io.to(room).emit('new-player', rooms[room].players.map(p => ({ name: p.name, hp: p.hp })));
    console.log(`Room ${room} created by ${playerName}`);
  });

  socket.on("join-room", (room, playerName) => {
    const roomData = rooms[room];
    if (roomData) {
      if (roomData.started) {
        socket.emit("started-error");
      } else if (roomData.players.some(p => p.name === playerName)) {
        socket.emit("duplicate-name-error");
      } else {
        roomData.players.push({
          name: playerName,
          socketId: socket.id,
          hp: 5,
          commands: [],
          isEliminated: false,
          powerUps: {
            cruelty: 0,
            special: 0,
            heal: 0,
            prowess: 0,
            energyShield: 0,
          }
        });
        socket.join(room);
        io.to(room).emit("new-player", roomData.players.map(p => ({ name: p.name, hp: p.hp })));
        socket.emit("join-success", room);
        console.log(`${playerName} joined room ${room}`);
      }
    } else {
      socket.emit("non-existent-error");
    }
  });

  socket.on('check-room', (room) => {
    const roomData = rooms[room];
    if (roomData) {
      socket.emit('room-exists', roomData.players.map(p => ({ name: p.name, hp: p.hp })));
    } else {
      socket.emit('room-not-found');
    }
  });

  socket.on("declare-action", (roomId, playerName, actions) => {
    const room = rooms[roomId];
    if (!room || room.turnStage !== "declaration") return;
    
    if (room.declaredActions[playerName]) return;
  
    room.declaredActions[playerName] = actions;
  
    const allDeclared = Object.values(room.players).every(
      p => room.declaredActions[p.name]?.length === 3
    );
  
    if (allDeclared) {
      room.turnStage = "execution";
      io.to(roomId).emit("stage-update", "execution");
      io.to(roomId).emit("turn-log", "All actions declared. Entering execution stage.");
  
      // Emit only action types to the frontend
      const actionTypesOnly = {};
      for (const [player, acts] of Object.entries(room.declaredActions)) {
        actionTypesOnly[player] = acts.map(a => a.actionType);
      }
  
      io.to(roomId).emit("all-declared", actionTypesOnly);
    }
  });  

  socket.on("execute-actions", (roomId, playerName, selections) => {
    const room = rooms[roomId];
    if (!room || room.turnStage !== "execution") return;
    if (!Array.isArray(selections) || selections.length > 2) return;
  
    const declared = room.declaredActions[playerName];
    if (!declared || declared.length !== 3) return;
  
    const chosen = [];
  
    for (const sel of selections) {
      chosen.push({
        playerName,
        action: sel.actionType,
        targetName: sel.target,
      });
    }
  
    room.chosenActions[playerName] = chosen;
  
    const allChosen = room.players.every(
      p => Array.isArray(room.chosenActions[p.name]) && room.chosenActions[p.name].length <= 2
    );
  
    if (allChosen) {
      room.turnStage = "declaration";
      io.to(roomId).emit("stage-update", "declaration");
    
      const actionsToProcess = Object.values(room.chosenActions).flat();
    
      try {
        const logs = processTurn(roomId, actionsToProcess);
        if (!Array.isArray(logs)) {
          console.log("processTurn() returned undefined or invalid value!", logs);
        } else {
          logs.forEach(msg => io.to(roomId).emit("turn-log", msg));
        }
        io.to(roomId).emit("turn-log", "---");
        emitNextTurn(roomId);
      } catch (err) {
        console.log("Error during processTurn or emitNextTurn:", err);
        io.to(roomId).emit("turn-log", "⚠️ Error occurred during turn processing.");
      }
    }    
  });

  socket.on('start-game', (room, name) => {
    const roomData = rooms[room];
    if (roomData && roomData.players.length >= 2 && name === roomData.leader) {
      roomData.started = true;
      roomData.playerTurn = 0;
      roomData.turnCount = 1;
      roomData.turnStage = "declaration";
      roomData.declaredActions = {};
      roomData.chosenActions = {};
      io.to(room).emit('start-confirm');
      console.log(`Room ${room} started by ${name}.`);
      io.to(room).emit('next-turn', {
        turnCount: roomData.turnCount,
      });
    }
  });

  socket.on("get-current-turn", (room) => {
    const roomData = rooms[room];
    if (roomData && roomData.started) {
      socket.emit("next-turn", {
        turnCount: roomData.turnCount,
      });
    }
  });

  socket.on("get-players", (room) => {
    const roomData = rooms[room];
    if (roomData) {
      socket.emit("players-update", roomData.players.map(p => ({ name: p.name, hp: p.hp, powerUps: p.powerUps })));
    }
  });

  socket.on("leave-room", (room, playerName) => {
    const roomData = rooms[room];
    if (!roomData) return;

    const playerIndex = roomData.players.findIndex(p => p.name === playerName);
    if (playerIndex === -1) return;

    const [removedPlayer] = roomData.players.splice(playerIndex, 1);
    console.log(`${removedPlayer.name} left room ${room}`);

    if (roomData.players.length === 0) {
      delete rooms[room];
      console.log(`Room ${room} deleted as it became empty`);
      return;
    }

    if (roomData.playerTurn >= roomData.players.length) {
      roomData.playerTurn = 0;
    }

    io.to(room).emit("players-update", roomData.players.map(p => ({ name: p.name, hp: p.hp, powerUps: p.powerUps })));

    if (roomData.started) {
      emitNextTurn(room);
    }
  });

  socket.on('disconnect', () => {
    for (const [roomId, roomData] of Object.entries(rooms)) {
      const index = roomData.players.findIndex(p => p.socketId === socket.id);
      if (index !== -1) {
        const [removedPlayer] = roomData.players.splice(index, 1);
        console.log(`${removedPlayer.name} disconnected from room ${roomId}`);

        if (roomData.players.length === 0) {
          delete rooms[roomId];
          console.log(`Room ${roomId} deleted as it became empty`);
        } else {
          io.to(roomId).emit('new-player', roomData.players.map(p => ({ name: p.name, hp: p.hp })));
        }
        break;
      }
    }
  });
});