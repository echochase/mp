import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/game.css";

const playingCardImages = import.meta.glob("/src/assets/cards/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});

const goalCardImages = import.meta.glob("/src/assets/goal-cards/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});

const imageMap = Object.entries({ ...playingCardImages, ...goalCardImages }).reduce(
  (acc, [path, src]) => {
    const key = path
      .split("/")
      .pop()
      .replace(/\.[^/.]+$/, "");
    acc[key] = src;
    return acc;
  },
  {}
);

const STANDARD_RESOURCE_ORDER = ["workforce", "candy", "money", "wood", "land", "steel"];
const SPECIAL_RESOURCE_ORDER = ["gold", "diamond"];
const CANCEL_REACTION_KEYS = ["iThinkNot", "absolutelyNot"];
const TRADE_TOOL_KEYS = ["itsAScam", "bindingContract"];
const TARGETED_ACTION_KEYS = ["theft", "robbery", "goalRemoval", "goalSwap", "oraclesPower"];

const AVATAR_COLORS = [
  "#7c3aed",
  "#2563eb",
  "#0891b2",
  "#059669",
  "#65a30d",
  "#ca8a04",
  "#ea580c",
  "#dc2626",
  "#db2777",
  "#9333ea",
  "#0f766e",
  "#b45309",
];

const getInitial = (player = {}) =>
  (player.avatarInitial || player.name || "?").trim().slice(0, 1).toUpperCase() || "?";

const fallbackAvatarColor = (name = "Player") => {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const getAvatarStyle = (player = {}) => ({
  background: player.avatarColor || fallbackAvatarColor(player.name || "Player"),
});

const summarizeGoal = (goal) => {
  const text = goal?.description || "Complete this goal automatically when its condition is met.";
  if (goal?.key === "investor") return "Invest 2+ stored Money into another player.";
  return text.length > 86 ? `${text.slice(0, 83).trim()}...` : text;
};

const titleCase = (value = "") =>
  value
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getCardImage = (card) => imageMap[card?.key] || imageMap[card?.name] || null;

const getSortRank = (card) => {
  if (card?.type === "resource") {
    if (SPECIAL_RESOURCE_ORDER.includes(card.key)) return 1;
    return 0;
  }
  return 2;
};

const getResourceOrder = (card) => {
  const standardIndex = STANDARD_RESOURCE_ORDER.indexOf(card?.key);
  if (standardIndex >= 0) return standardIndex;
  const specialIndex = SPECIAL_RESOURCE_ORDER.indexOf(card?.key);
  if (specialIndex >= 0) return 100 + specialIndex;
  return 999;
};

const sortCards = (a, b) => {
  const rankDiff = getSortRank(a) - getSortRank(b);
  if (rankDiff !== 0) return rankDiff;

  if (a?.type === "resource" && b?.type === "resource") {
    const resourceDiff = getResourceOrder(a) - getResourceOrder(b);
    if (resourceDiff !== 0) return resourceDiff;
  }

  return (a?.name || "").localeCompare(b?.name || "");
};

const groupCardsByKey = (cards = []) => {
  const groups = new Map();
  cards.forEach((card) => {
    if (!groups.has(card.key)) groups.set(card.key, []);
    groups.get(card.key).push(card);
  });

  return Array.from(groups.values())
    .map((group) => ({ card: group[0], cards: group, count: group.length }))
    .sort((a, b) => sortCards(a.card, b.card));
};

const formatCountdown = (targetTime, now) => {
  if (!targetTime) return "0.0s";
  return `${Math.max(0, (targetTime - now) / 1000).toFixed(1)}s`;
};

export const Game = ({ socket, name, room, setRoom }) => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const previousStateRef = useRef(null);
  const newCardTimerRef = useRef(null);
  const noticeTimerRef = useRef(null);
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState("");
  const [noticeToast, setNoticeToast] = useState(null);
  const [newCardIds, setNewCardIds] = useState(new Set());
  const [turnPulse, setTurnPulse] = useState(0);
  const [discardPileOpen, setDiscardPileOpen] = useState(false);
  const [goalDiscardPileOpen, setGoalDiscardPileOpen] = useState(false);
  const [completedGoalsPileOpen, setCompletedGoalsPileOpen] = useState(false);
  const [dismissedRevealIds, setDismissedRevealIds] = useState(new Set());
  const [investorGoal, setInvestorGoal] = useState(null);
  const [actionModalCard, setActionModalCard] = useState(null);
  const [tradeBuilderOpen, setTradeBuilderOpen] = useState(false);
  const [tradeResponseOpen, setTradeResponseOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!socket) return;
    if (!name) {
      navigate("/");
      return;
    }

    if (!room) setRoom(roomCode);

    const handleGameState = (state) => {
      setGameState(state);
      if (!state.activeTrade) {
        setTradeResponseOpen(false);
      }
    };

    const handleResumeSuccess = ({ started }) => {
      if (!started) navigate(`/lobby/${roomCode}`);
    };

    const handleRoomNotFound = () => navigate("/");
    const handleNotInRoom = () => navigate("/");
    const handleGameError = (message) => {
      setError(message);
      window.setTimeout(() => setError(""), 3500);
    };

    socket.emit("resume-game", roomCode, name);
    socket.on("game-state", handleGameState);
    socket.on("resume-success", handleResumeSuccess);
    socket.on("room-not-found", handleRoomNotFound);
    socket.on("not-in-room-error", handleNotInRoom);
    socket.on("game-error", handleGameError);

    return () => {
      socket.off("game-state", handleGameState);
      socket.off("resume-success", handleResumeSuccess);
      socket.off("room-not-found", handleRoomNotFound);
      socket.off("not-in-room-error", handleNotInRoom);
      socket.off("game-error", handleGameError);
    };
  }, [socket, name, room, roomCode, navigate, setRoom]);

  useEffect(() => {
    if (!gameState?.me) return;

    const previous = previousStateRef.current;
    if (previous?.me) {
      const previousHandIds = new Set(previous.me.hand.map((card) => card.id));
      const addedIds = gameState.me.hand
        .filter((card) => !previousHandIds.has(card.id))
        .map((card) => card.id);

      if (addedIds.length > 0) {
        window.clearTimeout(newCardTimerRef.current);
        setNewCardIds(new Set(addedIds));
        newCardTimerRef.current = window.setTimeout(() => setNewCardIds(new Set()), 1800);
      }

      if (previous.currentPlayerName !== gameState.currentPlayerName) {
        setTurnPulse((value) => value + 1);
      }
    }

    previousStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    if (!gameState?.notice?.id) {
      setNoticeToast(null);
      return;
    }
    setNoticeToast(gameState.notice);
    window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setNoticeToast(null), 3200);
  }, [gameState?.notice?.id, gameState?.notice]);

  useEffect(() => {
    if (!gameState?.pendingAction && gameState?.activeTrade?.state !== "scamWindow") return undefined;
    const interval = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(interval);
  }, [gameState?.pendingAction, gameState?.activeTrade?.state]);

useEffect(
    () => () => {
      window.clearTimeout(newCardTimerRef.current);
      window.clearTimeout(noticeTimerRef.current);
    },
    []
  );

  const me = gameState?.me;
  const opponents = useMemo(
    () => gameState?.players?.filter((player) => player.name !== name) || [],
    [gameState, name]
  );

  const currentPlayer = gameState?.players?.find(
    (player) => player.name === gameState.currentPlayerName
  );
  const defaultTargetName = opponents[0]?.name || "";
  const currentTurnPlayer = gameState?.players?.find((player) => player.name === gameState.currentPlayerName);
  const oracleReveal = me?.privateReveal && !dismissedRevealIds.has(me.privateReveal.id) ? me.privateReveal : null;
  const magicHandChoice = me?.pendingChoice?.type === "magicHandDiscard" ? me.pendingChoice : null;

  const sortedHand = useMemo(
    () =>
      (me?.hand || [])
        .map((card, originalIndex) => ({ ...card, originalIndex }))
        .sort(sortCards),
    [me?.hand]
  );

  const tableLocked = Boolean(gameState?.pendingAction || gameState?.activeTrade || gameState?.pendingChoice || me?.pendingChoice);

  const playCard = (card, extraPayload = {}) => {
    socket.emit("play-card", roomCode, { cardIndex: card.originalIndex, ...extraPayload });
  };

  const beginPlayCard = (card) => {
    const needsModal = TARGETED_ACTION_KEYS.includes(card.key) || card.needsTarget;
    if (needsModal && card.type === "action" && !CANCEL_REACTION_KEYS.includes(card.key)) {
      setActionModalCard(card);
      return;
    }
    playCard(card, {});
  };

  const discardCard = (card) =>
    socket.emit("discard-card", roomCode, { cardIndex: card.originalIndex });

  const rerollGoal = (goalIndex) => socket.emit("reroll-goal", roomCode, { goalIndex });

  const completeInvestor = ({ goalIndex, targetName: investorTargetName, moneyCardIds }) => {
    socket.emit("complete-investor", roomCode, {
      goalIndex,
      targetName: investorTargetName,
      moneyCardIds,
    });
    setInvestorGoal(null);
  };

  const createTrade = (payload) => {
    socket.emit("create-trade", roomCode, payload);
    setTradeBuilderOpen(false);
  };

  const respondTrade = (payload) => {
    socket.emit("respond-trade", roomCode, payload);
    setTradeResponseOpen(false);
  };

  const acceptTrade = () => socket.emit("accept-trade", roomCode);
  const declineTrade = () => socket.emit("decline-trade", roomCode);
  const playScam = () => socket.emit("play-scam", roomCode);
  const chooseDiscardCard = (cardId) => socket.emit("choose-discard-card", roomCode, { cardId });
  const endTurn = () => socket.emit("end-turn", roomCode);

  const leaveTable = () => {
    socket.emit("leave-room", roomCode, name);
    navigate("/");
  };

  if (!socket || !gameState || !me) {
    return (
      <main className="game-page game-page-centered">
        <section className="game-panel loading-panel">
          <p className="eyebrow">Machiavellian Pursuits</p>
          <h1>Finding your table...</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="game-page">
      <header className="game-header compact-header">
        <div>
          <p className="eyebrow">Room {roomCode}</p>
          <h1>Machiavellian Pursuits</h1>
        </div>
        <div key={turnPulse} className="turn-card turn-card-attention current-turn-card">
          {!gameState.winner && currentTurnPlayer && <PlayerAvatar player={currentTurnPlayer} size="large" />}
          <div>
            <span>Current turn</span>
            <strong>{gameState.winner ? "Game Over" : gameState.currentPlayerName}</strong>
          </div>
        </div>
      </header>

      {turnPulse > 0 && !gameState.winner && (
        <div key={`turn-splash-${turnPulse}`} className="turn-splash">
          <span>Turn changed</span>
          <strong>{gameState.currentPlayerName}</strong>
        </div>
      )}

      {gameState.winner && (
        <section className="winner-banner compact-winner-banner">
          <p className="eyebrow">Victory</p>
          <h2>{gameState.winner} wins the pursuit.</h2>
          <button onClick={() => navigate("/")}>Return Home</button>
        </section>
      )}

      {error && <div className="game-toast danger-toast">{error}</div>}
      {noticeToast && <div className={`game-toast notice-toast ${noticeToast.type || "info"}`}>{noticeToast.text}</div>}

      <section className="table-layout">
        {/* ── LEFT SIDEBAR: progress + goals + completed goals ── */}
        <aside className="game-sidebar">
          <MyProgressPanel me={me} isCurrent={me.name === gameState.currentPlayerName} />
          <section className="game-panel goals-panel compact-panel compact-goals-panel">
            <div className="panel-heading small-heading">
              <p className="eyebrow">Private</p>
              <h2>Your Goals</h2>
            </div>
            <div className="goals-grid compact-goals-grid">
              {me.goals.map((goal, index) => (
                <GoalCard
                  key={goal.id || `${goal.key}-${index}`}
                  goal={goal}
                  index={index}
                  disabled={Boolean(gameState.winner) || tableLocked}
                  isYourTurn={me.isYourTurn}
                  goalRerolled={me.goalRerolled}
                  onReroll={() => rerollGoal(index)}
                  onInvestor={() => setInvestorGoal({ goal, goalIndex: index })}
                />
              ))}
            </div>
          </section>
          <CompletedGoalsPanel
            completedGoals={me.completedGoals || []}
            onOpen={() => setCompletedGoalsPileOpen(true)}
          />
        </aside>

        {/* ── CENTRE: tabletop ── */}
        <section className="tabletop-column">
          {gameState.pendingAction && (
            <PendingActionPanel
              pendingAction={gameState.pendingAction}
              me={me}
              now={now}
              onReact={(card) => playCard(card)}
              hand={sortedHand}
            />
          )}
          {gameState.activeTrade && (
            <ActiveTradePanel
              trade={gameState.activeTrade}
              name={name}
              me={me}
              now={now}
              onRespond={() => setTradeResponseOpen(true)}
              onAccept={acceptTrade}
              onDecline={declineTrade}
              onScam={playScam}
            />
          )}
          <TableTopView
            players={gameState.players}
            me={me}
            currentPlayerName={gameState.currentPlayerName}
            meName={name}
            discardPile={gameState.discardPile}
            deckCounts={gameState.deckCounts}
            onOpenCardDiscard={() => setDiscardPileOpen(true)}
            onOpenGoalDiscard={() => setGoalDiscardPileOpen(true)}
          />

          <section className="game-panel hand-panel compact-panel compact-hand-strip">
            <div className="panel-heading split-heading small-heading">
              <div>
                <p className="eyebrow">Your hand</p>
                <h2>{me.hand.length} cards</h2>
              </div>
              <div className="hand-header-right">
                <div className="hand-sort-note">
                  <span>Resources</span>
                  <span>Special</span>
                  <span>Actions</span>
                </div>
                {me.mustDiscard && <span className="danger-pill">Discard {me.hand.length - 8}</span>}
                <div className="hand-action-buttons">
                  <button
                    className="ghost-button"
                    disabled={!me.canCreateTrade}
                    onClick={() => setTradeBuilderOpen(true)}
                  >
                    Trade
                  </button>
                  {!gameState.pendingAction && !gameState.pendingChoice && !me.pendingChoice && (
                    <button
                      className="gold-button"
                      disabled={!me.isYourTurn || me.mustDiscard || Boolean(gameState.winner) || tableLocked}
                      onClick={endTurn}
                    >
                      End Turn
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="card-strip compact-card-strip">
              {sortedHand.map((card, displayIndex) => (
                <PlayingCard
                  key={card.id || `${card.key}-${displayIndex}`}
                  card={card}
                  displayIndex={displayIndex}
                  isNew={newCardIds.has(card.id)}
                  disabled={Boolean(gameState.winner || gameState.pendingChoice || me.pendingChoice)}
                  isYourTurn={me.isYourTurn}
                  actionPlayed={me.actionPlayed}
                  mustDiscard={me.mustDiscard}
                  pendingAction={gameState.pendingAction}
                  activeTrade={gameState.activeTrade || gameState.pendingChoice || me.pendingChoice}
                  canReactToAction={me.canReactToAction}
                  onPlay={() => beginPlayCard(card)}
                  onDiscard={() => discardCard(card)}
                />
              ))}
            </div>
          </section>
        </section>

        {/* ── RIGHT SIDEBAR: seating order + history ── */}
        <aside className="game-sidebar">
          <section className="game-panel compact-panel">
            <div className="panel-heading split-heading small-heading">
              <div>
                <p className="eyebrow">Players</p>
                <h2>Seating Order</h2>
              </div>
              <span className="deck-pill">{gameState.players.length} seated</span>
            </div>
            <SeatingOrder
              players={gameState.players}
              currentPlayerName={gameState.currentPlayerName}
              meName={name}
              showScore={false}
            />
          </section>
          <section className="game-panel log-panel compact-panel compact-log-panel">
            <div className="panel-heading small-heading">
              <p className="eyebrow">History</p>
              <h2>Table Log</h2>
            </div>
            <div className="log-list compact-log-list">
              {gameState.log.slice().reverse().map((entry, index) => (
                <p key={`${entry}-${index}`}>{entry}</p>
              ))}
            </div>
          </section>
        </aside>
      </section>

      {actionModalCard && (
        <ActionTargetModal
          card={actionModalCard}
          gameState={gameState}
          me={me}
          opponents={opponents}
          defaultTargetName={defaultTargetName}
          onClose={() => setActionModalCard(null)}
          onConfirm={(payload) => {
            playCard(actionModalCard, payload);
            setActionModalCard(null);
          }}
         
        />
      )}

      {tradeBuilderOpen && (
        <TradeBuilderModal
          hand={sortedHand}
          opponents={opponents}
          defaultTargetName={defaultTargetName}
          onClose={() => setTradeBuilderOpen(false)}
          onConfirm={createTrade}
         
        />
      )}

      {tradeResponseOpen && gameState.activeTrade && (
        <TradeResponseModal
          hand={sortedHand}
          trade={gameState.activeTrade}
          onClose={() => setTradeResponseOpen(false)}
          onConfirm={respondTrade}
         
        />
      )}

      {investorGoal && (
        <InvestorModal
          goal={investorGoal.goal}
          goalIndex={investorGoal.goalIndex}
          storage={me.storage}
          opponents={opponents}
          defaultTargetName={defaultTargetName}
          onClose={() => setInvestorGoal(null)}
          onConfirm={completeInvestor}
         
        />
      )}

      {completedGoalsPileOpen && (
        <DiscardPileModal
          title="Completed Goals"
          goalCards={me.completedGoals || []}
          onClose={() => setCompletedGoalsPileOpen(false)}
        />
      )}

      {goalDiscardPileOpen && (
        <DiscardPileModal
          title="Goal Discard"
          goalCards={gameState.discardPile?.goals || []}
          onClose={() => setGoalDiscardPileOpen(false)}
        />
      )}
      
      {discardPileOpen && (
        <DiscardPileModal
          title="Card Discard"
          playingCards={gameState.discardPile?.playing || []}
          onClose={() => setDiscardPileOpen(false)}
        />
      )}

      {magicHandChoice && (
        <MagicHandChoiceModal choice={magicHandChoice} onConfirm={chooseDiscardCard} />
      )}

      {oracleReveal && (
        <OracleRevealModal
          reveal={oracleReveal}
          onClose={() => setDismissedRevealIds((ids) => new Set([...ids, oracleReveal.id]))}
        />
      )}

      <button className="exit-table-button compact-exit-button" onClick={leaveTable}>Leave Table</button>
    </main>
  );
};

const CardFace = ({ card, className = "", compact = false }) => {
  const image = getCardImage(card);

  return (
    <div className={`card-face-button ${compact ? "compact-face" : ""} ${className}`} aria-label={card?.name || "Card"}>
      {image ? <img src={image} alt={card.name} /> : <div className="card-fallback">{card.name}</div>}
      <span className="hover-card-details">
        <strong>{card.name || titleCase(card.key)}</strong>
        <small>{card.description || "No description available."}</small>
      </span>
    </div>
  );
};

const PlayingCard = ({
  card,
  displayIndex,
  isNew,
  disabled,
  isYourTurn,
  actionPlayed,
  mustDiscard,
  pendingAction,
  activeTrade,
  canReactToAction,
  onPlay,
  onDiscard,
}) => {
  const isResource = card.type === "resource";
  const isCancelReaction = CANCEL_REACTION_KEYS.includes(card.key);
  const isTradeTool = TRADE_TOOL_KEYS.includes(card.key);
  const tableLocked = Boolean(activeTrade || (pendingAction && !isCancelReaction));
  const canPlayResource = isResource && isYourTurn && !mustDiscard && !tableLocked;
  const canReact = isCancelReaction && canReactToAction && pendingAction;
  const canPlayNormalAction =
    !isResource &&
    !isCancelReaction &&
    !isTradeTool &&
    !mustDiscard &&
    !tableLocked &&
    isYourTurn &&
    !actionPlayed;
  const showPlayButton = canPlayResource || canPlayNormalAction || canReact;

  return (
    <article
      className={`mp-card compact-mp-card ${isResource ? "resource-card" : "action-card"} ${
        card.specialResource ? "special-resource-card" : ""
      } ${isNew ? "draw-new-card" : ""}`}
    >
      <CardFace card={card} />
      <div className="card-actions compact-card-actions">
        {mustDiscard ? (
          <button className="danger-button" disabled={disabled || Boolean(activeTrade || pendingAction)} onClick={onDiscard}>
            Discard
          </button>
        ) : showPlayButton ? (
          <button
            disabled={disabled || (!canPlayResource && !canPlayNormalAction && !canReact)}
            onClick={onPlay}
          >
            {isResource ? "Store" : isCancelReaction ? "React" : "Play"}
          </button>
        ) : (
          <span className="card-state-chip">
            {isCancelReaction ? "Reaction only" : isTradeTool ? "Trade tool" : tableLocked ? "Waiting" : "Unavailable"}
          </span>
        )}
      </div>
      <span className="card-index">#{displayIndex + 1}</span>
    </article>
  );
};

const PendingActionPanel = ({ pendingAction, me, now, onReact, hand }) => {
  const reactionCards = hand.filter((card) => CANCEL_REACTION_KEYS.includes(card.key));
  const isActor = pendingAction.actorName === me.name;
  return (
    <section className="game-panel pending-action-panel compact-panel">
      <div className="pending-action-copy">
        <p className="eyebrow">Reaction window</p>
        <h2>{pendingAction.actorName} played {pendingAction.card.name}</h2>
        <p>
          Resolves in <strong>{formatCountdown(pendingAction.expiresAt, now)}</strong>
          {pendingAction.targetName ? ` against ${pendingAction.targetName}` : ""}.
        </p>
      </div>
      <CardFace card={pendingAction.card} compact />
      <div className="pending-reaction-actions">
        {isActor && <span className="card-state-chip">Your action is pending</span>}
        {!isActor && reactionCards.length === 0 && <span className="card-state-chip">No counter card</span>}
        {!isActor && reactionCards.map((card) => (
          <button className="danger-button" key={card.id} onClick={() => onReact(card)} disabled={!me.canReactToAction}>
            Play {card.name}
          </button>
        ))}
      </div>
    </section>
  );
};

const ActiveTradePanel = ({ trade, name, me, now, onRespond, onAccept, onDecline, onScam }) => {
  const isInitiator = trade.initiatorName === name;
  const isResponder = trade.responderName === name;
  const isParticipant = isInitiator || isResponder;
  const canRespond = trade.state === "open" && !isInitiator && (!trade.targetName || trade.targetName === name);
  const canAccept = trade.state === "configured" && isInitiator;
  const canDecline = trade.state !== "scamWindow" && isParticipant;
  const isScamWindow = trade.state === "scamWindow";

  return (
    <section className="game-panel active-trade-panel compact-panel">
      <div className="trade-panel-header">
        <div>
          <p className="eyebrow">Trading</p>
          <h2>
            {trade.initiatorName} → {trade.targetName || "Everyone"}
          </h2>
          <p>
            {trade.bindingUsed ? "Binding Contract active. No scams allowed." : "Unprotected trade. Scams may happen after acceptance."}
          </p>
        </div>
        <span className={`trade-state-pill ${trade.state}`}>{titleCase(trade.state)}</span>
      </div>

      <div className="trade-offers-grid">
        <TradeOffer title={`${trade.initiatorName} offers`} cards={trade.initiatorOffer} />
        <TradeOffer title={trade.responderName ? `${trade.responderName} offers` : "Waiting for response"} cards={trade.responderOffer} />
      </div>

      {isScamWindow && (
        <div className="scam-window-row">
          <span>Scam window closes in <strong>{formatCountdown(trade.scamEndsAt, now)}</strong></span>
          <span>Scams played: {trade.scamsPlayed.length ? trade.scamsPlayed.join(", ") : "none"}</span>
        </div>
      )}

      <div className="trade-panel-actions">
        {canRespond && <button onClick={onRespond}>Respond to trade</button>}
        {canAccept && <button className="gold-button" onClick={onAccept}>Accept trade</button>}
        {canDecline && <button className="ghost-button" onClick={onDecline}>Cancel trade</button>}
        {isScamWindow && isParticipant && (
          <button className="danger-button" disabled={!me.canPlayScam} onClick={onScam}>
            {me.canPlayScam ? "Play It's a Scam" : trade.scamsPlayed.includes(name) ? "Scam played" : "No scam available"}
          </button>
        )}
        {!canRespond && !canAccept && !canDecline && !isScamWindow && <span className="card-state-chip">Waiting...</span>}
      </div>
    </section>
  );
};

const TradeOffer = ({ title, cards = [] }) => (
  <div className="trade-offer-box">
    <strong>{title}</strong>
    <div className="trade-card-row">
      {cards.length === 0 ? (
        <span className="empty-storage">Nothing</span>
      ) : (
        cards.map((card) => <CardFace key={card.id} card={card} compact />)
      )}
    </div>
  </div>
);

const GoalCard = ({
  goal,
  index,
  disabled,
  isYourTurn,
  goalRerolled,
  onReroll,
  onInvestor,
}) => {
  const isInvestor = goal.key === "investor";
  const canOpenInvestor = isInvestor && isYourTurn && (goal.investorMoneyAvailable || 0) >= 2;

  return (
    <article className={`goal-card-box compact-goal-card ${isInvestor ? "investor-goal-card" : ""}`}>
      <CardFace card={goal} compact />
      <div className="goal-meta compact-goal-meta">
        <strong>
          {isInvestor ? "Variable" : `${goal.points || 1} pt${(goal.points || 1) === 1 ? "" : "s"}`}
        </strong>
        <p>{goal.name}</p>
        <small className="goal-condition-summary">{summarizeGoal(goal)}</small>
      </div>
      <div className="goal-actions compact-goal-actions">
        {isInvestor && (
          <button disabled={disabled || !canOpenInvestor} onClick={onInvestor}>
            Invest
          </button>
        )}
        <button
          className="ghost-button"
          disabled={disabled || !isYourTurn || goalRerolled}
          onClick={onReroll}
        >
          Reroll {index + 1}
        </button>
      </div>
    </article>
  );
};

const DrawDeck = ({ count = 0 }) => {
  const backSrc = imageMap["card-back"];
  return (
    <div className="table-discard-pile draw-deck" aria-label="Draw deck">
      <div className="table-discard-stack">
        <span className="discard-card-layer discard-layer-one" />
        <span className="discard-card-layer discard-layer-two" />
        <span className="discard-card-layer discard-layer-three draw-deck-face">
          {backSrc ? <img src={backSrc} alt="Card back" /> : <span className="empty-discard-face">Deck</span>}
        </span>
        <strong>{count}</strong>
      </div>
      <p className="eyebrow" style={{ marginTop: 8, color: "rgba(201,168,76,0.55)" }}>Draw Deck</p>
    </div>
  );
};

const TableDiscardPile = ({ cards = [], label = "Discard Pile", onOpen }) => {
  const count = cards.length;
  const topCard = cards[cards.length - 1] || null;
  return (
    <button className="table-discard-pile" type="button" onClick={onOpen} title={`View ${label}`}>
      <div className="table-discard-stack">
        <span className="discard-card-layer discard-layer-one" />
        <span className="discard-card-layer discard-layer-two" />
        <span className="discard-card-layer discard-layer-three">
          {topCard ? <CardFace card={topCard} compact /> : <span className="empty-discard-face">Empty</span>}
        </span>
        <strong>{count}</strong>
      </div>
      <p className="eyebrow" style={{ marginTop: 8, color: "rgba(201,168,76,0.55)" }}>{label}</p>
    </button>
  );
};

const CompletedGoalsPanel = ({ completedGoals = [], onOpen }) => {
  const topGoal = completedGoals[completedGoals.length - 1];

  return (
    <section className="game-panel compact-panel completed-goals-panel">
      <div className="panel-heading small-heading">
        <p className="eyebrow">Achievements</p>
        <h2>Completed Goals</h2>
      </div>
      <div className="completed-goals-body">
        <button className="table-discard-pile completed-goals-pile-wrap" type="button" onClick={onOpen}>
          <div className="table-discard-stack">
            <span className="discard-card-layer discard-layer-one" />
            {completedGoals.length > 1 && <span className="discard-card-layer discard-layer-two" />}
            <span className="discard-card-layer discard-layer-three">
              {topGoal
                ? <CardFace card={topGoal} compact />
                : <span className="empty-discard-face">Empty</span>}
            </span>
            <strong>{completedGoals.length}</strong>
          </div>
        </button>
        {completedGoals.length === 0 ? (
          <p className="empty-storage" style={{ fontSize: "0.78rem" }}>No goals completed yet.</p>
        ) : (
          <div className="completed-goals-list">
            {completedGoals.map((goal, idx) => (
              <div key={idx} className="completed-goal-entry">
                <span className="completed-goal-name">{goal.name}</span>
                <span className="completed-goal-pts">+{goal.pointsAwarded ?? goal.points ?? 1} pt</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const MyProgressPanel = ({ me, isCurrent }) => {
  const score = me?.score || 0;
  const pct = Math.min(100, (score / 10) * 100);
  return (
    <section className={`game-panel compact-panel my-progress-panel${isCurrent ? " my-progress-current" : ""}`}>
      <div className="panel-heading small-heading">
        <p className="eyebrow">Your Progress</p>
        <div className="progress-name-row">
          <PlayerAvatar player={me} />
          <h2>{me.name}</h2>
        </div>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="progress-stats">
        <span className="progress-score">{score} / 10 pts</span>
        <span>{me.hand?.length || 0} in hand · {me.storage?.length || 0} stored</span>
      </div>
    </section>
  );
};

const TablePlayerChip = ({ player, isCurrent, isMe = false }) => (
  <div
    className={`table-player-chip${isCurrent ? " table-chip-current" : ""}${isMe ? " table-chip-me" : ""}${!player.connected ? " table-chip-offline" : ""}`}
  >
    <PlayerAvatar player={player} />
    <div className="table-chip-info">
      <strong>{player.name}</strong>
      <span>
        {isMe ? "You · " : ""}
        {player.handCount} hand · {player.storageCount} stored
        {!player.connected ? " · offline" : ""}
      </span>
    </div>
    <b className="table-chip-score">{player.score} / 10</b>
    {isCurrent && <span className="table-chip-turn-dot" aria-label="Current turn" />}
  </div>
);

const TableTopView = ({ players, me, currentPlayerName, meName, discardPile, deckCounts, onOpenCardDiscard, onOpenGoalDiscard }) => {
  const opponents = players.filter((p) => p.name !== meName);
  const colTemplate = `repeat(${Math.max(opponents.length, 1)}, 1fr)`;

  return (
    <div className="tabletop-view">
      {/* Felt table surface */}
      <div className="tabletop-surface">
        {/* Opponent storage zones */}
        <div className="tabletop-zones-row tabletop-opponent-zones" style={{ gridTemplateColumns: colTemplate }}>
          {opponents.map((player) => (
            <div
              key={player.name}
              className={`tabletop-player-zone tabletop-opponent-zone${player.name === currentPlayerName ? " tabletop-zone-current" : ""}`}
            >
              <TablePlayerChip player={player} isCurrent={player.name === currentPlayerName} />
              <StorageCards cards={player.storage} compact />
            </div>
          ))}
        </div>

        {/* Table centre — draw deck + two discard piles */}
        <div className="tabletop-center">
          <TableDiscardPile
            cards={discardPile?.goals || []}
            label="Goal Discard"
            onOpen={onOpenGoalDiscard}
          />
          <DrawDeck count={deckCounts?.playing ?? 0} />
          <TableDiscardPile
            cards={discardPile?.playing || []}
            label="Card Discard"
            onOpen={onOpenCardDiscard}
          />
        </div>

        {/* My storage zone */}
        <div className={`tabletop-player-zone tabletop-me-zone${me?.name === currentPlayerName ? " tabletop-zone-current" : ""}`}>
          <p className="tabletop-zone-label">Your Storage</p>
          <StorageCards cards={me?.storage || []} />
        </div>
      </div>

    </div>
  );
};

const StorageCards = ({ cards = [], compact = false }) => {
  const groups = groupCardsByKey(cards);

  if (groups.length === 0) {
    return <p className="empty-storage">No resources stored yet.</p>;
  }

  return (
    <div className={`storage-card-grid ${compact ? "compact-storage-cards" : ""}`}>
      {groups.map(({ card, count }) => (
        <article className="storage-stack-card" key={card.key} title={`${card.name} × ${count}`}>
          <div className="stack-shadow stack-shadow-one" />
          {count > 1 && <div className="stack-shadow stack-shadow-two" />}
          <CardFace card={card} compact />
          <span className="storage-count-badge">×{count}</span>
        </article>
      ))}
    </div>
  );
};

const SeatingOrder = ({ players = [], currentPlayerName, meName, showScore = true }) => {
  const radius = 40;
  const points = players.map((player, index) => {
    const angle = -90 + (360 / Math.max(players.length, 1)) * index;
    const radians = (Math.PI / 180) * angle;
    return {
      player,
      x: 50 + radius * Math.cos(radians),
      y: 50 + radius * Math.sin(radians),
    };
  });

  return (
    <div className="seating-widget" aria-label="Seating order">
      <svg className="seat-arrows" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <marker id="seat-arrow-head" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" />
          </marker>
        </defs>
        {points.length > 2 &&
          points.map((point, index) => {
            const next = points[(index + 1) % points.length];
            const dx = next.x - point.x;
            const dy = next.y - point.y;
            const length = Math.hypot(dx, dy) || 1;
            const trim = 11;
            const x1 = point.x + (dx / length) * trim;
            const y1 = point.y + (dy / length) * trim;
            const x2 = next.x - (dx / length) * trim;
            const y2 = next.y - (dy / length) * trim;
            return <line key={point.player.name} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
      </svg>
      {points.map(({ player, x, y }) => (
        <div
          className={`seat-node ${player.name === currentPlayerName ? "seat-node-current" : ""} ${
            player.name === meName ? "seat-node-me" : ""
          } ${!player.connected ? "seat-node-offline" : ""}`}
          key={player.name}
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <PlayerAvatar player={player} />
          <strong>{player.name.slice(0, 10)}</strong>
          {showScore && <span>{player.score || 0}</span>}
        </div>
      ))}
      <div className="seat-center-label">{players.length > 2 ? "Turn flow" : "Seats"}</div>
    </div>
  );
};

const ActionTargetModal = ({ card, gameState, me, opponents, defaultTargetName, onClose, onConfirm }) => {
  const [selectedTarget, setSelectedTarget] = useState(
    opponents.some((player) => player.name === defaultTargetName) ? defaultTargetName : opponents[0]?.name || ""
  );
  const [selectedStorageCardId, setSelectedStorageCardId] = useState("");
  const [selectedHandIndex, setSelectedHandIndex] = useState(0);
  const [targetGoalIndex, setTargetGoalIndex] = useState(0);
  const [myGoalIndex, setMyGoalIndex] = useState(0);

  const targetPlayer = gameState.players.find((player) => player.name === selectedTarget);

  useEffect(() => {
    setSelectedStorageCardId(targetPlayer?.storage?.[0]?.id || "");
    setSelectedHandIndex(0);
    setTargetGoalIndex(0);
  }, [selectedTarget, targetPlayer?.storage]);

  const confirm = () => {
    const payload = { targetName: selectedTarget };
    if (card.key === "theft") payload.storageCardId = selectedStorageCardId;
    if (card.key === "robbery") payload.handIndex = selectedHandIndex;
    if (card.key === "goalRemoval") payload.goalIndex = targetGoalIndex;
    if (card.key === "goalSwap") {
      payload.goalIndex = targetGoalIndex;
      payload.myGoalIndex = myGoalIndex;
    }
    onConfirm(payload);
  };

  const canConfirm = Boolean(
    selectedTarget &&
      (card.key !== "theft" || selectedStorageCardId) &&
      (card.key !== "robbery" || (targetPlayer?.handCount || 0) > 0)
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="action-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Configure action</p>
            <h2>{card.name}</h2>
          </div>
          <button className="ghost-button close-modal-button" onClick={onClose}>✕</button>
        </div>
        <p className="modal-description">{card.description}</p>

        <label className="modal-label" htmlFor="action-target">Target player</label>
        <select
          id="action-target"
          className="modal-select"
          value={selectedTarget}
          onChange={(event) => setSelectedTarget(event.target.value)}
        >
          {opponents.map((player) => (
            <option key={player.name} value={player.name}>{player.name}</option>
          ))}
        </select>

        {card.key === "theft" && (
          <div className="modal-picker-section">
            <h3>Choose a stored resource to steal</h3>
            <div className="selectable-card-grid">
              {(targetPlayer?.storage || []).map((storedCard) => (
                <button
                  key={storedCard.id}
                  type="button"
                  className={`selectable-card ${selectedStorageCardId === storedCard.id ? "selected" : ""}`}
                  onClick={() => setSelectedStorageCardId(storedCard.id)}
                >
                  <CardFace card={storedCard} compact />
                </button>
              ))}
              {(targetPlayer?.storage || []).length === 0 && <p className="empty-storage">No storage cards to steal.</p>}
            </div>
          </div>
        )}

        {card.key === "robbery" && (
          <div className="modal-picker-section">
            <h3>Choose a hidden hand slot</h3>
            <div className="hidden-hand-grid">
              {Array.from({ length: targetPlayer?.handCount || 0 }).map((_, index) => (
                <button
                  key={index}
                  className={`hidden-hand-slot ${selectedHandIndex === index ? "selected" : ""}`}
                  onClick={() => setSelectedHandIndex(index)}
                  type="button"
                >
                  Card {index + 1}
                </button>
              ))}
              {(targetPlayer?.handCount || 0) === 0 && <p className="empty-storage">No hand cards to rob.</p>}
            </div>
          </div>
        )}

        {(card.key === "goalRemoval" || card.key === "goalSwap") && (
          <div className="modal-picker-section goal-index-picker">
            {card.key === "goalSwap" && (
              <div>
                <h3>Your goal</h3>
                <div className="hidden-hand-grid">
                  {me.goals.map((goal, index) => (
                    <button
                      type="button"
                      key={goal.id}
                      className={`hidden-hand-slot ${myGoalIndex === index ? "selected" : ""}`}
                      onClick={() => setMyGoalIndex(index)}
                    >
                      {goal.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <h3>{targetPlayer?.name || "Target"}'s goal slot</h3>
              <div className="hidden-hand-grid">
                {Array.from({ length: targetPlayer?.goalCount || 0 }).map((_, index) => (
                  <button
                    type="button"
                    key={index}
                    className={`hidden-hand-slot ${targetGoalIndex === index ? "selected" : ""}`}
                    onClick={() => setTargetGoalIndex(index)}
                  >
                    Goal {index + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <button className="gold-button modal-confirm-button" disabled={!canConfirm} onClick={confirm}>
          Play {card.name}
        </button>
      </section>
    </div>
  );
};

const TradeBuilderModal = ({ hand, opponents, defaultTargetName, onClose, onConfirm }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [targetMode, setTargetMode] = useState("everyone");
  const [target, setTarget] = useState(
    opponents.some((player) => player.name === defaultTargetName) ? defaultTargetName : opponents[0]?.name || ""
  );
  const [useBinding, setUseBinding] = useState(false);

  const hasBinding = hand.some((card) => card.key === "bindingContract" && !selectedIds.includes(card.id));

  const toggleCard = (id) => {
    setSelectedIds((ids) => {
      if (ids.includes(id)) return ids.filter((selectedId) => selectedId !== id);
      if (ids.length >= 4) return ids;
      return [...ids, id];
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="trade-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Open trade</p>
            <h2>Make an offer</h2>
          </div>
          <button className="ghost-button close-modal-button" onClick={onClose}>✕</button>
        </div>

        <div className="trade-target-row">
          <label>
            <input
              type="radio"
              checked={targetMode === "everyone"}
              onChange={() => setTargetMode("everyone")}
            />
            Offer to everyone
          </label>
          <label>
            <input
              type="radio"
              checked={targetMode === "specific"}
              onChange={() => setTargetMode("specific")}
            />
            Specific player
          </label>
          {targetMode === "specific" && (
            <select className="modal-select" value={target} onChange={(event) => setTarget(event.target.value)}>
              {opponents.map((player) => (
                <option key={player.name} value={player.name}>{player.name}</option>
              ))}
            </select>
          )}
        </div>

        <label className="binding-checkbox">
          <input
            type="checkbox"
            checked={useBinding}
            disabled={!hasBinding}
            onChange={(event) => setUseBinding(event.target.checked)}
          />
          Use Binding Contract immediately {hasBinding ? "" : "(none available or selected)"}
        </label>

        <h3>Select 0 to 4 cards to offer</h3>
        <SelectableHandGrid hand={hand} selectedIds={selectedIds} onToggle={toggleCard} />

        <button
          className="gold-button modal-confirm-button"
          disabled={targetMode === "specific" && !target}
          onClick={() => onConfirm({
            targetName: targetMode === "specific" ? target : "",
            cardIds: selectedIds,
            useBinding,
          })}
        >
          Offer Trade
        </button>
      </section>
    </div>
  );
};

const TradeResponseModal = ({ hand, trade, onClose, onConfirm }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const toggleCard = (id) => {
    setSelectedIds((ids) => {
      if (ids.includes(id)) return ids.filter((selectedId) => selectedId !== id);
      if (ids.length >= 4) return ids;
      return [...ids, id];
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="trade-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Respond to trade</p>
            <h2>{trade.initiatorName}'s offer</h2>
          </div>
          <button className="ghost-button close-modal-button" onClick={onClose}>✕</button>
        </div>

        <TradeOffer title={`${trade.initiatorName} offers`} cards={trade.initiatorOffer} />
        <h3>Select 0 to 4 cards to offer back</h3>
        <SelectableHandGrid hand={hand} selectedIds={selectedIds} onToggle={toggleCard} />

        <button className="gold-button modal-confirm-button" onClick={() => onConfirm({ cardIds: selectedIds })}>
          Send Response
        </button>
      </section>
    </div>
  );
};

const SelectableHandGrid = ({ hand, selectedIds, onToggle }) => (
  <div className="selectable-card-grid trade-select-grid">
    {hand.map((card) => (
      <button
        key={card.id}
        type="button"
        className={`selectable-card ${selectedIds.includes(card.id) ? "selected" : ""}`}
        onClick={() => onToggle(card.id)}
      >
        <CardFace card={card} compact />
        <span>{card.name}</span>
      </button>
    ))}
  </div>
);

const InvestorModal = ({
  goal,
  goalIndex,
  storage,
  opponents,
  defaultTargetName,
  onClose,
  onConfirm,
}) => {
  const moneyCards = storage.filter((card) => card.key === "money");
  const [selectedIds, setSelectedIds] = useState([]);
  const [target, setTarget] = useState(
    opponents.some((player) => player.name === defaultTargetName)
      ? defaultTargetName
      : opponents[0]?.name || ""
  );

  const selectedCards = moneyCards.filter((card) => selectedIds.includes(card.id));
  const availableCards = moneyCards.filter((card) => !selectedIds.includes(card.id));
  const previewPoints = selectedIds.length >= 2 ? Math.max(1, selectedIds.length - 1) : 0;

  const addCard = (cardId) => {
    setSelectedIds((ids) => (ids.includes(cardId) ? ids : [...ids, cardId]));
  };

  const removeCard = (cardId) => {
    setSelectedIds((ids) => ids.filter((id) => id !== cardId));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="investor-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Special completion</p>
            <h2>Investor</h2>
          </div>
          <button className="ghost-button close-modal-button" onClick={onClose}>✕</button>
        </div>

        <p className="modal-description">{goal.description}</p>

        <label className="modal-label" htmlFor="investor-target">Invest in</label>
        <select
          id="investor-target"
          className="modal-select"
          value={target}
          onChange={(event) => setTarget(event.target.value)}
        >
          {opponents.map((player) => (
            <option key={player.name} value={player.name}>{player.name}</option>
          ))}
        </select>

        <div className="investor-columns">
          <div>
            <h3>Money in storage</h3>
            <div className="investor-money-list">
              {availableCards.map((card) => (
                <MiniMoneyCard
                  key={card.id}
                  card={card}
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData("text/plain", card.id)}
                  onClick={() => addCard(card.id)}
                />
              ))}
              {availableCards.length === 0 && <p className="empty-storage">No unselected Money left.</p>}
            </div>
          </div>

          <div
            className="investor-drop-zone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              addCard(event.dataTransfer.getData("text/plain"));
            }}
          >
            <h3>Dragged investment</h3>
            <div className="investor-money-list selected-money-list">
              {selectedCards.map((card) => (
                <MiniMoneyCard
                  key={card.id}
                  card={card}
                  selected
                  onClick={() => removeCard(card.id)}
                />
              ))}
              {selectedCards.length === 0 && <p className="empty-storage">Drag at least 2 Money cards here.</p>}
            </div>
            <div className="investor-preview">
              <span>{selectedIds.length} Money selected</span>
              <strong>{previewPoints} point{previewPoints === 1 ? "" : "s"}</strong>
            </div>
          </div>
        </div>

        <button
          className="gold-button investor-confirm-button"
          disabled={selectedIds.length < 2 || !target}
          onClick={() => onConfirm({ goalIndex, targetName: target, moneyCardIds: selectedIds })}
        >
          Confirm Investment
        </button>
      </section>
    </div>
  );
};

const MiniMoneyCard = ({ card, selected = false, onClick, draggable = false, onDragStart }) => (
  <button
    type="button"
    className={`mini-money-card ${selected ? "selected-mini-money-card" : ""}`}
    draggable={draggable}
    onDragStart={onDragStart}
    onClick={onClick}
    title={selected ? "Click to remove." : "Drag or click to invest."}
  >
    {getCardImage(card) ? <img src={getCardImage(card)} alt={card.name} /> : <span>{card.name}</span>}
    <span className="hover-card-details">
      <strong>{card.name}</strong>
      <small>{card.description || "Money resource."}</small>
    </span>
  </button>
);

const PlayerAvatar = ({ player, size = "normal" }) => (
  <span className={`player-avatar player-avatar-${size}`} style={getAvatarStyle(player)}>
    {getInitial(player)}
  </span>
);

const DiscardPileStack = ({ playingCards = [], goalCards = [], onOpen }) => {
  const count = playingCards.length + goalCards.length;
  const topCard = playingCards[playingCards.length - 1] || goalCards[goalCards.length - 1] || null;

  return (
    <section className="discard-pile-dock" aria-label="Discard pile">
      <button className="discard-pile-stack" type="button" onClick={onOpen}>
        <span className="discard-card-layer discard-layer-one" />
        <span className="discard-card-layer discard-layer-two" />
        <span className="discard-card-layer discard-layer-three">
          {topCard ? <CardFace card={topCard} compact /> : <span className="empty-discard-face">Discard</span>}
        </span>
        <strong>{count}</strong>
      </button>
      <div>
        <p className="eyebrow">Centre pile</p>
        <h2>Discard Pile</h2>
        <span>{count ? "Click to inspect played cards" : "Nothing discarded yet"}</span>
      </div>
    </section>
  );
};

const DiscardPileModal = ({ playingCards = [], goalCards = [], title = "Discard Pile", onClose }) => {
  const combined = [
    ...playingCards.map((card) => ({ ...card, pileLabel: "Playing discard" })),
    ...goalCards.map((card) => ({ ...card, pileLabel: "Goal discard" })),
  ].reverse();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="discard-modal" onClick={(event) => event.stopPropagation()}>
        <p className="eyebrow" style={{ textAlign: "center" }}>Table Memory</p>
        <h2 className="discard-modal-title">{title}</h2>
        {combined.length === 0 ? (
          <p className="empty-storage" style={{ textAlign: "center", margin: "24px 0" }}>Nothing here yet.</p>
        ) : (
          <div className="discard-modal-grid">
            {combined.map((card) => (
              <article className="discard-modal-card" key={`${card.pileLabel}-${card.id}`}>
                <CardFace card={card} compact />
              </article>
            ))}
          </div>
        )}
        <button className="ghost-button discard-modal-close" onClick={onClose}>Close</button>
      </section>
    </div>
  );
};

const MagicHandChoiceModal = ({ choice, onConfirm }) => {
  const [selectedCardId, setSelectedCardId] = useState("");
  const selectedCard = choice.choices?.find((card) => card.id === selectedCardId);

  return (
    <div className="modal-backdrop locked-choice-backdrop">
      <section className="discard-modal magic-hand-choice-modal">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Magic Hand</p>
            <h2>Choose from the discard pile</h2>
          </div>
        </div>
        <p className="modal-description">Pick one available playing card, then confirm to add it to your hand.</p>
        <div className="discard-modal-grid">
          {(choice.choices || []).map((card) => (
            <button
              type="button"
              className={`discard-modal-card selectable-discard-card ${selectedCardId === card.id ? "selected" : ""}`}
              key={card.id}
              onClick={() => setSelectedCardId(card.id)}
            >
              <CardFace card={card} compact />
              <span>{card.name}</span>
            </button>
          ))}
        </div>
        <div className="magic-hand-confirm-row">
          <span>{selectedCard ? `${selectedCard.name} selected` : "No card selected"}</span>
          <button className="gold-button" disabled={!selectedCardId} onClick={() => onConfirm(selectedCardId)}>
            Confirm Pick
          </button>
        </div>
      </section>
    </div>
  );
};

const OracleRevealModal = ({ reveal, onClose }) => (
  <div className="modal-backdrop" onClick={onClose}>
    <section className="discard-modal oracle-reveal-modal" onClick={(event) => event.stopPropagation()}>
      <div className="modal-heading">
        <div>
          <p className="eyebrow">Oracle's Power</p>
          <h2>{reveal.targetName}'s Hand</h2>
        </div>
        <button className="ghost-button close-modal-button" onClick={onClose}>✕</button>
      </div>
      {(reveal.cards || []).length === 0 ? (
        <p className="empty-storage">That player has no cards in hand.</p>
      ) : (
        <div className="discard-modal-grid oracle-hand-grid">
          {reveal.cards.map((card) => (
            <article className="discard-modal-card" key={card.id}>
              <CardFace card={card} compact />
              <span>{card.name}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  </div>
);
