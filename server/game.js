const { rooms } = require('./rooms');
const { rollPowerUp, tryUsePowerUp } = require('./powers');

function emitNextTurn(io, roomId) {
  const room = rooms[roomId];
  console.log("Turn " + room.turnCount, ": running emitNextTurn");
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

      room.players.forEach(p => {
        if (p.hp <= 0) return;
        const power = rollPowerUp();
        if (!p.powerUps[power]) p.powerUps[power] = 0;
        p.powerUps[power]++;
        io.to(p.socketId).emit("power-up-received", p.name, power);
      });

      io.to(roomId).emit("next-turn", {
        turnCount: room.turnCount,
      });

      io.to(roomId).emit("turn-log", `[Turn ${room.turnCount} has begun]`);
      return;
    }
  }

  console.log(`No connected players left to take the next turn in room ${roomId}`);
}

function processTurn(io, roomId, currentActions) {
  const roomData = rooms[roomId];
  if (roomData.turnCount === 1) io.to(roomId).emit("turn-log", `[Turn 1 has begun]`);

  const energyShields = new Set();
  const defends = new Set();
  const prowessMap = {};
  const eliminatedPlayers = new Set();
  const healedPlayers = new Set();
  const logs = [];

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
      if (result.success) prowessMap[action.playerName] = action.targetName;
      io.to(roomId).emit("prowess-occurred", action.playerName);
    }
  });

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

  currentActions.forEach(action => {
    if (!["attack", "special", "cruelty"].includes(action.action)) return;

    const attacker = roomData.players.find(p => p.name === action.playerName);
    const target = roomData.players.find(p => p.name === action.targetName);
    io.to(roomId).emit(`${action.action}-occurred`, action.playerName);
    if (!attacker || !target) {
      action.result = 'invalid target';
      return;
    }

    if (target.hp <= 0) {
      action.result = 'but player was already eliminated!';
      return;
    }

    if (["special", "cruelty", "prowess", "heal"].includes(action.action)) {
      const result = tryUsePowerUp(attacker, action.action);
      action.result = result.result;
      if (!result.success) return;
    }

    const blockedByProwess = prowessMap[target.name] === attacker.name;
    const blockedByShield = energyShields.has(target.name) && action.action !== 'attack';
    const blockedByDefend = defends.has(target.name) && action.action === 'attack';

    const isCruelty = action.action === "cruelty";
    const damage = action.action === "special" ? 2 : 1;

    if (blockedByProwess) {
      action.result = "reflected";
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

    if (blockedByShield || blockedByDefend) {
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

  io.to(roomId).emit("players-update", roomData.players.map(p => ({
    name: p.name,
    hp: p.hp,
    powerUps: p.powerUps
  })));

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

  const alive = roomData.players.filter(p => p.hp > 0);
  if (alive.length === 1) {
    io.to(roomId).emit("game-over", { type: "win", winner: alive[0].name });
  } else if (alive.length === 0) {
    io.to(roomId).emit("game-over", { type: "draw", winner: null });
  }

  return logs;
}

module.exports = { emitNextTurn, processTurn };
