const { rooms, onlineState } = require('./rooms');
const { rollPowerUp } = require('./powers');
const { emitNextTurn, processTurn } = require('./game');

module.exports = function(io) {
  setInterval(() => {
    io.emit("online-players", onlineState.count);
  }, 60000);
  io.on('connection', (socket) => {
    onlineState.count++;
    console.log(`A user connected: ${socket.id} Online: ${onlineState.count}.`);
    socket.emit("online-players", onlineState.count);

    socket.on('create-room', (playerName) => {
      const room = generateRoomCode();

      rooms[room] = {
        id: room,
        players: [createPlayer(playerName, socket.id)],
        leader: playerName,
        started: false,
        playerTurn: 0,
        turnCount: 0,
      };

      socket.join(room);

      socket.emit('room-created', room);
      socket.emit('set-leader', playerName);

      io.to(room).emit('new-player', rooms[room].players.map(slimPlayer));
      console.log(`Room ${room} created by ${socket.id} with name ${playerName}`);
    });

    socket.on("join-room", (room, playerName) => {
      const roomData = rooms[room];
      if (roomData) {
        if (roomData.started) {
          socket.emit("started-error");
        } else if (roomData.players.length > 5) {
          socket.emit("full-error");
        } else if (roomData.players.some(p => p.name === playerName)) {
          socket.emit("duplicate-name-error");
        } else {
          roomData.players.push(createPlayer(playerName, socket.id));
          socket.join(room);
          io.to(room).emit("new-player", roomData.players.map(slimPlayer));
          socket.emit("join-success", room);
          console.log(`${socket.id} joined room ${room} as ${playerName}`);
        }
      } else {
        socket.emit("non-existent-error");
      }
    });

    socket.on("kick-player", (room, name, playerName) => {
      const roomData = rooms[room];
      if (roomData) {
        if (name === roomData.leader) {
          roomData.players = roomData.players.filter(p => p.name !== playerName);
          io.to(room).emit("players-update", roomData.players.map(p => ({
            name: p.name,
            hp: p.hp,
            powerUps: p.powerUps,
            ready: p.ready,
          })));
        }
      } else {
        socket.emit("non-existent-error");
      }
    });

    socket.on('player-ready', (room, name) => {
      const roomData = rooms[room];
      if (!roomData) return;

      const player = roomData.players.find(p => p.name === name);
      if (!player) return;

      player.ready = true;

      io.to(room).emit("players-update", roomData.players.map(p => ({
        name: p.name,
        hp: p.hp,
        powerUps: p.powerUps,
        ready: p.ready,
      })));
    });

    socket.on('check-room', (room) => {
      const roomData = rooms[room];
      if (roomData) {
        socket.emit('room-exists', roomData.players.map(slimPlayer));
      } else {
        socket.emit('room-not-found');
      }
    });

    socket.on("declare-action", (roomId, playerName, actions) => {
      const room = rooms[roomId];
      if (!room || room.turnStage !== "declaration") return;
      if (room.declaredActions[playerName]) return;

      room.declaredActions[playerName] = actions;

      const alivePlayers = room.players.filter(p => p.hp > 0);

      const allDeclared = alivePlayers.every(
        p => room.declaredActions[p.name]?.length === 3
      );

      if (allDeclared) {
        room.turnStage = "execution";
        io.to(roomId).emit("stage-update", "execution");
        io.to(roomId).emit("turn-log", "All actions declared. Entering execution stage.");

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

      room.chosenActions[playerName] = selections.map(sel => ({
        playerName,
        action: sel.actionType,
        targetName: sel.target,
      }));

      const alivePlayers = room.players.filter(p => p.hp > 0);
      const allChosen = alivePlayers.every(
        p => Array.isArray(room.chosenActions[p.name]) && room.chosenActions[p.name].length <= 2
      );

      if (allChosen) {
        room.turnStage = "declaration";
        io.to(roomId).emit("stage-update", "declaration");

        const actionsToProcess = Object.values(room.chosenActions).flat();

        try {
          const logs = processTurn(io, roomId, actionsToProcess);
          if (Array.isArray(logs)) {
            logs.forEach(msg => io.to(roomId).emit("turn-log", msg));
          } else {
            console.log("processTurn() returned undefined or invalid value!", logs);
          }
          io.to(roomId).emit("turn-log", "---");
          emitNextTurn(io, roomId);
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
        roomData.players.forEach(p => {
          const power = rollPowerUp();
          if (!p.powerUps[power]) p.powerUps[power] = 0;
          p.powerUps[power]++;
          io.to(p.socketId).emit("power-up-received", p.name, power);
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
        socket.emit("players-update", roomData.players.map(p => ({
          name: p.name,
          hp: p.hp,
          powerUps: p.powerUps,
          ready: p.ready,
        })));
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

      io.to(room).emit("players-update", roomData.players.map(p => ({
        name: p.name,
        hp: p.hp,
        powerUps: p.powerUps,
        ready: p.ready,
      })));

      if (roomData.started) {
        emitNextTurn(io, room);
      }
    });

    socket.on('disconnect', () => {
      onlineState.count--;
      let found = false;
      for (const [roomId, roomData] of Object.entries(rooms)) {
        const index = roomData.players.findIndex(p => p.socketId === socket.id);

        if (index !== -1) {
          const [removedPlayer] = roomData.players.splice(index, 1);
          console.log(`${removedPlayer.name} disconnected from room ${roomId}. Online: ${onlineState.count}`);

          if (roomData.players.length === 0) {
            delete rooms[roomId];
            console.log(`Room ${roomId} deleted as it became empty`);
          } else {
            io.to(roomId).emit('new-player', roomData.players.map(slimPlayer));
          }

          found = true;
          break;
        }
      }

      if (!found) {
        console.log(`Socket ${socket.id} disconnected, not found in any room. Online: ${onlineState.count}`);
      }
    });
  });
};

function createPlayer(name, socketId) {
  return {
    name,
    socketId,
    hp: 5,
    commands: [],
    isEliminated: false,
    powerUps: {
      cruelty: 0,
      special: 0,
      heal: 0,
      prowess: 0,
      energyShield: 0,
    },
    ready: false,
  };
}

function slimPlayer(p) {
  return { name: p.name, hp: p.hp, ready: p.ready };
}

function generateRoomCode() {
  let code;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString(); // e.g., "584291"
  } while (rooms[code]);
  return code;
}
