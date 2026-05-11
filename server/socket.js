const { rooms, onlineState } = require('./rooms');

let ioServer = null;

const ACTION_REACTION_WINDOW_MS = 2000;
const TRADE_SCAM_WINDOW_MS = 3500;

const RESOURCE_TYPES = [
  'workforce',
  'candy',
  'money',
  'wood',
  'land',
  'steel',
  'gold',
  'diamond',
];

const CANCEL_REACTION_KEYS = new Set(['iThinkNot', 'absolutelyNot']);
const TRADE_TOOL_KEYS = new Set(['itsAScam', 'bindingContract']);
const NON_NORMAL_ACTION_KEYS = new Set([...CANCEL_REACTION_KEYS, ...TRADE_TOOL_KEYS]);

const PLAYING_CARD_DEFS = [
  {
    key: 'workforce',
    name: 'Workforce',
    type: 'resource',
    count: 10,
    description: 'A standard resource. Store it to complete workforce-based goals.',
  },
  {
    key: 'candy',
    name: 'Candy',
    type: 'resource',
    count: 8,
    description: 'A standard resource. Store it to complete candy-based goals.',
  },
  {
    key: 'money',
    name: 'Money',
    type: 'resource',
    count: 8,
    description: 'A standard resource. Store it to complete money-based goals. Investor spends these from storage.',
  },
  {
    key: 'wood',
    name: 'Wood',
    type: 'resource',
    count: 8,
    description: 'A standard resource. Store it to complete wood-based goals.',
  },
  {
    key: 'land',
    name: 'Land',
    type: 'resource',
    count: 8,
    description: 'A standard resource. Store it to complete land-based goals.',
  },
  {
    key: 'steel',
    name: 'Steel',
    type: 'resource',
    count: 8,
    description: 'A standard resource. Store it to complete steel-based goals.',
  },
  {
    key: 'gold',
    name: 'Gold',
    type: 'resource',
    count: 1,
    specialResource: true,
    description: 'A rare resource. Store it to complete jewellery and royalty goals.',
  },
  {
    key: 'diamond',
    name: 'Diamond',
    type: 'resource',
    count: 1,
    specialResource: true,
    description: 'A rare resource. Store it to complete jewellery and royalty goals.',
  },
  {
    key: 'iThinkNot',
    name: 'I Think Not',
    type: 'action',
    count: 5,
    reaction: true,
    description: 'Reaction. During the reaction window, negate the pending action card.',
  },
  {
    key: 'absolutelyNot',
    name: 'Absolutely Not',
    type: 'action',
    count: 2,
    reaction: true,
    description: 'Reaction. During the reaction window, negate the pending action card. The first valid reaction wins.',
  },
  {
    key: 'absoluteCalamity',
    name: 'Absolute Calamity',
    type: 'action',
    count: 2,
    needsTarget: false,
    description: 'Every other player discards one random card from their hand.',
  },
  {
    key: 'goalRemoval',
    name: 'Goal Removal',
    type: 'action',
    count: 4,
    needsTarget: true,
    description: "Discard one of another player's goal cards and replace it with a new goal card.",
  },
  {
    key: 'goalSwap',
    name: 'Goal Swap',
    type: 'action',
    count: 4,
    needsTarget: true,
    description: 'Swap one of your goal cards with one of another player\'s goal cards.',
  },
  {
    key: 'magicHand',
    name: 'Magic Hand',
    type: 'action',
    count: 3,
    needsTarget: false,
    description: 'After the reaction window, choose 1 playing card from the discard pile and add it to your hand.',
  },
  {
    key: 'itsAScam',
    name: "It's a Scam",
    type: 'action',
    count: 5,
    tradeTool: true,
    description: 'Trade reaction. After an unprotected trade, take back the cards you offered.',
  },
  {
    key: 'robbery',
    name: 'Robbery',
    type: 'action',
    count: 3,
    needsTarget: true,
    description: "Steal a card from another player's hand. You choose a hidden hand slot.",
  },
  {
    key: 'bindingContract',
    name: 'Binding Contract',
    type: 'action',
    count: 2,
    tradeTool: true,
    description: "Trade tool. Spend it while creating a trade offer to block It's a Scam for that trade.",
  },
  {
    key: 'theft',
    name: 'Theft',
    type: 'action',
    count: 3,
    needsTarget: true,
    description: "Steal a chosen resource from another player's storage.",
  },
  {
    key: 'oraclesPower',
    name: "Oracle's Power",
    type: 'action',
    count: 1,
    needsTarget: true,
    description: "Look at a targeted player's hand after the reaction window. Also completes Wizard if you hold that goal.",
  },
  {
    key: 'totalRenewal',
    name: 'Total Renewal',
    type: 'action',
    count: 1,
    needsTarget: false,
    description: 'Discard your hand and draw 7 new playing cards. Also completes Wizard if you hold that goal.',
  },
];

const GOAL_CARD_DEFS = [
  {
    key: 'steelMill',
    name: 'Steel Mill',
    count: 3,
    points: 2,
    description: 'Get 2x Steel and 2x Workforce in your storage.',
    requirement: { steel: 2, workforce: 2 },
  },
  {
    key: 'wealthy',
    name: 'Wealthy',
    count: 2,
    points: 2,
    description: 'Get 3x Money in your storage.',
    requirement: { money: 3 },
  },
  {
    key: 'candyFactory',
    name: 'Candy Factory',
    count: 3,
    points: 2,
    description: 'Get 2x Candy and 2x Workforce in your storage.',
    requirement: { candy: 2, workforce: 2 },
  },
  {
    key: 'steelworker',
    name: 'Steelworker',
    count: 2,
    points: 2,
    description: 'Get 3x Steel in your storage.',
    requirement: { steel: 3 },
  },
  {
    key: '1-Percenter',
    name: '1-Percenter',
    count: 2,
    points: 3,
    description: 'Get 5x Money in your storage.',
    requirement: { money: 5 },
  },
  {
    key: 'sweetTooth',
    name: 'Sweet Tooth',
    count: 2,
    points: 3,
    description: 'Get 5x Candy in your storage.',
    requirement: { candy: 5 },
  },
  {
    key: 'bank',
    name: 'Bank',
    count: 2,
    points: 3,
    description: 'Get 4x Money and 2x Workforce in your storage.',
    requirement: { money: 4, workforce: 2 },
  },
  {
    key: 'CEO',
    name: 'CEO',
    count: 2,
    points: 3,
    description: 'Get 5x Workforce in your storage.',
    requirement: { workforce: 5 },
  },
  {
    key: 'woodworker',
    name: 'Woodworker',
    count: 3,
    points: 1,
    description: 'Get 2x Wood in your storage.',
    requirement: { wood: 2 },
  },
  {
    key: 'manufacturingGiant',
    name: 'Manufacturing Giant',
    count: 2,
    points: 5,
    description: 'Get 3x Steel, 2x Workforce and 3x Wood in your storage.',
    requirement: { steel: 3, workforce: 2, wood: 3 },
  },
  {
    key: 'ultimateCollector',
    name: 'Ultimate Collector',
    count: 2,
    points: 5,
    description: 'Collect 7 different resource cards in your storage.',
    custom: 'sevenDifferentResources',
  },
  {
    key: 'wizard',
    name: 'Wizard',
    count: 2,
    points: 4,
    description: "Use Oracle's Power or Total Renewal.",
    custom: 'usedOracleOrRenewal',
  },
  {
    key: 'tradeSaboteur',
    name: 'Trade Saboteur',
    count: 2,
    points: 2,
    description: 'Use I Think Not or Absolutely Not on a Binding Contract.',
    custom: 'stoppedBindingContract',
  },
  {
    key: 'jeweller',
    name: 'Jeweller',
    count: 2,
    points: 2,
    description: 'Get 1x Diamond or 1x Gold in your storage.',
    anyRequirement: [{ diamond: 1 }, { gold: 1 }],
  },
  {
    key: 'jewelleryCollector',
    name: 'Jewellery Collector',
    count: 1,
    points: 5,
    description: 'Get 1x Diamond and 1x Gold in your storage.',
    requirement: { diamond: 1, gold: 1 },
  },
  {
    key: 'landOwner',
    name: 'Land Owner',
    count: 2,
    points: 3,
    description: 'Get 5x Land in your storage.',
    requirement: { land: 5 },
  },
  {
    key: 'investor',
    name: 'Investor',
    count: 2,
    points: 1,
    description: 'Move at least 2x Money from your storage to another player. This goal grants 1 point for the first 2x Money cards, plus 1 point for each additional Money card.',
    specialCompletion: 'investor',
  },
  {
    key: 'businessPartners',
    name: 'Business Partners',
    count: 3,
    points: 1,
    description: "Trade with another player without using an It's a Scam card.",
    custom: 'cleanTrade',
  },
  {
    key: 'robinHood',
    name: 'Robin Hood',
    count: 2,
    points: 2,
    description: 'Use Theft or Robbery on the player with the most resource cards in their storage.',
    custom: 'robinHoodHit',
  },
  {
    key: 'lawEnforcer',
    name: 'Law Enforcer',
    count: 2,
    points: 2,
    description: "Use I Think Not or Absolutely Not on another player's It's a Scam card.",
    custom: 'stoppedScam',
  },
  {
    key: 'action-ready',
    name: 'Action-Ready',
    count: 1,
    points: 5,
    description: 'Get 7 action cards in your hand and reveal them to all other players.',
    custom: 'sevenActionsInHand',
  },
  {
    key: 'royalty',
    name: 'Royalty',
    count: 1,
    points: 5,
    description: 'Get 3x Land, 4x Money, and either 1x Gold or 1x Diamond in your storage.',
    requirement: { land: 3, money: 4 },
    anyRequirement: [{ gold: 1 }, { diamond: 1 }],
  },
  {
    key: 'handyman',
    name: 'Handyman',
    count: 2,
    points: 1,
    description: 'Get 1x Wood and 1x Steel in your storage.',
    requirement: { wood: 1, steel: 1 },
  },
];

module.exports = function(io) {
  ioServer = io;

  setInterval(() => {
    io.emit('online-players', onlineState.count);
  }, 60000);

  io.on('connection', (socket) => {
    onlineState.count++;
    console.log(`A user connected: ${socket.id} Online: ${onlineState.count}.`);
    socket.emit('online-players', onlineState.count);

    socket.on('create-room', (rawPlayerName) => {
      const playerName = cleanName(rawPlayerName);
      if (!playerName) {
        socket.emit('name-error');
        return;
      }

      const room = generateRoomCode();
      rooms[room] = {
        id: room,
        players: [createPlayer(playerName, socket.id)],
        leader: playerName,
        started: false,
        winner: null,
        currentPlayerIndex: 0,
        playDeck: [],
        playDiscard: [],
        goalDeck: [],
        goalDiscard: [],
        pendingAction: null,
        activeTrade: null,
        pendingChoice: null,
        notice: null,
        nextEventId: 1,
        log: [`${playerName} created the room.`],
      };

      socket.join(room);
      socket.emit('room-created', room);
      socket.emit('set-leader', playerName);
      broadcastLobby(room);
      console.log(`Room ${room} created by ${socket.id} with name ${playerName}`);
    });

    socket.on('join-room', (room, rawPlayerName) => {
      const roomData = rooms[room];
      const playerName = cleanName(rawPlayerName);

      if (!roomData) {
        socket.emit('non-existent-error');
        return;
      }
      if (!playerName) {
        socket.emit('name-error');
        return;
      }

      const existingPlayer = roomData.players.find((p) => p.name === playerName);
      if (existingPlayer) {
        if (roomData.started || existingPlayer.connected === false) {
          existingPlayer.socketId = socket.id;
          existingPlayer.connected = true;
          socket.join(room);
          socket.emit('join-success', { room, started: roomData.started });
          roomData.log.push(`${playerName} rejoined the room.`);
          broadcastAll(room);
          return;
        }

        socket.emit('duplicate-name-error');
        return;
      }

      if (roomData.started) {
        socket.emit('game-already-started-error');
        return;
      }

      if (roomData.players.length >= 6) {
        socket.emit('full-error');
        return;
      }

      roomData.players.push(createPlayer(playerName, socket.id));
      socket.join(room);
      socket.emit('join-success', { room, started: false });
      roomData.log.push(`${playerName} joined the room.`);
      broadcastLobby(room);
      console.log(`${socket.id} joined room ${room} as ${playerName}`);
    });

    socket.on('resume-game', (room, rawPlayerName) => {
      const roomData = rooms[room];
      const playerName = cleanName(rawPlayerName);
      if (!roomData || !playerName) {
        socket.emit('room-not-found');
        return;
      }

      const player = roomData.players.find((p) => p.name === playerName);
      if (!player) {
        socket.emit('not-in-room-error');
        return;
      }

      player.socketId = socket.id;
      player.connected = true;
      socket.join(room);

      if (roomData.started) {
        socket.emit('resume-success', { room, started: true });
        broadcastGameState(room);
      } else {
        socket.emit('resume-success', { room, started: false });
        broadcastLobby(room);
      }
    });

    socket.on('kick-player', (room, name, playerName) => {
      const roomData = rooms[room];
      if (!roomData || name !== roomData.leader || roomData.started) {
        socket.emit('non-existent-error');
        return;
      }

      roomData.players = roomData.players.filter((p) => p.name !== playerName);
      roomData.log.push(`${playerName} was removed from the lobby.`);
      broadcastLobby(room);
    });

    socket.on('player-ready', (room, name) => {
      if (setReady(room, name, true)) broadcastLobby(room);
    });
    socket.on('player-unready', (room, name) => {
      if (setReady(room, name, false)) broadcastLobby(room);
    });

    socket.on('check-room', (room) => {
      const roomData = rooms[room];
      if (roomData) {
        socket.emit('room-exists', {
          players: roomData.players.map((p) => slimPlayer(roomData, p)),
          started: roomData.started,
        });
      } else {
        socket.emit('room-not-found');
      }
    });

    socket.on('start-game', (room, name) => {
      const roomData = rooms[room];
      if (!roomData || roomData.started || name !== roomData.leader) return;
      if (roomData.players.length < 2 || roomData.players.length > 6) return;

      startGame(roomData);
      io.to(room).emit('start-confirm');
      broadcastGameState(room);
      console.log(`Room ${room} started by ${name}.`);
    });

    socket.on('get-players', (room) => {
      const roomData = rooms[room];
      if (roomData) socket.emit('players-update', roomData.players.map((p) => slimPlayer(roomData, p)));
    });

    socket.on('get-game-state', (room) => {
      const roomData = rooms[room];
      if (roomData) broadcastGameState(room);
    });

    socket.on('play-card', (room, payload) => {
      const roomData = rooms[room];
      if (!roomData) return;
      const result = playCard(roomData, socket.id, payload || {});
      if (!result.ok) socket.emit('game-error', result.message);
      broadcastGameState(room);
    });

    socket.on('discard-card', (room, payload) => {
      const roomData = rooms[room];
      if (!roomData) return;
      const result = discardCard(roomData, socket.id, payload || {});
      if (!result.ok) socket.emit('game-error', result.message);
      broadcastGameState(room);
    });

    socket.on('reroll-goal', (room, payload) => {
      const roomData = rooms[room];
      if (!roomData) return;
      const result = rerollGoal(roomData, socket.id, payload || {});
      if (!result.ok) socket.emit('game-error', result.message);
      broadcastGameState(room);
    });

    socket.on('claim-goal', (room, payload) => {
      const roomData = rooms[room];
      if (!roomData) return;
      const result = claimGoal(roomData, socket.id, payload || {});
      if (!result.ok) socket.emit('game-error', result.message);
      broadcastGameState(room);
    });

    socket.on('complete-investor', (room, payload) => {
      const roomData = rooms[room];
      if (!roomData) return;
      const result = completeInvestor(roomData, socket.id, payload || {});
      if (!result.ok) socket.emit('game-error', result.message);
      broadcastGameState(room);
    });

    socket.on('create-trade', (room, payload) => {
      const roomData = rooms[room];
      if (!roomData) return;
      const result = createTrade(roomData, socket.id, payload || {});
      if (!result.ok) socket.emit('game-error', result.message);
      broadcastGameState(room);
    });

    socket.on('respond-trade', (room, payload) => {
      const roomData = rooms[room];
      if (!roomData) return;
      const result = respondTrade(roomData, socket.id, payload || {});
      if (!result.ok) socket.emit('game-error', result.message);
      broadcastGameState(room);
    });

    socket.on('accept-trade', (room) => {
      const roomData = rooms[room];
      if (!roomData) return;
      const result = acceptTrade(roomData, socket.id);
      if (!result.ok) socket.emit('game-error', result.message);
      broadcastGameState(room);
    });

    socket.on('decline-trade', (room) => {
      const roomData = rooms[room];
      if (!roomData) return;
      const result = declineTrade(roomData, socket.id);
      if (!result.ok) socket.emit('game-error', result.message);
      broadcastGameState(room);
    });

    socket.on('play-scam', (room) => {
      const roomData = rooms[room];
      if (!roomData) return;
      const result = playTradeScam(roomData, socket.id);
      if (!result.ok) socket.emit('game-error', result.message);
      broadcastGameState(room);
    });

    socket.on('choose-discard-card', (room, payload) => {
      const roomData = rooms[room];
      if (!roomData) return;
      const result = chooseDiscardCard(roomData, socket.id, payload || {});
      if (!result.ok) socket.emit('game-error', result.message);
      broadcastGameState(room);
    });

    socket.on('end-turn', (room) => {
      const roomData = rooms[room];
      if (!roomData) return;
      const result = endTurn(roomData, socket.id);
      if (!result.ok) socket.emit('game-error', result.message);
      broadcastGameState(room);
    });

    socket.on('leave-room', (room, playerName) => {
      const roomData = rooms[room];
      leaveRoom(socket, room, playerName, true);
      if (rooms[room]) broadcastAll(room);
      else if (roomData) socket.leave(room);
    });

    socket.on('disconnect', () => {
      onlineState.count = Math.max(0, onlineState.count - 1);
      let found = false;

      for (const [roomId, roomData] of Object.entries(rooms)) {
        const player = roomData.players.find((p) => p.socketId === socket.id);
        if (!player) continue;

        found = true;
        if (roomData.started) {
          player.connected = false;
          handlePlayerLeftActiveFlow(roomData, player.name);
          roomData.log.push(`${player.name} disconnected. They can rejoin with the same name.`);
          broadcastGameState(roomId);
          console.log(`${player.name} disconnected from active game ${roomId}. Online: ${onlineState.count}`);
        } else {
          removePlayerFromLobby(roomId, player.name);
          if (rooms[roomId]) broadcastLobby(roomId);
          console.log(`${player.name} disconnected from lobby ${roomId}. Online: ${onlineState.count}`);
        }
        break;
      }

      if (!found) {
        console.log(`Socket ${socket.id} disconnected, not found in any room. Online: ${onlineState.count}`);
      }
    });
  });

  function broadcastLobby(room) {
    const roomData = rooms[room];
    if (!roomData) return;
    const players = roomData.players.map((p) => slimPlayer(roomData, p));
    io.to(room).emit('players-update', players);
    io.to(room).emit('new-player', players);
  }

  function broadcastAll(room) {
    const roomData = rooms[room];
    if (!roomData) return;
    if (roomData.started) broadcastGameState(room);
    else broadcastLobby(room);
  }

  function broadcastGameState(room) {
    const roomData = rooms[room];
    if (!roomData) return;
    emitGameState(roomData);
  }
};

function emitGameState(roomData) {
  if (!ioServer || !roomData) return;

  const publicState = getPublicGameState(roomData);
  for (const player of roomData.players) {
    if (!player.socketId) continue;
    ioServer.to(player.socketId).emit('game-state', {
      ...publicState,
      me: getPrivatePlayerState(roomData, player),
    });
  }
}

function startGame(roomData) {
  clearRoomTimers(roomData);
  roomData.started = true;
  roomData.winner = null;
  roomData.currentPlayerIndex = 0;
  roomData.playDeck = buildDeck(PLAYING_CARD_DEFS);
  roomData.goalDeck = buildDeck(GOAL_CARD_DEFS);
  roomData.playDiscard = [];
  roomData.goalDiscard = [];
  roomData.pendingAction = null;
  roomData.activeTrade = null;
  roomData.pendingChoice = null;
  roomData.notice = null;
  roomData.nextEventId = 1;
  roomData.log = [];

  roomData.players.forEach((player) => {
    player.ready = false;
    player.connected = true;
    player.score = 0;
    player.hand = drawMany(roomData, 'play', 7);
    player.storage = [];
    player.goals = drawMany(roomData, 'goal', 2);
    player.actionPlayed = false;
    player.goalRerolled = false;
    player.tradeUsed = false;
    player.mustDiscard = false;
    player.flags = {};
    player.privateReveal = null;
    if (!player.avatarColor) player.avatarColor = randomAvatarColor();
  });

  roomData.log.push('The game has begun. Each player was dealt 7 playing cards and 2 goal cards.');
  autoCompleteAllGoals(roomData);
  beginTurn(roomData);
}

function beginTurn(roomData) {
  const player = currentPlayer(roomData);
  if (!player || roomData.winner) return;
  roomData.notice = null;

  player.actionPlayed = false;
  player.goalRerolled = false;
  player.tradeUsed = false;
  player.mustDiscard = false;
  drawCardToPlayer(roomData, player, 'play', 1);
  roomData.log.push(`${player.name} begins their turn and draws a card.`);
  autoCompleteGoals(roomData, player);
}

function endTurn(roomData, socketId) {
  const player = currentPlayer(roomData);
  if (!player || player.socketId !== socketId) return fail('It is not your turn.');
  if (roomData.pendingAction) return fail('Wait for the current action to resolve first.');
  if (roomData.pendingChoice) return fail('Finish the current card choice first.');
  if (roomData.activeTrade) return fail('Finish or cancel the active trade first.');
  if (player.mustDiscard) return fail('Discard down to 8 cards first.');
  if (roomData.winner) return fail('The game is already over.');

  if (!player.actionPlayed) {
    drawCardToPlayer(roomData, player, 'play', 1);
    roomData.log.push(`${player.name} played no action card and draws a card before ending their turn.`);
    pushNotice(roomData, `${player.name} drew 1 card because they ended their turn without playing an action.`, 'draw');
    autoCompleteGoals(roomData, player);
    if (roomData.winner) return ok();
  }

  if (player.hand.length > 8) {
    player.mustDiscard = true;
    roomData.log.push(`${player.name} must discard down to 8 cards.`);
    return ok();
  }

  roomData.notice = null;
  advanceTurn(roomData);
  return ok();
}

function advanceTurn(roomData) {
  const player = currentPlayer(roomData);
  if (player) player.mustDiscard = false;
  roomData.currentPlayerIndex = (roomData.currentPlayerIndex + 1) % roomData.players.length;
  beginTurn(roomData);
}

function playCard(roomData, socketId, payload) {
  const player = roomData.players.find((p) => p.socketId === socketId);
  if (!player) return fail('You are not in this room.');
  if (roomData.winner) return fail('The game is already over.');
  if (player.mustDiscard) return fail('Discard down to 8 cards first.');
  if (roomData.pendingChoice) return fail('Finish the current card choice first.');

  const cardIndex = Number(payload.cardIndex);
  if (!Number.isInteger(cardIndex) || cardIndex < 0 || cardIndex >= player.hand.length) {
    return fail('That card is not in your hand.');
  }

  const card = player.hand[cardIndex];

  if (CANCEL_REACTION_KEYS.has(card.key)) {
    return playCancelReaction(roomData, player, cardIndex, card);
  }

  if (card.key === 'itsAScam') return fail("Use It's a Scam from the trade panel during the scam window.");
  if (card.key === 'bindingContract') return fail('Use Binding Contract by ticking the box when creating a trade.');

  if (roomData.pendingAction) return fail('Wait for the current action to resolve first.');
  if (roomData.activeTrade) return fail('Finish or cancel the active trade before playing other cards.');

  if (card.type === 'resource') {
    if (currentPlayer(roomData)?.name !== player.name) return fail('You can only store resources on your turn.');
    player.hand.splice(cardIndex, 1);
    player.storage.push(card);
    roomData.log.push(`${player.name} moved ${card.name} into storage.`);
    autoCompleteGoals(roomData, player);
    return ok();
  }

  if (card.type !== 'action') return fail('This card cannot be played.');
  if (NON_NORMAL_ACTION_KEYS.has(card.key)) return fail('That card cannot be played as a normal action.');
  if (currentPlayer(roomData)?.name !== player.name) return fail('You can only play this card on your turn.');
  if (player.actionPlayed) return fail('You have already played an action card this turn.');

  const targetBeforeAction = payload.targetName ? roomData.players.find((p) => p.name === payload.targetName) : null;
  const mostResourcesBeforeAction = Math.max(0, ...roomData.players.map((p) => p.storage.length));
  const actionPayload = {
    ...payload,
    targetHadMostResourcesBeforeAction:
      Boolean(targetBeforeAction) &&
      targetBeforeAction.name !== player.name &&
      mostResourcesBeforeAction > 0 &&
      targetBeforeAction.storage.length === mostResourcesBeforeAction,
  };

  const validation = validateActionCanBegin(roomData, player, card, actionPayload);
  if (!validation.ok) return validation;

  const [playedCard] = player.hand.splice(cardIndex, 1);
  const pendingId = makeEventId(roomData, 'action');
  const expiresAt = Date.now() + ACTION_REACTION_WINDOW_MS;
  roomData.pendingAction = {
    id: pendingId,
    actorName: player.name,
    card: playedCard,
    payload: actionPayload,
    startedAt: Date.now(),
    expiresAt,
    timer: setTimeout(() => finalizePendingAction(roomData, pendingId), ACTION_REACTION_WINDOW_MS),
  };
  player.actionPlayed = true;
  roomData.log.push(`${player.name} played ${playedCard.name}. Waiting ${ACTION_REACTION_WINDOW_MS / 1000}s for I Think Not or Absolutely Not.`);
  pushNotice(roomData, `${playedCard.name} is pending. Reaction window open.`, 'reaction');
  return ok();
}

function playCancelReaction(roomData, player, cardIndex, card) {
  const pending = roomData.pendingAction;
  if (!pending || Date.now() > pending.expiresAt) {
    return fail('There is no ongoing action to cancel. Your card was not spent.');
  }
  if (pending.actorName === player.name) {
    return fail('You cannot cancel your own pending action.');
  }

  clearTimeout(pending.timer);
  const actor = roomData.players.find((p) => p.name === pending.actorName);
  const [reactionCard] = player.hand.splice(cardIndex, 1);
  roomData.playDiscard.push(reactionCard, pending.card);
  if (actor) actor.actionPlayed = false;
  roomData.pendingAction = null;

  player.flags = player.flags || {};
  if (pending.card.key === 'bindingContract') player.flags.stoppedBindingContract = true;
  if (pending.card.key === 'itsAScam') player.flags.stoppedScam = true;

  roomData.log.push(`${player.name} played ${reactionCard.name}, cancelling ${pending.card.name} from ${pending.actorName}. ${pending.actorName} may play another action this turn.`);
  pushNotice(roomData, `${reactionCard.name} cancelled ${pending.card.name}.`, 'reaction');
  autoCompleteAllGoals(roomData);
  return ok();
}

function finalizePendingAction(roomData, pendingId) {
  const pending = roomData.pendingAction;
  if (!pending || pending.id !== pendingId) return;

  roomData.pendingAction = null;
  const actor = roomData.players.find((p) => p.name === pending.actorName);
  if (!actor) {
    roomData.playDiscard.push(pending.card);
    emitGameState(roomData);
    return;
  }

  const result = resolveAction(roomData, actor, pending.card, pending.payload);
  if (!result.ok) {
    actor.actionPlayed = false;
    actor.hand.push(pending.card);
    roomData.log.push(`${pending.card.name} could not resolve for ${actor.name}: ${result.message}`);
    pushNotice(roomData, `${pending.card.name} fizzled and returned to ${actor.name}.`, 'warning');
    emitGameState(roomData);
    return;
  }

  roomData.playDiscard.push(pending.card);
  actor.actionPlayed = true;
  roomData.log.push(`${actor.name}'s ${pending.card.name} resolved${result.logSuffix || ''}.`);
  if (!roomData.pendingChoice) pushNotice(roomData, `${actor.name}'s ${pending.card.name} resolved.`, 'action');
  markGoalFlags(roomData, actor, pending.card, pending.payload);
  autoCompleteAllGoals(roomData);
  emitGameState(roomData);
}

function validateActionCanBegin(roomData, player, card, payload) {
  const target = payload.targetName ? roomData.players.find((p) => p.name === payload.targetName) : null;

  switch (card.key) {
    case 'theft':
      if (!target || target.name === player.name) return fail('Choose another player to steal from.');
      if (target.storage.length === 0) return fail(`${target.name} has no cards in storage.`);
      if (payload.storageCardId && !target.storage.some((stored) => stored.id === payload.storageCardId)) {
        return fail('That storage card is no longer available.');
      }
      return ok();

    case 'robbery':
      if (!target || target.name === player.name) return fail('Choose another player to rob.');
      if (target.hand.length === 0) return fail(`${target.name} has no cards in hand.`);
      if (payload.handIndex !== undefined) {
        const handIndex = Number(payload.handIndex);
        if (!Number.isInteger(handIndex) || handIndex < 0 || handIndex >= target.hand.length) {
          return fail('Choose a valid hidden hand slot.');
        }
      }
      return ok();

    case 'goalRemoval':
    case 'goalSwap':
      if (!target || target.name === player.name) return fail('Choose another player to target.');
      if (!target.goals.length) return fail(`${target.name} has no goals to target.`);
      if (card.key === 'goalSwap' && !player.goals.length) return fail('You have no goals to swap.');
      return ok();

    case 'magicHand':
      if (roomData.playDiscard.length === 0) return fail('The discard pile is empty.');
      return ok();

    case 'oraclesPower':
      if (!target || target.name === player.name) return fail("Choose another player whose hand you want to inspect.");
      return ok();

    default:
      return ok();
  }
}

function resolveAction(roomData, player, card, payload) {
  const target = payload.targetName ? roomData.players.find((p) => p.name === payload.targetName) : null;

  switch (card.key) {
    case 'theft': {
      if (!target || target.name === player.name) return fail('Choose another player to steal from.');
      if (target.storage.length === 0) return fail(`${target.name} has no cards in storage.`);
      const requestedIndex = payload.storageCardId
        ? target.storage.findIndex((stored) => stored.id === payload.storageCardId)
        : -1;
      const stolenIndex = requestedIndex >= 0 ? requestedIndex : Math.floor(Math.random() * target.storage.length);
      const [stolen] = target.storage.splice(stolenIndex, 1);
      player.storage.push(stolen);
      return ok(` and stole ${stolen.name} from ${target.name}'s storage`);
    }

    case 'robbery': {
      if (!target || target.name === player.name) return fail('Choose another player to rob.');
      if (target.hand.length === 0) return fail(`${target.name} has no cards in hand.`);
      const requestedIndex = Number(payload.handIndex);
      const stolenIndex = Number.isInteger(requestedIndex) && requestedIndex >= 0 && requestedIndex < target.hand.length
        ? requestedIndex
        : Math.floor(Math.random() * target.hand.length);
      const [stolen] = target.hand.splice(stolenIndex, 1);
      player.hand.push(stolen);
      return ok(` and robbed a hidden card from ${target.name}`);
    }

    case 'magicHand': {
      if (roomData.playDiscard.length === 0) return fail('The discard pile is empty.');
      roomData.pendingChoice = {
        id: makeEventId(roomData, 'choice'),
        type: 'magicHandDiscard',
        actorName: player.name,
        choices: roomData.playDiscard.map((discarded) => ({ ...discarded })),
        createdAt: Date.now(),
      };
      pushNotice(roomData, `${player.name} is choosing a card from the discard pile with Magic Hand.`, 'choice');
      return ok(' and opened the discard pile');
    }

    case 'oraclesPower': {
      if (!target || target.name === player.name) return fail("Choose another player whose hand you want to inspect.");
      player.privateReveal = {
        id: makeEventId(roomData, 'reveal'),
        type: 'oracleHand',
        targetName: target.name,
        cards: target.hand.map((card) => ({ ...card })),
        createdAt: Date.now(),
      };
      pushNotice(roomData, `${player.name} used Oracle's Power on ${target.name}.`, 'action');
      return ok(` and revealed ${target.name}'s hand to themselves`);
    }

    case 'totalRenewal': {
      roomData.playDiscard.push(...player.hand.splice(0, player.hand.length));
      player.hand.push(...drawMany(roomData, 'play', 7));
      return ok(' and renewed their hand');
    }

    case 'absoluteCalamity': {
      let hits = 0;
      for (const other of roomData.players) {
        if (other.name === player.name || other.hand.length === 0) continue;
        const discardIndex = Math.floor(Math.random() * other.hand.length);
        const [discarded] = other.hand.splice(discardIndex, 1);
        roomData.playDiscard.push(discarded);
        hits++;
      }
      return ok(` and forced ${hits} player${hits === 1 ? '' : 's'} to discard a random card`);
    }

    case 'goalRemoval': {
      if (!target || target.name === player.name) return fail('Choose another player to target.');
      const goalIndex = chooseGoalIndex(target, payload.goalIndex);
      const [removed] = target.goals.splice(goalIndex, 1);
      roomData.goalDiscard.push(removed);
      const replacement = drawCard(roomData, 'goal');
      if (replacement) target.goals.push(replacement);
      return ok(` and replaced one of ${target.name}'s goal cards`);
    }

    case 'goalSwap': {
      if (!target || target.name === player.name) return fail('Choose another player to target.');
      const myGoalIndex = chooseGoalIndex(player, payload.myGoalIndex);
      const theirGoalIndex = chooseGoalIndex(target, payload.goalIndex);
      const myGoal = player.goals[myGoalIndex];
      player.goals[myGoalIndex] = target.goals[theirGoalIndex];
      target.goals[theirGoalIndex] = myGoal;
      return ok(` and swapped a goal with ${target.name}`);
    }

    default:
      return ok('');
  }
}

function createTrade(roomData, socketId, payload) {
  const player = roomData.players.find((p) => p.socketId === socketId);
  if (!player) return fail('You are not in this room.');
  if (roomData.winner) return fail('The game is already over.');
  if (roomData.pendingAction) return fail('Wait for the current action to resolve before trading.');
  if (roomData.pendingChoice) return fail('Finish the current card choice first.');
  if (roomData.activeTrade) return fail('There is already an active trade.');
  if (currentPlayer(roomData)?.name !== player.name) return fail('Only the current player can initiate a trade.');
  if (player.mustDiscard) return fail('Discard down to 8 cards first.');
  if (player.tradeUsed) return fail('You have already completed a trade this turn.');

  const targetName = cleanName(payload.targetName || '');
  const target = targetName ? roomData.players.find((p) => p.name === targetName) : null;
  if (targetName && (!target || target.name === player.name)) return fail('Choose a valid trade target, or offer to everyone.');

  const offerIds = uniqueIds(payload.cardIds).slice(0, 4);
  if (offerIds.length > 4) return fail('You can offer up to 4 cards.');

  const offeredCards = collectCardsByIds(player.hand, offerIds);
  if (!offeredCards.ok) return fail('Every offered card must be in your hand.');

  let bindingCard = null;
  const useBinding = Boolean(payload.useBinding);
  if (useBinding) {
    const offeredIdSet = new Set(offerIds);
    const bindingIndex = player.hand.findIndex((card) => card.key === 'bindingContract' && !offeredIdSet.has(card.id));
    if (bindingIndex === -1) return fail('You need an unused Binding Contract in hand to protect this trade.');
    [bindingCard] = player.hand.splice(bindingIndex, 1);
    roomData.playDiscard.push(bindingCard);
    roomData.log.push(`${player.name} spent Binding Contract to protect a trade offer.`);
  }

  roomData.activeTrade = {
    id: makeEventId(roomData, 'trade'),
    state: 'open',
    initiatorName: player.name,
    targetName: target?.name || null,
    responderName: null,
    initiatorOfferIds: offerIds,
    responderOfferIds: [],
    initiatorOfferSnapshot: offeredCards.cards,
    responderOfferSnapshot: [],
    initiatorOfferCards: [],
    responderOfferCards: [],
    bindingUsed: useBinding,
    scamsPlayed: {},
    createdAt: Date.now(),
    scamEndsAt: null,
    timer: null,
  };

  const recipient = target ? target.name : 'the table';
  roomData.log.push(`${player.name} offered a trade to ${recipient}: ${formatCardList(offeredCards.cards)}.`);
  pushNotice(roomData, `${player.name} opened a trade offer.`, 'trade');
  return ok();
}

function respondTrade(roomData, socketId, payload) {
  const player = roomData.players.find((p) => p.socketId === socketId);
  const trade = roomData.activeTrade;
  if (!player) return fail('You are not in this room.');
  if (!trade || trade.state !== 'open') return fail('There is no open trade to respond to.');
  if (trade.initiatorName === player.name) return fail('You cannot respond to your own trade.');
  if (trade.targetName && trade.targetName !== player.name) return fail('This trade offer was not made to you.');
  if (player.mustDiscard) return fail('You cannot respond while discarding.');

  const offerIds = uniqueIds(payload.cardIds).slice(0, 4);
  const offeredCards = collectCardsByIds(player.hand, offerIds);
  if (!offeredCards.ok) return fail('Every response card must be in your hand.');

  trade.state = 'configured';
  trade.responderName = player.name;
  trade.responderOfferIds = offerIds;
  trade.responderOfferSnapshot = offeredCards.cards;
  roomData.log.push(`${player.name} responded to ${trade.initiatorName}'s trade with ${formatCardList(offeredCards.cards)}.`);
  pushNotice(roomData, `${player.name} configured a trade response.`, 'trade');
  return ok();
}

function acceptTrade(roomData, socketId) {
  const player = roomData.players.find((p) => p.socketId === socketId);
  const trade = roomData.activeTrade;
  if (!player) return fail('You are not in this room.');
  if (!trade || trade.state !== 'configured') return fail('There is no configured trade to accept.');
  if (trade.initiatorName !== player.name) return fail('Only the trade initiator can accept this trade.');

  const initiator = player;
  const responder = roomData.players.find((p) => p.name === trade.responderName);
  if (!responder) return fail('The responding player is no longer available.');

  const initiatorCards = removeCardsByIds(initiator.hand, trade.initiatorOfferIds);
  if (!initiatorCards.ok) {
    roomData.activeTrade = null;
    return fail('Your offered cards are no longer available, so the trade was cancelled.');
  }

  const responderCards = removeCardsByIds(responder.hand, trade.responderOfferIds);
  if (!responderCards.ok) {
    initiator.hand.push(...initiatorCards.cards);
    roomData.activeTrade = null;
    return fail(`${responder.name}'s offered cards are no longer available, so the trade was cancelled.`);
  }

  initiator.hand.push(...responderCards.cards);
  responder.hand.push(...initiatorCards.cards);
  initiator.tradeUsed = true;

  trade.initiatorOfferCards = initiatorCards.cards;
  trade.responderOfferCards = responderCards.cards;
  trade.state = 'accepted';
  roomData.log.push(`${initiator.name} accepted the trade with ${responder.name}.`);

  if (trade.bindingUsed) {
    initiator.flags = initiator.flags || {};
    responder.flags = responder.flags || {};
    initiator.flags.cleanTrade = true;
    responder.flags.cleanTrade = true;
    roomData.log.push('The Binding Contract prevented any scam window.');
    pushNotice(roomData, 'Trade completed under Binding Contract. No scams allowed.', 'trade');
    roomData.activeTrade = null;
    autoCompleteAllGoals(roomData);
    return ok();
  }

  trade.state = 'scamWindow';
  trade.scamEndsAt = Date.now() + TRADE_SCAM_WINDOW_MS;
  trade.timer = setTimeout(() => finalizeScamWindow(roomData, trade.id), TRADE_SCAM_WINDOW_MS);
  roomData.log.push(`Scam window opened for ${initiator.name} and ${responder.name}.`);
  pushNotice(roomData, `Trade accepted. ${TRADE_SCAM_WINDOW_MS / 1000}s scam window open.`, 'trade');
  return ok();
}

function declineTrade(roomData, socketId) {
  const player = roomData.players.find((p) => p.socketId === socketId);
  const trade = roomData.activeTrade;
  if (!player) return fail('You are not in this room.');
  if (!trade) return fail('There is no active trade to decline.');
  if (trade.state === 'scamWindow') return fail('The trade was already accepted. Wait for the scam window to close.');
  if (![trade.initiatorName, trade.responderName].includes(player.name)) return fail('You are not part of this trade.');

  roomData.log.push(`${player.name} cancelled the active trade.`);
  pushNotice(roomData, `${player.name} cancelled the trade.`, 'trade');
  roomData.activeTrade = null;
  return ok();
}

function playTradeScam(roomData, socketId) {
  const player = roomData.players.find((p) => p.socketId === socketId);
  const trade = roomData.activeTrade;
  if (!player) return fail('You are not in this room.');
  if (!trade || trade.state !== 'scamWindow' || Date.now() > trade.scamEndsAt) {
    return fail("The scam window is closed. Your It's a Scam card was not spent.");
  }
  if (![trade.initiatorName, trade.responderName].includes(player.name)) return fail('Only the two trading players can scam this trade.');
  if (trade.scamsPlayed[player.name]) return fail("You already played It's a Scam for this trade.");

  const scamIndex = player.hand.findIndex((card) => card.key === 'itsAScam');
  if (scamIndex === -1) return fail("You do not have It's a Scam in your hand.");

  const [scamCard] = player.hand.splice(scamIndex, 1);
  roomData.playDiscard.push(scamCard);
  trade.scamsPlayed[player.name] = true;
  roomData.log.push(`${player.name} played It's a Scam.`);
  pushNotice(roomData, `${player.name} played It's a Scam.`, 'trade');

  const initiatorScammed = Boolean(trade.scamsPlayed[trade.initiatorName]);
  const responderScammed = Boolean(trade.scamsPlayed[trade.responderName]);
  if (initiatorScammed && responderScammed) {
    finalizeScamWindow(roomData, trade.id);
  }
  return ok();
}

function finalizeScamWindow(roomData, tradeId) {
  const trade = roomData.activeTrade;
  if (!trade || trade.id !== tradeId || trade.state !== 'scamWindow') return;
  clearTimeout(trade.timer);

  const initiator = roomData.players.find((p) => p.name === trade.initiatorName);
  const responder = roomData.players.find((p) => p.name === trade.responderName);
  if (!initiator || !responder) {
    roomData.activeTrade = null;
    emitGameState(roomData);
    return;
  }

  const initiatorScammed = Boolean(trade.scamsPlayed[initiator.name]);
  const responderScammed = Boolean(trade.scamsPlayed[responder.name]);

  if (initiatorScammed) {
    moveCardsByIds(responder.hand, initiator.hand, trade.initiatorOfferCards.map((card) => card.id));
  }
  if (responderScammed) {
    moveCardsByIds(initiator.hand, responder.hand, trade.responderOfferCards.map((card) => card.id));
  }

  if (!initiatorScammed && !responderScammed) {
    initiator.flags = initiator.flags || {};
    responder.flags = responder.flags || {};
    initiator.flags.cleanTrade = true;
    responder.flags.cleanTrade = true;
    roomData.log.push(`${initiator.name} and ${responder.name} completed a clean trade.`);
  } else if (initiatorScammed && responderScammed) {
    roomData.log.push('Both players scammed. Each player took back their offered cards.');
  } else {
    const scammer = initiatorScammed ? initiator.name : responder.name;
    roomData.log.push(`${scammer} scammed successfully and took back their offered cards.`);
  }

  roomData.activeTrade = null;
  autoCompleteAllGoals(roomData);
  emitGameState(roomData);
}


function chooseDiscardCard(roomData, socketId, payload) {
  const player = roomData.players.find((p) => p.socketId === socketId);
  if (!player) return fail('You are not in this room.');

  const choice = roomData.pendingChoice;
  if (!choice || choice.type !== 'magicHandDiscard') return fail('There is no discard pile choice to resolve.');
  if (choice.actorName !== player.name) return fail('Only the Magic Hand player can choose from the discard pile.');

  const cardId = String(payload.cardId || '');
  if (!choice.choices.some((card) => card.id === cardId)) {
    return fail('That card was not available from the Magic Hand selection.');
  }

  const discardIndex = roomData.playDiscard.findIndex((card) => card.id === cardId);
  if (discardIndex === -1) {
    roomData.pendingChoice = null;
    return fail('That card is no longer in the discard pile.');
  }

  const [chosen] = roomData.playDiscard.splice(discardIndex, 1);
  player.hand.push(chosen);
  roomData.pendingChoice = null;
  roomData.log.push(`${player.name} took ${chosen.name} from the discard pile with Magic Hand.`);
  pushNotice(roomData, `${player.name} took a card from the discard pile.`, 'choice');
  autoCompleteGoals(roomData, player);
  return ok();
}

function discardCard(roomData, socketId, payload) {
  const player = roomData.players.find((p) => p.socketId === socketId);
  if (!player) return fail('You are not in this room.');
  if (currentPlayer(roomData)?.name !== player.name) return fail('It is not your turn.');
  if (!player.mustDiscard) return fail('You only discard when ending your turn above the 8-card hand limit.');
  if (roomData.pendingAction) return fail('Wait for the current action to resolve first.');
  if (roomData.pendingChoice) return fail('Finish the current card choice first.');
  if (roomData.activeTrade) return fail('Finish or cancel the active trade before discarding.');

  const cardIndex = Number(payload.cardIndex);
  if (!Number.isInteger(cardIndex) || cardIndex < 0 || cardIndex >= player.hand.length) {
    return fail('That card is not in your hand.');
  }

  const [discarded] = player.hand.splice(cardIndex, 1);
  roomData.playDiscard.push(discarded);
  roomData.log.push(`${player.name} discarded ${discarded.name}.`);

  if (player.mustDiscard && player.hand.length <= 8) {
    player.mustDiscard = false;
    advanceTurn(roomData);
  }

  return ok();
}

function rerollGoal(roomData, socketId, payload) {
  const player = currentPlayer(roomData);
  if (!player || player.socketId !== socketId) return fail('It is not your turn.');
  if (roomData.winner) return fail('The game is already over.');
  if (roomData.pendingAction) return fail('Wait for the current action to resolve first.');
  if (roomData.pendingChoice) return fail('Finish the current card choice first.');
  if (roomData.activeTrade) return fail('Finish or cancel the active trade first.');
  if (player.goalRerolled) return fail('You have already rerolled a goal this turn.');

  const goalIndex = Number(payload.goalIndex);
  if (!Number.isInteger(goalIndex) || goalIndex < 0 || goalIndex >= player.goals.length) {
    return fail('Choose a goal card to reroll.');
  }

  const [oldGoal] = player.goals.splice(goalIndex, 1);
  roomData.goalDiscard.push(oldGoal);
  const newGoal = drawCard(roomData, 'goal');
  if (newGoal) player.goals.push(newGoal);
  player.goalRerolled = true;
  roomData.log.push(`${player.name} rerolled ${oldGoal.name}.`);
  autoCompleteGoals(roomData, player);
  return ok();
}

function claimGoal(roomData, socketId, payload) {
  const player = roomData.players.find((p) => p.socketId === socketId);
  if (!player) return fail('You are not in this room.');
  if (roomData.winner) return fail('The game is already over.');

  const goalIndex = Number(payload.goalIndex);
  if (!Number.isInteger(goalIndex) || goalIndex < 0 || goalIndex >= player.goals.length) {
    return fail('Choose a goal card to claim.');
  }

  const goal = player.goals[goalIndex];
  if (goal.key === 'investor') {
    return fail('Use the Investor modal to complete this goal.');
  }

  return fail('This goal is completed automatically when its conditions are met.');
}

function completeInvestor(roomData, socketId, payload) {
  const player = roomData.players.find((p) => p.socketId === socketId);
  if (!player) return fail('You are not in this room.');
  if (roomData.winner) return fail('The game is already over.');
  if (roomData.pendingAction) return fail('Wait for the current action to resolve first.');
  if (roomData.pendingChoice) return fail('Finish the current card choice first.');
  if (roomData.activeTrade) return fail('Finish or cancel the active trade first.');
  if (currentPlayer(roomData)?.name !== player.name) return fail('You can complete Investor only on your turn.');

  const goalIndex = Number(payload.goalIndex);
  if (!Number.isInteger(goalIndex) || goalIndex < 0 || goalIndex >= player.goals.length) {
    return fail('Choose your Investor goal.');
  }

  const goal = player.goals[goalIndex];
  if (goal.key !== 'investor') return fail('That goal is not Investor.');

  const target = roomData.players.find((p) => p.name === payload.targetName);
  if (!target || target.name === player.name) return fail('Choose another player to receive the investment.');

  const moneyCardIds = uniqueIds(payload.moneyCardIds);
  if (moneyCardIds.length < 2) return fail('Investor needs at least 2 Money cards.');

  const selectedCards = [];
  for (const id of moneyCardIds) {
    const card = player.storage.find((storedCard) => storedCard.id === id);
    if (!card || card.key !== 'money') return fail('Every invested card must be Money from your storage.');
    selectedCards.push(card);
  }

  player.storage = player.storage.filter((card) => !moneyCardIds.includes(card.id));
  target.storage.push(...selectedCards);

  const points = calculateInvestorPoints(selectedCards.length);
  completeGoal(roomData, player, goalIndex, points, ` by investing ${selectedCards.length} Money in ${target.name}`);
  autoCompleteAllGoals(roomData);
  return ok();
}

function calculateInvestorPoints(moneyCount) {
  return Math.max(1, moneyCount - 1);
}

function completeGoal(roomData, player, goalIndex, scoreOverride, logDetail = '') {
  const [completed] = player.goals.splice(goalIndex, 1);
  const points = Number.isFinite(scoreOverride) ? scoreOverride : completed.points || 1;
  player.score += points;
  roomData.goalDiscard.push(completed);
  const replacement = drawCard(roomData, 'goal');
  if (replacement) player.goals.push(replacement);

  roomData.log.push(`${player.name} completed ${completed.name}${logDetail} for ${points} point${points === 1 ? '' : 's'}.`);
  pushNotice(roomData, `${player.name} completed ${completed.name} for ${points} point${points === 1 ? '' : 's'}.`, 'goal');
  if (player.score >= 10 && !roomData.winner) {
    roomData.winner = player.name;
    clearRoomTimers(roomData);
    roomData.log.push(`${player.name} wins Machiavellian Pursuits!`);
  }
}

function autoCompleteAllGoals(roomData) {
  for (const player of roomData.players) {
    autoCompleteGoals(roomData, player);
    if (roomData.winner) break;
  }
}

function autoCompleteGoals(roomData, player) {
  if (!player || roomData.winner) return;

  let safety = 0;
  while (!roomData.winner && safety < 20) {
    safety++;
    const goalIndex = player.goals.findIndex((goal) => goal.key !== 'investor' && canCompleteGoal(player, goal));
    if (goalIndex === -1) break;
    completeGoal(roomData, player, goalIndex);
  }
}

function markGoalFlags(roomData, player, card, payload) {
  player.flags = player.flags || {};
  if (card.key === 'oraclesPower' || card.key === 'totalRenewal') {
    player.flags.usedOracleOrRenewal = true;
  }

  if ((card.key === 'theft' || card.key === 'robbery') && payload.targetName) {
    if (payload.targetHadMostResourcesBeforeAction) {
      player.flags.robinHoodHit = true;
    }
  }
}

function canCompleteGoal(player, goal) {
  if (!goal || goal.key === 'investor') return false;
  const counts = countByKey(player.storage);

  if (goal.requirement && !meetsRequirement(counts, goal.requirement)) return false;
  if (goal.anyRequirement && !goal.anyRequirement.some((req) => meetsRequirement(counts, req))) return false;

  if (goal.custom === 'sevenDifferentResources') {
    const uniqueResources = new Set(player.storage.filter((c) => c.type === 'resource').map((c) => c.key));
    return uniqueResources.size >= 7;
  }

  if (goal.custom === 'sevenActionsInHand') {
    return player.hand.filter((c) => c.type === 'action').length >= 7;
  }

  if (goal.custom) return Boolean(player.flags?.[goal.custom]);
  return Boolean(goal.requirement || goal.anyRequirement);
}

function meetsRequirement(counts, requirement) {
  return Object.entries(requirement).every(([key, needed]) => (counts[key] || 0) >= needed);
}

function countByKey(cards) {
  return cards.reduce((acc, card) => {
    acc[card.key] = (acc[card.key] || 0) + 1;
    return acc;
  }, {});
}

function chooseGoalIndex(player, requestedIndex) {
  const parsed = Number(requestedIndex);
  if (Number.isInteger(parsed) && parsed >= 0 && parsed < player.goals.length) return parsed;
  return 0;
}

function drawMany(roomData, deckType, count) {
  const cards = [];
  for (let i = 0; i < count; i++) cards.push(drawCard(roomData, deckType));
  return cards.filter(Boolean);
}

function drawCardToPlayer(roomData, player, deckType, count) {
  const cards = drawMany(roomData, deckType, count);
  player.hand.push(...cards);
  return cards;
}

function drawCard(roomData, deckType) {
  const deckKey = deckType === 'goal' ? 'goalDeck' : 'playDeck';
  const discardKey = deckType === 'goal' ? 'goalDiscard' : 'playDiscard';

  if (roomData[deckKey].length === 0) {
    roomData[deckKey] = shuffle(roomData[discardKey].splice(0));
  }

  return roomData[deckKey].pop() || null;
}

function buildDeck(defs) {
  const deck = [];
  for (const def of defs) {
    for (let i = 0; i < def.count; i++) {
      deck.push({
        id: `${def.key}-${i}-${Math.random().toString(36).slice(2, 8)}`,
        key: def.key,
        name: def.name,
        type: def.type || 'goal',
        points: def.points,
        description: def.description,
        specialResource: Boolean(def.specialResource),
        specialCompletion: def.specialCompletion,
        needsTarget: Boolean(def.needsTarget),
        reaction: Boolean(def.reaction),
        tradeTool: Boolean(def.tradeTool),
        requirement: def.requirement,
        anyRequirement: def.anyRequirement,
        custom: def.custom,
      });
    }
  }
  return shuffle(deck);
}

function shuffle(cards) {
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function currentPlayer(roomData) {
  return roomData.players[roomData.currentPlayerIndex];
}

function getPublicGameState(roomData) {
  const current = currentPlayer(roomData);
  return {
    room: roomData.id,
    started: roomData.started,
    winner: roomData.winner,
    leader: roomData.leader,
    currentPlayerName: current?.name || null,
    pendingAction: sanitisePendingAction(roomData.pendingAction),
    activeTrade: sanitiseTrade(roomData.activeTrade),
    notice: roomData.notice,
    deckCounts: {
      playing: roomData.playDeck.length,
      playingDiscard: roomData.playDiscard.length,
      goals: roomData.goalDeck.length,
      goalDiscard: roomData.goalDiscard.length,
    },
    discardPile: {
      playing: roomData.playDiscard || [],
      goals: roomData.goalDiscard || [],
    },
    pendingChoice: sanitisePendingChoice(roomData.pendingChoice),
    players: roomData.players.map((p) => ({
      name: p.name,
      connected: p.connected !== false,
      score: p.score || 0,
      handCount: p.hand?.length || 0,
      storage: p.storage || [],
      storageCount: p.storage?.length || 0,
      goalCount: p.goals?.length || 0,
      ready: p.ready || false,
      isLeader: p.name === roomData.leader,
      avatarInitial: getInitial(p.name),
      avatarColor: p.avatarColor || fallbackAvatarColor(p.name),
      mustDiscard: p.mustDiscard || false,
    })),
    log: roomData.log.slice(-30).reverse(),
  };
}

function getPrivatePlayerState(roomData, player) {
  const pendingAction = roomData.pendingAction;
  const activeTrade = roomData.activeTrade;
  return {
    name: player.name,
    connected: player.connected !== false,
    score: player.score || 0,
    hand: player.hand || [],
    storage: player.storage || [],
    goals: (player.goals || []).map((goal) => ({
      ...goal,
      canComplete: canCompleteGoal(player, goal),
      investorMoneyAvailable: goal.key === 'investor' ? player.storage.filter((card) => card.key === 'money').length : 0,
    })),
    actionPlayed: player.actionPlayed || false,
    goalRerolled: player.goalRerolled || false,
    tradeUsed: player.tradeUsed || false,
    mustDiscard: player.mustDiscard || false,
    isYourTurn: currentPlayer(roomData)?.name === player.name,
    isLeader: player.name === roomData.leader,
    avatarInitial: getInitial(player.name),
    avatarColor: player.avatarColor || fallbackAvatarColor(player.name),
    privateReveal: player.privateReveal || null,
    pendingChoice: roomData.pendingChoice?.actorName === player.name ? { ...roomData.pendingChoice } : null,
    canReactToAction: Boolean(
      pendingAction &&
      pendingAction.actorName !== player.name &&
      Date.now() <= pendingAction.expiresAt &&
      player.hand.some((card) => CANCEL_REACTION_KEYS.has(card.key))
    ),
    canCreateTrade: Boolean(
      currentPlayer(roomData)?.name === player.name &&
      !player.tradeUsed &&
      !player.mustDiscard &&
      !roomData.pendingAction &&
      !roomData.pendingChoice &&
      !roomData.activeTrade &&
      !roomData.winner
    ),
    canPlayScam: Boolean(
      activeTrade &&
      activeTrade.state === 'scamWindow' &&
      [activeTrade.initiatorName, activeTrade.responderName].includes(player.name) &&
      !activeTrade.bindingUsed &&
      !activeTrade.scamsPlayed?.[player.name] &&
      Date.now() <= activeTrade.scamEndsAt &&
      player.hand.some((card) => card.key === 'itsAScam')
    ),
  };
}

function sanitisePendingAction(pending) {
  if (!pending) return null;
  return {
    id: pending.id,
    actorName: pending.actorName,
    card: pending.card,
    targetName: pending.payload?.targetName || null,
    expiresAt: pending.expiresAt,
    startedAt: pending.startedAt,
  };
}

function sanitisePendingChoice(choice) {
  if (!choice) return null;
  return {
    id: choice.id,
    type: choice.type,
    actorName: choice.actorName,
    createdAt: choice.createdAt,
  };
}

function sanitiseTrade(trade) {
  if (!trade) return null;
  return {
    id: trade.id,
    state: trade.state,
    initiatorName: trade.initiatorName,
    targetName: trade.targetName,
    responderName: trade.responderName,
    initiatorOffer: trade.initiatorOfferSnapshot || trade.initiatorOfferCards || [],
    responderOffer: trade.responderOfferSnapshot || trade.responderOfferCards || [],
    bindingUsed: trade.bindingUsed,
    scamsPlayed: Object.keys(trade.scamsPlayed || {}),
    createdAt: trade.createdAt,
    scamEndsAt: trade.scamEndsAt,
  };
}

function setReady(room, name, ready) {
  const roomData = rooms[room];
  if (!roomData || roomData.started) return false;
  const player = roomData.players.find((p) => p.name === name);
  if (!player) return false;
  player.ready = ready;
  return true;
}

function leaveRoom(socket, room, playerName, explicitLeave) {
  const roomData = rooms[room];
  if (!roomData) return;

  if (roomData.started) {
    const player = roomData.players.find((p) => p.name === playerName || p.socketId === socket.id);
    if (player) {
      player.connected = false;
      handlePlayerLeftActiveFlow(roomData, player.name);
      if (explicitLeave) roomData.log.push(`${player.name} left the table. They can still rejoin with the same name.`);
    }
    return;
  }

  removePlayerFromLobby(room, playerName);
}

function handlePlayerLeftActiveFlow(roomData, playerName) {
  if (roomData.pendingChoice?.actorName === playerName) {
    roomData.pendingChoice = null;
    roomData.log.push(`The pending card choice was cancelled because ${playerName} left.`);
  }
  const trade = roomData.activeTrade;
  if (trade && [trade.initiatorName, trade.responderName].includes(playerName)) {
    if (trade.state === 'scamWindow') {
      finalizeScamWindow(roomData, trade.id);
    } else {
      if (trade.timer) clearTimeout(trade.timer);
      roomData.activeTrade = null;
      roomData.log.push(`The active trade was cancelled because ${playerName} left.`);
    }
  }
}

function removePlayerFromLobby(room, playerName) {
  const roomData = rooms[room];
  if (!roomData) return;

  const playerIndex = roomData.players.findIndex((p) => p.name === playerName);
  if (playerIndex === -1) return;

  const [removedPlayer] = roomData.players.splice(playerIndex, 1);
  if (roomData.leader === removedPlayer.name && roomData.players[0]) {
    roomData.leader = roomData.players[0].name;
  }

  if (roomData.players.length === 0) {
    clearRoomTimers(roomData);
    delete rooms[room];
    console.log(`Room ${room} deleted as it became empty`);
  }
}

function createPlayer(name, socketId) {
  return {
    name,
    socketId,
    connected: true,
    ready: false,
    score: 0,
    hand: [],
    storage: [],
    goals: [],
    actionPlayed: false,
    goalRerolled: false,
    tradeUsed: false,
    mustDiscard: false,
    flags: {},
    privateReveal: null,
    avatarColor: randomAvatarColor(),
  };
}

function slimPlayer(roomData, player) {
  return {
    name: player.name,
    ready: player.ready,
    connected: player.connected !== false,
    isLeader: player.name === roomData.leader,
    avatarInitial: getInitial(player.name),
    avatarColor: player.avatarColor || fallbackAvatarColor(player.name),
  };
}

function clearRoomTimers(roomData) {
  if (roomData.pendingAction?.timer) clearTimeout(roomData.pendingAction.timer);
  if (roomData.activeTrade?.timer) clearTimeout(roomData.activeTrade.timer);
  roomData.pendingAction = null;
  roomData.activeTrade = null;
  roomData.pendingChoice = null;
}

function pushNotice(roomData, text, type = 'info') {
  roomData.notice = {
    id: makeEventId(roomData, 'notice'),
    text,
    type,
    createdAt: Date.now(),
  };
}

function makeEventId(roomData, prefix) {
  roomData.nextEventId = (roomData.nextEventId || 1) + 1;
  return `${prefix}-${roomData.nextEventId}`;
}

function collectCardsByIds(cards, ids) {
  const found = [];
  for (const id of ids) {
    const card = cards.find((candidate) => candidate.id === id);
    if (!card) return { ok: false, cards: [] };
    found.push(card);
  }
  return { ok: true, cards: found };
}

function removeCardsByIds(cards, ids) {
  const found = collectCardsByIds(cards, ids);
  if (!found.ok) return found;
  const idSet = new Set(ids);
  for (let i = cards.length - 1; i >= 0; i--) {
    if (idSet.has(cards[i].id)) cards.splice(i, 1);
  }
  return found;
}

function moveCardsByIds(source, destination, ids) {
  const removed = removeCardsByIds(source, ids);
  if (removed.ok) destination.push(...removed.cards);
  return removed.ok;
}

function uniqueIds(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((id) => String(id)).filter(Boolean))];
}

function formatCardList(cards) {
  if (!cards.length) return 'nothing';
  return cards.map((card) => card.name).join(', ');
}


const AVATAR_COLORS = [
  '#7c3aed', '#2563eb', '#0891b2', '#059669', '#65a30d', '#ca8a04',
  '#ea580c', '#dc2626', '#db2777', '#9333ea', '#0f766e', '#b45309',
];

function randomAvatarColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

function fallbackAvatarColor(name) {
  const source = String(name || 'Player');
  let hash = 0;
  for (let i = 0; i < source.length; i++) hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function getInitial(name) {
  return String(name || '?').trim().slice(0, 1).toUpperCase() || '?';
}

function generateRoomCode() {
  let code;
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms[code]);
  return code;
}

function cleanName(name) {
  return String(name || '').trim().slice(0, 16);
}

function ok(logSuffix = '') {
  return { ok: true, logSuffix };
}

function fail(message) {
  return { ok: false, message };
}
