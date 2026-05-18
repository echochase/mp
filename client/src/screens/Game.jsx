import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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

const buildImageMap = (modules) =>
  Object.entries(modules).reduce(
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

const playingImageMap = buildImageMap(playingCardImages);
const goalImageMap = buildImageMap(goalCardImages);
const imageMap = { ...goalImageMap, ...playingImageMap };

const STANDARD_RESOURCE_ORDER = ["workforce", "candy", "money", "wood", "land", "steel"];
const SPECIAL_RESOURCE_ORDER = ["gold", "diamond"];
const CANCEL_REACTION_KEYS = ["iThinkNot", "absolutelyNot"];
const TRADE_TOOL_KEYS = ["itsAScam", "bindingContract"];
const TARGETED_ACTION_KEYS = ["theft", "sabotage", "robbery", "goalRemoval", "goalSwap", "oraclesPower", "absoluteCalamity"];
const SABOTAGE_PROTECTED_KEYS = ["gold", "diamond"];

const CardZoomContext = createContext(null);

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

const titleCase = (value = "") =>
  value
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const SOFT_HYPHEN = "\u00AD";

const hyphenateLongWords = (value = "", chunkSize = 7) =>
  String(value)
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part) || part.length <= chunkSize) return part;
      return part.match(new RegExp(`.{1,${chunkSize}}`, "g"))?.join(SOFT_HYPHEN) || part;
    })
    .join("");

const normalizeImageLookupKey = (value = "") =>
  String(value)
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();

const buildNormalizedImageMap = (map) =>
  Object.entries(map).reduce((acc, [key, src]) => {
    acc[normalizeImageLookupKey(key)] = src;
    return acc;
  }, {});

const normalizedPlayingImageMap = buildNormalizedImageMap(playingImageMap);
const normalizedGoalImageMap = buildNormalizedImageMap(goalImageMap);
const normalizedImageMap = buildNormalizedImageMap(imageMap);

const getCardImage = (card) => {
  const directKey = card?.key || card?.imageKey;
  const directName = card?.name || card?.title;
  const isGoalCard = card?.type === "goal" || card?.points !== undefined || card?.requirement || card?.anyRequirement || card?.specialCompletion;
  const primaryMap = isGoalCard ? goalImageMap : playingImageMap;
  const primaryNormalizedMap = isGoalCard ? normalizedGoalImageMap : normalizedPlayingImageMap;

  return (
    primaryMap[directKey] ||
    primaryMap[directName] ||
    primaryNormalizedMap[normalizeImageLookupKey(directKey)] ||
    primaryNormalizedMap[normalizeImageLookupKey(directName)] ||
    imageMap[directKey] ||
    imageMap[directName] ||
    normalizedImageMap[normalizeImageLookupKey(directKey)] ||
    normalizedImageMap[normalizeImageLookupKey(directName)] ||
    null
  );
};

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

const canSabotageDiscard = (card) =>
  Boolean(card?.type === "resource" && !SABOTAGE_PROTECTED_KEYS.includes(card.key));

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

const getPendingActionContext = (pendingAction) => {
  if (pendingAction?.counterTargetName) {
    return ` while countering ${pendingAction.counterTargetName}${
      pendingAction.counterTargetActorName ? ` from ${pendingAction.counterTargetActorName}` : ""
    }`;
  }
  if (pendingAction?.targetName) return ` against ${pendingAction.targetName}`;
  return "";
};

const isMobileTableViewport = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches;

export const Game = ({ socket, name, room, setRoom }) => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const previousStateRef = useRef(null);
  const newCardTimerRef = useRef(null);
  const noticeTimerRef = useRef(null);
  const resolvedActionTimerRef = useRef(null);
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState("");
  const [noticeToast, setNoticeToast] = useState(null);
  const [newCardIds, setNewCardIds] = useState(new Set());
  const [turnPulse, setTurnPulse] = useState(0);
  const [zoomedCard, setZoomedCard] = useState(null);
  const [discardPileOpen, setDiscardPileOpen] = useState(false);
  const [goalDiscardPileOpen, setGoalDiscardPileOpen] = useState(false);
  const [combinedDiscardOpen, setCombinedDiscardOpen] = useState(false);
  const [completedGoalsPileOpen, setCompletedGoalsPileOpen] = useState(false);
  const [expandedGoalCard, setExpandedGoalCard] = useState(null);
  const [dismissedRevealIds, setDismissedRevealIds] = useState(new Set());
  const [investorGoal, setInvestorGoal] = useState(null);
  const [actionReadyGoal, setActionReadyGoal] = useState(null);
  const [meditatorGoal, setMeditatorGoal] = useState(null);
  const [actionModalCard, setActionModalCard] = useState(null);
  const [tradeBuilderOpen, setTradeBuilderOpen] = useState(false);
  const [tradeResponseOpen, setTradeResponseOpen] = useState(false);
  const [tableLogOpen, setTableLogOpen] = useState(false);
  const [seatingOrderOpen, setSeatingOrderOpen] = useState(false);
  const [expandedStoragePlayer, setExpandedStoragePlayer] = useState(null);
  const [resolvedMobileAction, setResolvedMobileAction] = useState(null);
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

      if (previous.pendingAction && !gameState.pendingAction) {
        window.clearTimeout(resolvedActionTimerRef.current);
        setResolvedMobileAction({
          id: `${previous.pendingAction.card?.id || previous.pendingAction.card?.key || "action"}-${Date.now()}`,
          card: previous.pendingAction.card,
        });
        resolvedActionTimerRef.current = window.setTimeout(() => setResolvedMobileAction(null), 900);
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
      window.clearTimeout(resolvedActionTimerRef.current);
    },
    []
  );

  const me = gameState?.me;
  const opponents = useMemo(
    () => gameState?.players?.filter((player) => player.name !== name) || [],
    [gameState, name]
  );

  const defaultTargetName = opponents[0]?.name || "";
  const currentTurnPlayer = gameState?.players?.find((player) => player.name === gameState.currentPlayerName);
  const activeReveal = me?.privateReveal && !dismissedRevealIds.has(me.privateReveal.id) ? me.privateReveal : null;
  const magicHandChoice = me?.pendingChoice?.type === "magicHandDiscard" ? me.pendingChoice : null;

  const sortedHand = useMemo(
    () =>
      (me?.hand || [])
        .map((card, originalIndex) => ({ ...card, originalIndex }))
        .sort(sortCards),
    [me?.hand]
  );

  const tableLocked = Boolean(gameState?.pendingAction || gameState?.activeTrade || gameState?.pendingChoice || me?.pendingChoice);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") return;

      let handled = true;
      if (actionModalCard) setActionModalCard(null);
      else if (tradeResponseOpen) setTradeResponseOpen(false);
      else if (tradeBuilderOpen) setTradeBuilderOpen(false);
      else if (investorGoal) setInvestorGoal(null);
      else if (actionReadyGoal) setActionReadyGoal(null);
      else if (meditatorGoal) setMeditatorGoal(null);
      else if (expandedGoalCard) setExpandedGoalCard(null);
      else if (expandedStoragePlayer) setExpandedStoragePlayer(null);
      else if (completedGoalsPileOpen) setCompletedGoalsPileOpen(false);
      else if (combinedDiscardOpen) setCombinedDiscardOpen(false);
      else if (goalDiscardPileOpen) setGoalDiscardPileOpen(false);
      else if (discardPileOpen) setDiscardPileOpen(false);
      else if (tableLogOpen) setTableLogOpen(false);
      else if (seatingOrderOpen) setSeatingOrderOpen(false);
      else if (activeReveal) {
        setDismissedRevealIds((ids) => new Set([...ids, activeReveal.id]));
      } else {
        handled = false;
      }

      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [
    actionModalCard,
    tradeResponseOpen,
    tradeBuilderOpen,
    investorGoal,
    actionReadyGoal,
    meditatorGoal,
    expandedGoalCard,
    expandedStoragePlayer,
    completedGoalsPileOpen,
    combinedDiscardOpen,
    goalDiscardPileOpen,
    discardPileOpen,
    tableLogOpen,
    seatingOrderOpen,
    activeReveal,
  ]);

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

  const completeActionReady = ({ goalIndex, actionCardIds }) => {
    socket.emit("complete-action-ready", roomCode, {
      goalIndex,
      actionCardIds,
    });
    setActionReadyGoal(null);
  };

  const completeMeditator = ({ goalIndex, actionCardIds }) => {
    socket.emit("complete-meditator", roomCode, {
      goalIndex,
      actionCardIds,
    });
    setMeditatorGoal(null);
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

  const canStoreResourceCard = (card) =>
    Boolean(
      card?.type === "resource" &&
        me?.isYourTurn &&
        !me?.mustDiscard &&
        !tableLocked &&
        !gameState?.winner &&
        !gameState?.pendingChoice &&
        !me?.pendingChoice
    );

  const storeResourceCard = (card) => {
    if (!canStoreResourceCard(card)) return;
    playCard(card);
  };

  const canPlayActionCard = (card) => {
    if (!card || card.type !== "action" || gameState?.winner || gameState?.pendingChoice || me?.pendingChoice) return false;

    const isCancelReaction = CANCEL_REACTION_KEYS.includes(card.key);
    const isTradeTool = TRADE_TOOL_KEYS.includes(card.key);
    const actionBlockedByTable = Boolean(gameState?.activeTrade || (gameState?.pendingAction && !isCancelReaction));
    const canReact = isCancelReaction && me?.canReactToAction && gameState?.pendingAction;
    const canPlayNormalAction =
      !isCancelReaction &&
      !isTradeTool &&
      !me?.mustDiscard &&
      !actionBlockedByTable &&
      me?.isYourTurn &&
      !me?.actionPlayed;

    return Boolean(canReact || canPlayNormalAction);
  };

  const handleResourceDrop = (cardId) => {
    const resourceCard = sortedHand.find((card) => String(card.id) === String(cardId));
    storeResourceCard(resourceCard);
  };

  const handleActionDrop = (cardId) => {
    const actionCard = sortedHand.find((card) => String(card.id) === String(cardId));
    if (canPlayActionCard(actionCard)) beginPlayCard(actionCard);
  };

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

  const playerCount = gameState.players?.length || 0;
  const tableLayoutClassName = [
    "table-layout",
    playerCount < 4 ? "mobile-low-player-count" : "",
    playerCount < 6 ? "mobile-under-full-lobby" : "mobile-full-lobby",
  ]
    .filter(Boolean)
    .join(" ");
  const gamePageClassName = [
    "game-page",
    playerCount < 6 ? "mobile-under-full-lobby-page" : "mobile-full-lobby-page",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <CardZoomContext.Provider value={setZoomedCard}>
    <main className={gamePageClassName}>
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
          <p className="eyebrow">{(gameState.winners || []).length > 1 ? "Tie" : "Victory"}</p>
          <h2>
            {(gameState.winners || []).length > 1
              ? `${gameState.winners.join(" and ")} tie for the win.`
              : `${gameState.winners?.[0] || gameState.winner} wins the pursuit.`}
          </h2>
          {gameState.winReason === "goalDeckDepleted" && (
            <p className="winner-reason">The goal deck was depleted, so the highest score wins.</p>
          )}
          <button onClick={() => navigate("/")}>Return Home</button>
        </section>
      )}

      {error && <div className="game-toast danger-toast">{error}</div>}
      {noticeToast && (
        <div className={`game-toast notice-toast ${noticeToast.type || "info"}`} role="status">
          {noticeToast.type === "goal" && <span className="toast-kicker">Goal complete</span>}
          <span>{noticeToast.text}</span>
        </div>
      )}

      <section className={tableLayoutClassName}>
        {/* ── LEFT SIDEBAR: progress + goals + completed goals ── */}
        <aside className="game-sidebar left-game-sidebar">
          <div className="mobile-progress-goals-combo">
            <MyProgressPanel me={me} isCurrent={me.name === gameState.currentPlayerName} />
            <section className="game-panel goals-panel compact-panel compact-goals-panel">
              <div className="panel-heading small-heading goals-panel-heading">
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
                    onActionReady={() => setActionReadyGoal({ goal, goalIndex: index })}
                    onMeditator={() => setMeditatorGoal({ goal, goalIndex: index })}
                    actionCardsAvailable={(me.hand || []).filter((handCard) => handCard.type === "action").length}
                    onExpand={() => setExpandedGoalCard(goal)}
                  />
                ))}
              </div>
            </section>
          </div>
          <CompletedGoalsPanel
            completedGoals={me.completedGoals || []}
            onOpen={() => setCompletedGoalsPileOpen(true)}
            onExpandGoal={setExpandedGoalCard}
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
            canStoreDraggedResource={sortedHand.some(canStoreResourceCard)}
            onStoreResourceDrop={handleResourceDrop}
            onOpenCardDiscard={() => setDiscardPileOpen(true)}
            onOpenGoalDiscard={() => setGoalDiscardPileOpen(true)}
            canPlayDraggedAction={sortedHand.some(canPlayActionCard)}
            onActionCardDrop={handleActionDrop}
            pendingAction={gameState.pendingAction}
            resolvedMobileAction={resolvedMobileAction}
            now={now}
            reactionHand={sortedHand}
            onReact={(card) => playCard(card)}
            onOpenStorage={(player) => setExpandedStoragePlayer(player)}
            mobileDashboard={
              <MobileTableDashboard
                me={me}
                isCurrent={me.name === gameState.currentPlayerName}
                disabled={Boolean(gameState.winner) || tableLocked}
                onReroll={rerollGoal}
                onInvestor={(goal, goalIndex) => setInvestorGoal({ goal, goalIndex })}
                onActionReady={(goal, goalIndex) => setActionReadyGoal({ goal, goalIndex })}
                onMeditator={(goal, goalIndex) => setMeditatorGoal({ goal, goalIndex })}
                actionCardsAvailable={(me.hand || []).filter((handCard) => handCard.type === "action").length}
                onExpandGoal={setExpandedGoalCard}
                deckCounts={gameState.deckCounts}
                onOpenSeating={() => setSeatingOrderOpen(true)}
                onOpenCompleted={() => setCompletedGoalsPileOpen(true)}
                onOpenLog={() => setTableLogOpen(true)}
                onOpenDiscarded={() => setCombinedDiscardOpen(true)}
              />
            }
          />

          <section className="game-panel hand-panel compact-panel compact-hand-strip">
            <div className="panel-heading split-heading small-heading">
              <div>
                <p className="eyebrow">Your hand</p>
                <h2>{me.hand.length} cards</h2>
              </div>
              <div className="hand-header-right">
                {me.mustDiscard && <span className="danger-pill">Discard {me.hand.length - 8}</span>}
                <div className="hand-action-buttons">
                  <button
                    className={`trade-turn-button ${me.canCreateTrade ? "active" : ""}`}
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
                  canDragToStorage={canStoreResourceCard(card)}
                  canDragToPlay={canPlayActionCard(card)}
                  onPlay={() => beginPlayCard(card)}
                  onDiscard={() => discardCard(card)}
                />
              ))}
            </div>
          </section>
        </section>

        {/* ── RIGHT SIDEBAR: seating order + history ── */}
        <aside className="game-sidebar right-game-sidebar">
          <section className="game-panel compact-panel seating-panel">
            <div className="panel-heading split-heading small-heading seating-heading">
              <div>
                <p className="eyebrow">Players</p>
                <h2>Seating Order</h2>
              </div>
              <span className="deck-pill seated-count-pill">{gameState.players.length} seated</span>
              <button
                className="mobile-seating-expand-button"
                type="button"
                onClick={() => setSeatingOrderOpen(true)}
              >
                Expand
              </button>
            </div>
            <div key={`mobile-turn-${turnPulse}`} className="turn-card turn-card-attention current-turn-card mobile-seating-turn-card">
              {!gameState.winner && currentTurnPlayer && <PlayerAvatar player={currentTurnPlayer} size="large" />}
              <div>
                <span>Current turn</span>
                <strong>{gameState.winner ? "Game Over" : gameState.currentPlayerName}</strong>
              </div>
            </div>
            <SeatingOrder
              players={gameState.players}
              currentPlayerName={gameState.currentPlayerName}
              meName={name}
              showScore={false}
            />
          </section>
          <section className="game-panel log-panel compact-panel compact-log-panel mobile-collapsed-log-panel">
            <div className="panel-heading split-heading small-heading">
              <div>
                <p className="eyebrow">History</p>
                <h2>Table Log</h2>
              </div>
              <button className="mobile-log-expand-button" type="button" onClick={() => setTableLogOpen(true)}>
                Expand
              </button>
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
          storage={me.storage || []}
          opponents={opponents}
          defaultTargetName={defaultTargetName}
          onClose={() => setTradeBuilderOpen(false)}
          onConfirm={createTrade}
         
        />
      )}

      {tradeResponseOpen && gameState.activeTrade && (
        <TradeResponseModal
          hand={sortedHand}
          storage={me.storage || []}
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

      {actionReadyGoal && (
        <ActionReadyModal
          goal={actionReadyGoal.goal}
          goalIndex={actionReadyGoal.goalIndex}
          hand={me.hand || []}
          onClose={() => setActionReadyGoal(null)}
          onConfirm={completeActionReady}
        />
      )}

      {meditatorGoal && (
        <MeditatorModal
          goal={meditatorGoal.goal}
          goalIndex={meditatorGoal.goalIndex}
          hand={me.hand || []}
          onClose={() => setMeditatorGoal(null)}
          onConfirm={completeMeditator}
        />
      )}

      {completedGoalsPileOpen && (
        <DiscardPileModal
          title="Completed Goals"
          goalCards={me.completedGoals || []}
          onClose={() => setCompletedGoalsPileOpen(false)}
          onExpandGoal={setExpandedGoalCard}
        />
      )}

      {goalDiscardPileOpen && (
        <DiscardPileModal
          title="Goal Discard"
          goalCards={gameState.discardPile?.goals || []}
          onClose={() => setGoalDiscardPileOpen(false)}
          onExpandGoal={setExpandedGoalCard}
        />
      )}

      {discardPileOpen && (
        <DiscardPileModal
          title="Card Discard"
          playingCards={gameState.discardPile?.playing || []}
          onClose={() => setDiscardPileOpen(false)}
        />
      )}

      {combinedDiscardOpen && (
        <CombinedDiscardModal
          playingCards={gameState.discardPile?.playing || []}
          goalCards={gameState.discardPile?.goals || []}
          onClose={() => setCombinedDiscardOpen(false)}
          onExpandGoal={setExpandedGoalCard}
        />
      )}

      {magicHandChoice && (
        <MagicHandChoiceModal choice={magicHandChoice} onConfirm={chooseDiscardCard} />
      )}

      {activeReveal && (
        <RevealModal
          reveal={activeReveal}
          onClose={() => setDismissedRevealIds((ids) => new Set([...ids, activeReveal.id]))}
        />
      )}

      {expandedGoalCard && (
        <ExpandedGoalCardModal card={expandedGoalCard} onClose={() => setExpandedGoalCard(null)} />
      )}

      {tableLogOpen && (
        <TableLogModal log={gameState.log || []} onClose={() => setTableLogOpen(false)} />
      )}

      {seatingOrderOpen && (
        <SeatingOrderModal
          players={gameState.players || []}
          currentPlayerName={gameState.currentPlayerName}
          meName={name}
          onClose={() => setSeatingOrderOpen(false)}
        />
      )}

      {expandedStoragePlayer && (
        <StorageModal
          player={expandedStoragePlayer}
          onClose={() => setExpandedStoragePlayer(null)}
        />
      )}

      <button className="exit-table-button compact-exit-button" onClick={leaveTable}>Leave Table</button>

      {zoomedCard && (
        <CardZoomModal card={zoomedCard} onClose={() => setZoomedCard(null)} />
      )}
    </main>
    </CardZoomContext.Provider>
  );
};

const CardFace = ({
  card,
  className = "",
  compact = false,
  hoverMode,
  hoverButtonLabel = "Expand",
  hoverButtonDisabled = false,
  onHoverButtonClick,
  onClick,
  noHoverScale = false,
}) => {
  const image = getCardImage(card);
  const cardTitle = card?.name || titleCase(card?.key || "Card");
  const cardDisplayTitle = hyphenateLongWords(cardTitle);
  const effectiveHoverMode = hoverMode || (card?.type === "resource" ? "title" : "details");

  const handleHoverButtonClick = (event) => {
    event.stopPropagation();
    if (!hoverButtonDisabled) onHoverButtonClick?.();
  };

  const renderHoverLayer = () => {
    if (effectiveHoverMode === "none") return null;

    if (effectiveHoverMode === "play" || effectiveHoverMode === "expand") {
      return (
        <span className={`hover-card-action hover-card-action-${effectiveHoverMode}`}>
          <button
            type="button"
            disabled={hoverButtonDisabled}
            onClick={handleHoverButtonClick}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {hoverButtonLabel}
          </button>
        </span>
      );
    }
  };

  return (
    <div
      className={`card-face-button ${compact ? "compact-face" : ""} ${noHoverScale ? "no-hover-scale" : ""} hover-mode-${effectiveHoverMode} ${className}`}
      aria-label={cardTitle}
      onClick={onClick}
    >
      {image ? <img src={image} alt={cardTitle} /> : <div className="card-fallback">{cardDisplayTitle}</div>}
      {renderHoverLayer()}
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
  canDragToStorage,
  canDragToPlay,
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
  const isAction = !isResource;
  const showActionHoverPlay = isAction && !disabled && (canPlayNormalAction || canReact);
  const playDisabled = disabled || (!canPlayResource && !canPlayNormalAction && !canReact);

  const clearPointerDropHighlights = () => {
    if (typeof document === "undefined") return;
    document
      .querySelectorAll(".mobile-pointer-drag-over")
      .forEach((element) => element.classList.remove("mobile-pointer-drag-over"));
  };

  const handleDragStart = (event) => {
    if (!canDragToStorage && !canDragToPlay) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    if (canDragToStorage) {
      event.dataTransfer.setData("application/x-mp-resource-card-id", String(card.id));
    }
    if (canDragToPlay) {
      event.dataTransfer.setData("application/x-mp-action-card-id", String(card.id));
    }
    event.dataTransfer.setData("text/plain", String(card.id));
  };

  const handlePointerDown = (event) => {
    if ((!canDragToStorage && !canDragToPlay) || event.pointerType === "mouse") return;
    if (event.target.closest("button")) return;

    const sourceCard = event.currentTarget;
    const sourceFace = sourceCard.querySelector(".card-face-button");
    const startX = event.clientX;
    const startY = event.clientY;
    let dragging = false;
    let dragGhost = null;

    const positionGhost = (clientX, clientY) => {
      if (!dragGhost) return;
      dragGhost.style.transform = `translate3d(${clientX}px, ${clientY}px, 0) translate(-50%, -62%)`;
    };

    const createGhost = (moveEvent) => {
      if (dragGhost || typeof document === "undefined") return;
      dragGhost = document.createElement("div");
      dragGhost.className = "mobile-drag-card-ghost";
      const clonedFace = sourceFace?.cloneNode(true);
      if (clonedFace) {
        clonedFace.classList.add("no-hover-scale");
        dragGhost.appendChild(clonedFace);
      } else {
        dragGhost.textContent = card.name || titleCase(card.key || "Card");
      }
      document.body.appendChild(dragGhost);
      sourceCard.classList.add("mobile-source-dragging");
      positionGhost(moveEvent.clientX, moveEvent.clientY);
    };

    const removeGhost = () => {
      if (dragGhost?.parentNode) dragGhost.parentNode.removeChild(dragGhost);
      sourceCard.classList.remove("mobile-source-dragging");
      dragGhost = null;
    };

    const handlePointerMove = (moveEvent) => {
      const distance = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
      if (!dragging && distance < 8) return;
      dragging = true;
      moveEvent.preventDefault();
      createGhost(moveEvent);
      positionGhost(moveEvent.clientX, moveEvent.clientY);

      const hoveredElement = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
      const storageDrop = hoveredElement?.closest(".tabletop-me-zone");
      const playDrop = hoveredElement?.closest(".mobile-play-space");
      clearPointerDropHighlights();
      if (canDragToStorage && storageDrop) storageDrop.classList.add("mobile-pointer-drag-over");
      if (canDragToPlay && playDrop) playDrop.classList.add("mobile-pointer-drag-over");
    };

    const finishPointerDrag = (upEvent) => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishPointerDrag);
      window.removeEventListener("pointercancel", finishPointerDrag);

      const hoveredElement = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
      const droppedOnStorage = Boolean(hoveredElement?.closest(".tabletop-me-zone"));
      const droppedOnPlaySpace = Boolean(hoveredElement?.closest(".mobile-play-space"));
      clearPointerDropHighlights();
      removeGhost();

      if (!dragging) return;
      if ((canDragToStorage && droppedOnStorage) || (canDragToPlay && droppedOnPlaySpace)) {
        onPlay?.();
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", finishPointerDrag, { once: true });
    window.addEventListener("pointercancel", finishPointerDrag, { once: true });
  };

  return (
    <article
      className={`mp-card compact-mp-card ${isResource ? "resource-card" : "action-card"} ${
        card.specialResource ? "special-resource-card" : ""
      } ${isNew ? "draw-new-card" : ""} ${mustDiscard ? "must-discard-card" : ""} ${canDragToStorage ? "draggable-resource-card" : ""} ${canDragToPlay ? "draggable-action-card" : ""}`}
      draggable={Boolean(canDragToStorage || canDragToPlay)}
      onDragStart={handleDragStart}
      onPointerDown={handlePointerDown}
    >
      <CardFace
        card={card}
        hoverMode={isAction ? (showActionHoverPlay ? "play" : "none") : undefined}
        hoverButtonLabel="Play"
        hoverButtonDisabled={playDisabled}
        onHoverButtonClick={onPlay}
      />
      <div className="card-actions compact-card-actions">
        {mustDiscard ? (
          <button className="danger-button" disabled={disabled || Boolean(activeTrade || pendingAction)} onClick={onDiscard}>
            Discard
          </button>
        ) : isResource && showPlayButton ? (
          <button disabled={playDisabled} onClick={onPlay}>
            Store
          </button>
        ) : isAction && showPlayButton ? (
          <>
            <button className="mobile-card-action-button" disabled={playDisabled} onClick={onPlay}>
              Play
            </button>
            <span className="card-state-chip desktop-card-state-chip">Hover to play</span>
          </>
        ) : (
          <span className="card-state-chip">
            {isCancelReaction
              ? "Reaction only"
              : isTradeTool
                ? "Trade tool"
                : tableLocked
                  ? "Waiting"
                  : "Unavailable"}
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
          {getPendingActionContext(pendingAction)}.
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

      {trade.bindingUsed && (
        <p className="binding-contract-alert">
          {trade.initiatorName} used Binding Contract on this trade. If the trade is accepted, no one can use It's a Scam.
        </p>
      )}

      <div className="trade-offers-grid">
        <TradeOffer title={`${trade.initiatorName} offers`} cards={trade.initiatorOffer} handCards={trade.initiatorOfferHand} storageCards={trade.initiatorOfferStorage} />
        <TradeOffer title={trade.responderName ? `${trade.responderName} offers` : "Waiting for response"} cards={trade.responderOffer} handCards={trade.responderOfferHand} storageCards={trade.responderOfferStorage} />
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
        {canDecline && <button className="danger-outline-button" onClick={onDecline}>Cancel trade</button>}
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

const TradeOffer = ({ title, cards = [], handCards, storageCards }) => {
  const hasPartition = Boolean(handCards || storageCards || cards.some((card) => card.tradeZone));
  const handOffer = handCards || cards.filter((card) => card.tradeZone === "hand");
  const storageOffer = storageCards || cards.filter((card) => card.tradeZone === "storage");

  if (!hasPartition) {
    return (
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
  }

  return (
    <div className="trade-offer-box partitioned-trade-offer-box">
      <strong>{title}</strong>
      <div className="trade-offer-zone">
        <span className="trade-offer-zone-label">To hand</span>
        <div className="trade-card-row">
          {handOffer.length === 0 ? (
            <span className="empty-storage">Nothing</span>
          ) : (
            handOffer.map((card) => <CardFace key={card.id} card={card} compact />)
          )}
        </div>
      </div>
      <div className="trade-offer-zone">
        <span className="trade-offer-zone-label">To storage</span>
        <div className="trade-card-row">
          {storageOffer.length === 0 ? (
            <span className="empty-storage">Nothing</span>
          ) : (
            storageOffer.map((card) => <CardFace key={card.id} card={card} compact />)
          )}
        </div>
      </div>
    </div>
  );
};

const GoalCard = ({
  goal,
  index,
  disabled,
  isYourTurn,
  goalRerolled,
  onReroll,
  onInvestor,
  onActionReady,
  onMeditator,
  actionCardsAvailable = 0,
  onExpand,
}) => {
  const isInvestor = goal.key === "investor";
  const isActionReady = goal.key === "action-ready";
  const isMeditator = goal.key === "meditator";
  const canOpenInvestor = isInvestor && isYourTurn && (goal.investorMoneyAvailable || 0) >= 2;
  const canOpenActionReady = isActionReady && isYourTurn && actionCardsAvailable >= 7;
  const canOpenMeditator = isMeditator && isYourTurn && actionCardsAvailable >= 4;

  const handleGoalTap = (event) => {
    if (event.target.closest("button")) return;
    if (isMobileTableViewport()) onExpand?.();
  };

  return (
    <article
      className={`goal-card-box compact-goal-card ${isInvestor ? "investor-goal-card" : ""}`}
      onClick={handleGoalTap}
    >
      <CardFace
        card={goal}
        compact
        hoverMode="expand"
        hoverButtonLabel="Expand"
        onHoverButtonClick={onExpand}
        onClick={handleGoalTap}
        noHoverScale
      />
      <div className="goal-meta compact-goal-meta">
        <strong>
          {isInvestor ? "Variable" : `${goal.points || 1} pt${(goal.points || 1) === 1 ? "" : "s"}`}
        </strong>
        <p>{hyphenateLongWords(goal.name)}</p>
      </div>
      <div className="goal-actions compact-goal-actions">
        {isInvestor && (
          <button disabled={disabled || !canOpenInvestor} onClick={onInvestor}>
            Invest
          </button>
        )}
        {isActionReady && (
          <button disabled={disabled || !canOpenActionReady} onClick={onActionReady}>
            Reveal Actions
          </button>
        )}
        {isMeditator && (
          <button disabled={disabled || !canOpenMeditator} onClick={onMeditator}>
            Discard Actions
          </button>
        )}
        <button
          className={`reroll-goal-button ${isYourTurn && !goalRerolled && !disabled ? "active" : ""}`}
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
          {topCard ? <CardFace card={topCard} compact hoverMode="none" noHoverScale /> : <span className="empty-discard-face">Empty</span>}
        </span>
        <strong>{count}</strong>
      </div>
      <p className="eyebrow" style={{ marginTop: 8, color: "rgba(201,168,76,0.55)" }}>{label}</p>
    </button>
  );
};

const CompletedGoalsPanel = ({ completedGoals = [], onOpen, onExpandGoal }) => {
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
                ? <CardFace card={topGoal} compact hoverMode="none" noHoverScale />
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
              <button
                key={idx}
                type="button"
                className="completed-goal-entry completed-goal-button"
                onClick={() => onExpandGoal(goal)}
              >
                <span className="completed-goal-name">{hyphenateLongWords(goal.name)}</span>
                <span className="completed-goal-pts">+{goal.pointsAwarded ?? goal.points ?? 1} pt</span>
              </button>
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

const MobileDeckSummary = ({ deckCounts = {} }) => {
  const backSrc = imageMap["card-back"];
  return (
    <section className="game-panel compact-panel mobile-table-deck-panel" aria-label="Deck counts">
      <p className="eyebrow">Deck</p>
      <div className="mobile-deck-card">
        {backSrc ? <img src={backSrc} alt="Deck" /> : <span>Deck</span>}
        <strong>{deckCounts.playing ?? 0}</strong>
      </div>
      <span>{deckCounts.goals ?? 0} goals</span>
    </section>
  );
};

const MobileTableDashboard = ({
  me,
  isCurrent,
  disabled,
  onReroll,
  onInvestor,
  onActionReady,
  onMeditator,
  actionCardsAvailable = 0,
  onExpandGoal,
  deckCounts,
  onOpenSeating,
  onOpenCompleted,
  onOpenLog,
  onOpenDiscarded,
}) => (
  <div className="mobile-table-dashboard">
    <div className="mobile-table-info-row">
      <MyProgressPanel me={me} isCurrent={isCurrent} />
      <MobileDeckSummary deckCounts={deckCounts} />
      <section className="game-panel compact-panel compact-goals-panel mobile-table-goals-panel">
        <div className="panel-heading small-heading goals-panel-heading">
          <p className="eyebrow">Private</p>
          <h2>Your Goals</h2>
        </div>
        <div className="goals-grid compact-goals-grid mobile-table-goals-grid">
          {(me.goals || []).map((goal, index) => (
            <GoalCard
              key={goal.id || `${goal.key}-${index}`}
              goal={goal}
              index={index}
              disabled={disabled}
              isYourTurn={me.isYourTurn}
              goalRerolled={me.goalRerolled}
              onReroll={() => onReroll(index)}
              onInvestor={() => onInvestor(goal, index)}
              onActionReady={() => onActionReady(goal, index)}
              onMeditator={() => onMeditator(goal, index)}
              actionCardsAvailable={actionCardsAvailable}
              onExpand={() => onExpandGoal(goal)}
            />
          ))}
        </div>
      </section>
    </div>
    <div className="mobile-table-control-row">
      <button type="button" onClick={onOpenSeating}>View seating order</button>
      <button type="button" onClick={onOpenDiscarded}>View discarded</button>
      <button type="button" onClick={onOpenLog}>View table log</button>
      <button type="button" onClick={onOpenCompleted}>View completed goals</button>
    </div>
  </div>
);

const TableLogModal = ({ log = [], onClose }) => (
  <div className="modal-backdrop" onMouseDown={onClose} role="presentation">
    <section className="trade-modal table-log-modal" onMouseDown={(event) => event.stopPropagation()}>
      <div className="modal-heading">
        <div>
          <p className="eyebrow">History</p>
          <h2>Table Log</h2>
        </div>
      </div>
      <div className="log-list table-log-modal-list">
        {log.length === 0 ? (
          <p>No table events yet.</p>
        ) : (
          log.slice().reverse().map((entry, index) => <p key={`${entry}-${index}`}>{entry}</p>)
        )}
      </div>
      <button type="button" className="modal-confirm-button" onClick={onClose}>
        Close
      </button>
    </section>
  </div>
);

const StorageModal = ({ player, onClose }) => (
  <div className="modal-backdrop" onMouseDown={onClose} role="presentation">
    <section className="trade-modal storage-modal" onMouseDown={(event) => event.stopPropagation()}>
      <div className="modal-heading">
        <div>
          <p className="eyebrow">Storage</p>
          <h2>{player?.name || "Player"}</h2>
        </div>
      </div>
      <div className="storage-modal-body">
        <StorageCards cards={player?.storage || []} />
      </div>
      <button type="button" className="modal-confirm-button" onClick={onClose}>
        Close
      </button>
    </section>
  </div>
);

const SeatingOrderModal = ({ players = [], currentPlayerName, meName, onClose }) => (
  <div className="modal-backdrop" onMouseDown={onClose} role="presentation">
    <section className="trade-modal seating-order-modal" onMouseDown={(event) => event.stopPropagation()}>
      <div className="modal-heading">
        <div>
          <p className="eyebrow">Players</p>
          <h2>Seating Order</h2>
        </div>
      </div>
      <p className="modal-description seating-order-description">Turn order moves clockwise around the table.</p>
      <div className="seating-order-modal-stage">
        <SeatingOrder players={players} currentPlayerName={currentPlayerName} meName={meName} showScore />
      </div>
      <button type="button" className="modal-confirm-button" onClick={onClose}>
        Close
      </button>
    </section>
  </div>
);

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

const MobilePendingActionInPlaySpace = ({ pendingAction, me, now, reactionHand = [], onReact }) => {
  const reactionCards = reactionHand.filter((card) => CANCEL_REACTION_KEYS.includes(card.key));
  const isActor = pendingAction.actorName === me.name;

  return (
    <div className="mobile-pending-action-play-space">
      <div className="mobile-pending-action-copy">
        <span>Reaction window</span>
        <strong>{pendingAction.actorName} played {pendingAction.card.name}</strong>
        <small>{formatCountdown(pendingAction.expiresAt, now)} remaining{getPendingActionContext(pendingAction)}</small>
      </div>
      <div className="mobile-pending-action-card-wrap">
        <CardFace card={pendingAction.card} compact hoverMode="none" noHoverScale />
      </div>
      <div className="mobile-pending-reaction-buttons">
        {isActor && <span className="card-state-chip">Your action</span>}
        {!isActor && reactionCards.length === 0 && <span className="card-state-chip">No counter</span>}
        {!isActor && reactionCards.map((card) => (
          <button
            type="button"
            className="danger-button"
            key={card.id}
            onClick={() => onReact?.(card)}
            disabled={!me.canReactToAction}
          >
            {card.name}
          </button>
        ))}
      </div>
    </div>
  );
};

const MobileResolvedActionInPlaySpace = ({ card }) => (
  <div className="mobile-resolved-action-play-space" aria-hidden="true">
    <div className="mobile-resolved-action-card">
      <CardFace card={card} compact hoverMode="none" noHoverScale />
    </div>
    <span>Resolving to discard</span>
  </div>
);

const TableTopView = ({
  players,
  me,
  currentPlayerName,
  meName,
  discardPile,
  deckCounts,
  canStoreDraggedResource,
  onStoreResourceDrop,
  onOpenCardDiscard,
  onOpenGoalDiscard,
  canPlayDraggedAction,
  onActionCardDrop,
  pendingAction,
  resolvedMobileAction,
  now,
  reactionHand = [],
  onReact,
  onOpenStorage,
  mobileDashboard,
}) => {
  const [isPlaySpaceDragOver, setIsPlaySpaceDragOver] = useState(false);
  const [isStorageDragOver, setIsStorageDragOver] = useState(false);
  const opponents = players.filter((p) => p.name !== meName);
  const hasOddOpponentSlot = opponents.length > 0 && opponents.length % 2 === 1;
  const colTemplate = `repeat(${Math.max(opponents.length, 1)}, 1fr)`;
  const opponentZonesClassName = [
    "tabletop-zones-row tabletop-opponent-zones",
    opponents.length % 2 === 1 ? "has-odd-opponents" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="tabletop-view">
      {/* Felt table surface */}
      <div className="tabletop-surface">
        {/* Opponent storage zones */}
        <div className={opponentZonesClassName} style={{ gridTemplateColumns: colTemplate }}>
          {opponents.map((player) => (
            <div
              key={player.name}
              className={`tabletop-player-zone tabletop-opponent-zone${player.name === currentPlayerName ? " tabletop-zone-current" : ""}`}
            >
              <TablePlayerChip player={player} isCurrent={player.name === currentPlayerName} />
              <button
                className="mobile-storage-expand-button"
                type="button"
                onClick={() => onOpenStorage?.(player)}
              >
                Expand
              </button>
              <StorageCards cards={player.storage} compact />
            </div>
          ))}
          {hasOddOpponentSlot && (
            <div className="tabletop-empty-seat-slot">
              <span>Another player would fit here</span>
            </div>
          )}
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

        <div
          className={`mobile-play-space${canPlayDraggedAction ? " action-drop-ready" : ""}${isPlaySpaceDragOver ? " action-drop-over" : ""}`}
          onDragEnter={(event) => {
            if (!canPlayDraggedAction) return;
            event.preventDefault();
            setIsPlaySpaceDragOver(true);
          }}
          onDragOver={(event) => {
            if (!canPlayDraggedAction) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setIsPlaySpaceDragOver(true);
          }}
          onDragLeave={() => setIsPlaySpaceDragOver(false)}
          onDrop={(event) => {
            if (!canPlayDraggedAction) return;
            event.preventDefault();
            setIsPlaySpaceDragOver(false);
            const cardId =
              event.dataTransfer.getData("application/x-mp-action-card-id") ||
              event.dataTransfer.getData("text/plain");
            if (cardId) onActionCardDrop?.(cardId);
          }}
        >
          {pendingAction ? (
            <MobilePendingActionInPlaySpace
              pendingAction={pendingAction}
              me={me}
              now={now}
              reactionHand={reactionHand}
              onReact={onReact}
            />
          ) : resolvedMobileAction ? (
            <MobileResolvedActionInPlaySpace card={resolvedMobileAction.card} />
          ) : (
            <>
              <strong>Play Space</strong>
              <span>{isPlaySpaceDragOver ? "Release to play this action" : "Drag action cards here"}</span>
            </>
          )}
        </div>

        {mobileDashboard && (
          <div className="mobile-table-dashboard-shell">
            {mobileDashboard}
          </div>
        )}

        {/* My storage zone */}
        <div
          className={`tabletop-player-zone tabletop-me-zone${me?.name === currentPlayerName ? " tabletop-zone-current" : ""}${
            canStoreDraggedResource ? " storage-drop-ready" : ""
          }${isStorageDragOver ? " storage-drop-over" : ""}`}
          onDragEnter={(event) => {
            if (!canStoreDraggedResource) return;
            event.preventDefault();
            setIsStorageDragOver(true);
          }}
          onDragOver={(event) => {
            if (!canStoreDraggedResource) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setIsStorageDragOver(true);
          }}
          onDragLeave={() => setIsStorageDragOver(false)}
          onDrop={(event) => {
            if (!canStoreDraggedResource) return;
            event.preventDefault();
            setIsStorageDragOver(false);
            const cardId =
              event.dataTransfer.getData("application/x-mp-resource-card-id") ||
              event.dataTransfer.getData("text/plain");
            if (cardId) onStoreResourceDrop(cardId);
          }}
        >
          <p className="tabletop-zone-label">Your Storage</p>
          {canStoreDraggedResource && <p className="storage-drop-hint">Drag resources here to store them.</p>}
          <StorageCards cards={me?.storage || []} paginate={false} />
        </div>
      </div>

    </div>
  );
};

const StorageCards = ({ cards = [], compact = false, paginate = true }) => {
  const [page, setPage] = useState(0);
  const [slotsPerRow, setSlotsPerRow] = useState(10);
  const containerRef = useRef(null);

  const groups = groupCardsByKey(cards);

  useLayoutEffect(() => {
    if (!paginate) return;
    const cardWidth = compact ? 44 : 54;
    const gap = compact ? 7 : 9;

    const compute = () => {
      const el = containerRef.current;
      if (!el) return;
      const w = el.getBoundingClientRect().width;
      if (w === 0) return;
      setSlotsPerRow(Math.max(2, Math.floor((w + gap) / (cardWidth + gap))));
    };

    compute();
    const ro = new ResizeObserver(compute);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [slotsPerRow]);

  const needsPagination = paginate && groups.length > slotsPerRow;
  const cardsPerPage = needsPagination ? slotsPerRow - 1 : groups.length;
  const totalPages = needsPagination ? Math.ceil(groups.length / cardsPerPage) : 1;
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const hasPrev = needsPagination && safePage > 0;
  const hasNext = needsPagination && safePage < totalPages - 1;
  const visible = needsPagination
    ? groups.slice(safePage * cardsPerPage, (safePage + 1) * cardsPerPage)
    : groups;

  return (
    <div ref={containerRef} className={`storage-card-grid ${compact ? "compact-storage-cards" : ""}`}>
      {groups.length === 0 ? (
        <p className="empty-storage">No resources stored yet.</p>
      ) : (
        <>
          {hasPrev && (
            <button className="storage-nav-btn" onClick={() => setPage(safePage - 1)}>&#8249;</button>
          )}
          {visible.map(({ card, count }) => (
            <article className="storage-stack-card" key={card.key} title={`${card.name} × ${count}`}>
              <div className="stack-shadow stack-shadow-one" />
              {count > 1 && <div className="stack-shadow stack-shadow-two" />}
              <CardFace card={card} compact />
              <span className="storage-count-badge">×{count}</span>
            </article>
          ))}
          {hasNext && (
            <button className="storage-nav-btn" onClick={() => setPage(safePage + 1)}>&#8250;</button>
          )}
        </>
      )}
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
  const requiresSingleTarget = card.key !== "absoluteCalamity";
  const [selectedTarget, setSelectedTarget] = useState(
    opponents.some((player) => player.name === defaultTargetName) ? defaultTargetName : opponents[0]?.name || ""
  );
  const [selectedStorageCardId, setSelectedStorageCardId] = useState("");
  const [sabotageStorageCardIds, setSabotageStorageCardIds] = useState([]);
  const [selectedHandIndex, setSelectedHandIndex] = useState(0);
  const [targetGoalIndex, setTargetGoalIndex] = useState(0);
  const [myGoalIndex, setMyGoalIndex] = useState(0);
  const calamityTargets = useMemo(
    () =>
      card.key === "absoluteCalamity"
        ? (gameState.players || [])
            .map((player) => ({
              ...player,
              storage: (player.storage || []).filter((storedCard) => storedCard.type === "resource"),
            }))
            .filter((player) => player.storage.length > 0)
        : [],
    [card.key, gameState.players]
  );
  const [calamitySelections, setCalamitySelections] = useState(() =>
    Object.fromEntries(calamityTargets.map((player) => [player.name, player.storage[0]?.id || ""]))
  );

  const targetPlayer = gameState.players.find((player) => player.name === selectedTarget);
  const sabotageCards = (targetPlayer?.storage || []).filter(canSabotageDiscard);

  useEffect(() => {
    setSelectedStorageCardId(targetPlayer?.storage?.[0]?.id || "");
    setSabotageStorageCardIds([]);
    setSelectedHandIndex(0);
    setTargetGoalIndex(0);
  }, [selectedTarget, targetPlayer?.storage]);

  useEffect(() => {
    if (card.key !== "absoluteCalamity") return;
    setCalamitySelections((current) => {
      const next = {};
      calamityTargets.forEach((player) => {
        next[player.name] = player.storage.some((storedCard) => storedCard.id === current[player.name])
          ? current[player.name]
          : player.storage[0]?.id || "";
      });
      return next;
    });
  }, [card.key, calamityTargets]);

  const toggleSabotageCard = (cardId) => {
    setSabotageStorageCardIds((ids) => {
      if (ids.includes(cardId)) return ids.filter((selectedId) => selectedId !== cardId);
      if (ids.length >= 2) return ids;
      return [...ids, cardId];
    });
  };

  const confirm = () => {
    const payload = requiresSingleTarget ? { targetName: selectedTarget } : {};
    if (card.key === "theft") payload.storageCardId = selectedStorageCardId;
    if (card.key === "sabotage") payload.sabotageCardIds = sabotageStorageCardIds;
    if (card.key === "robbery") payload.handIndex = selectedHandIndex;
    if (card.key === "absoluteCalamity") {
      payload.calamityDiscards = calamityTargets.map((player) => ({
        playerName: player.name,
        cardId: calamitySelections[player.name],
      }));
    }
    if (card.key === "goalRemoval") payload.goalIndex = targetGoalIndex;
    if (card.key === "goalSwap") {
      payload.goalIndex = targetGoalIndex;
      payload.myGoalIndex = myGoalIndex;
    }
    onConfirm(payload);
  };

  const canConfirm = Boolean(
    (requiresSingleTarget ? selectedTarget : true) &&
      (card.key !== "theft" || selectedStorageCardId) &&
      (card.key !== "sabotage" || (sabotageStorageCardIds.length > 0 && sabotageStorageCardIds.length <= 2)) &&
      (card.key !== "robbery" || (targetPlayer?.handCount || 0) > 0) &&
      (card.key !== "absoluteCalamity" ||
        (calamityTargets.length > 0 && calamityTargets.every((player) => calamitySelections[player.name])))
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="action-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Configure action</p>
            <h2>{card.name}</h2>
          </div>
          <button className="ghost-button close-modal-button desktop-modal-close-button" onClick={onClose}>✕</button>
        </div>
        <p className="modal-description">{card.description}</p>

        {requiresSingleTarget && (
          <>
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
          </>
        )}

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

        {card.key === "sabotage" && (
          <div className="modal-picker-section sabotage-picker-section">
            <h3>Choose 1 or 2 stored cards to discard</h3>
            <p className="modal-description">Pick them in discard order. Gold and Diamond are protected.</p>
            <div className="selectable-card-grid">
              {sabotageCards.map((storedCard) => {
                const selectedOrder = sabotageStorageCardIds.indexOf(storedCard.id);
                return (
                  <button
                    key={storedCard.id}
                    type="button"
                    className={`selectable-card ${selectedOrder >= 0 ? "selected" : ""}`}
                    onClick={() => toggleSabotageCard(storedCard.id)}
                  >
                    <CardFace card={storedCard} compact hoverMode="title" />
                    <span>{selectedOrder >= 0 ? `Discard ${selectedOrder + 1}` : storedCard.name}</span>
                  </button>
                );
              })}
              {sabotageCards.length === 0 && <p className="empty-storage">No discardable storage cards. Gold and Diamond cannot be discarded.</p>}
            </div>
          </div>
        )}

        {card.key === "absoluteCalamity" && (
          <div className="modal-picker-section calamity-picker-section">
            <h3>Choose one stored resource to discard from each player</h3>
            {calamityTargets.length === 0 ? (
              <p className="empty-storage">No one has resources in storage.</p>
            ) : (
              calamityTargets.map((player) => (
                <div className="calamity-player-picker" key={player.name}>
                  <h4>{player.name}</h4>
                  <div className="selectable-card-grid">
                    {player.storage.map((storedCard) => (
                      <button
                        key={storedCard.id}
                        type="button"
                        className={`selectable-card ${calamitySelections[player.name] === storedCard.id ? "selected" : ""}`}
                        onClick={() =>
                          setCalamitySelections((current) => ({ ...current, [player.name]: storedCard.id }))
                        }
                      >
                        <CardFace card={storedCard} compact hoverMode="title" />
                        <span>{storedCard.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
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
        <button type="button" className="ghost-button modal-secondary-close" onClick={onClose}>
          Close
        </button>
      </section>
    </div>
  );
};

const TradeBuilderModal = ({ hand, storage, opponents, defaultTargetName, onClose, onConfirm }) => {
  const [selectedHandIds, setSelectedHandIds] = useState([]);
  const [selectedStorageIds, setSelectedStorageIds] = useState([]);
  const [targetMode, setTargetMode] = useState("everyone");
  const [target, setTarget] = useState(
    opponents.some((player) => player.name === defaultTargetName) ? defaultTargetName : opponents[0]?.name || ""
  );
  const [useBinding, setUseBinding] = useState(false);

  const selectedCount = selectedHandIds.length + selectedStorageIds.length;
  const hasBinding = hand.some((card) => card.key === "bindingContract" && !selectedHandIds.includes(card.id));

  const toggleHandCard = (id) => {
    setSelectedHandIds((ids) => {
      if (ids.includes(id)) return ids.filter((selectedId) => selectedId !== id);
      if (selectedCount >= 4) return ids;
      return [...ids, id];
    });
  };

  const toggleStorageCard = (id) => {
    setSelectedStorageIds((ids) => {
      if (ids.includes(id)) return ids.filter((selectedId) => selectedId !== id);
      if (selectedCount >= 4) return ids;
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
          <button className="ghost-button close-modal-button desktop-modal-close-button" onClick={onClose}>✕</button>
        </div>

        <p className="trade-storage-note">
          Hand cards stay hand cards after trading. Storage cards stay storage cards after trading.
        </p>

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
        <SelectableOfferGrid
          hand={hand}
          storage={storage}
          selectedHandIds={selectedHandIds}
          selectedStorageIds={selectedStorageIds}
          onToggleHand={toggleHandCard}
          onToggleStorage={toggleStorageCard}
        />

        <button
          className="gold-button modal-confirm-button"
          disabled={targetMode === "specific" && !target}
          onClick={() => onConfirm({
            targetName: targetMode === "specific" ? target : "",
            cardIds: selectedHandIds,
            storageCardIds: selectedStorageIds,
            useBinding,
          })}
        >
          Offer Trade
        </button>
        <button type="button" className="ghost-button modal-secondary-close" onClick={onClose}>
          Close
        </button>
      </section>
    </div>
  );
};

const TradeResponseModal = ({ hand, storage, trade, onClose, onConfirm }) => {
  const [selectedHandIds, setSelectedHandIds] = useState([]);
  const [selectedStorageIds, setSelectedStorageIds] = useState([]);
  const selectedCount = selectedHandIds.length + selectedStorageIds.length;

  const toggleHandCard = (id) => {
    setSelectedHandIds((ids) => {
      if (ids.includes(id)) return ids.filter((selectedId) => selectedId !== id);
      if (selectedCount >= 4) return ids;
      return [...ids, id];
    });
  };

  const toggleStorageCard = (id) => {
    setSelectedStorageIds((ids) => {
      if (ids.includes(id)) return ids.filter((selectedId) => selectedId !== id);
      if (selectedCount >= 4) return ids;
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
          <button className="ghost-button close-modal-button desktop-modal-close-button" onClick={onClose}>✕</button>
        </div>

        {trade.bindingUsed && (
          <p className="binding-contract-alert">
            {trade.initiatorName} used Binding Contract on this trade. If the trade is accepted, no one can use It's a Scam.
          </p>
        )}

        <TradeOffer title={`${trade.initiatorName} offers`} cards={trade.initiatorOffer} handCards={trade.initiatorOfferHand} storageCards={trade.initiatorOfferStorage} />
        <h3>Select 0 to 4 cards to offer back</h3>
        <SelectableOfferGrid
          hand={hand}
          storage={storage}
          selectedHandIds={selectedHandIds}
          selectedStorageIds={selectedStorageIds}
          onToggleHand={toggleHandCard}
          onToggleStorage={toggleStorageCard}
        />

        <button className="gold-button modal-confirm-button" onClick={() => onConfirm({ cardIds: selectedHandIds, storageCardIds: selectedStorageIds })}>
          Send Response
        </button>
        <button type="button" className="ghost-button modal-secondary-close" onClick={onClose}>
          Close
        </button>
      </section>
    </div>
  );
};

const SelectableOfferGrid = ({ hand, storage, selectedHandIds, selectedStorageIds, onToggleHand, onToggleStorage }) => (
  <div className="trade-offer-picker">
    <div>
      <h4>Hand</h4>
      <div className="selectable-card-grid trade-select-grid">
        {hand.map((card) => (
          <button
            key={card.id}
            type="button"
            className={`selectable-card ${selectedHandIds.includes(card.id) ? "selected" : ""}`}
            onClick={() => onToggleHand(card.id)}
          >
            <CardFace card={card} compact hoverMode={card.type === "resource" ? "title" : "none"} />
            <span>{card.name}</span>
          </button>
        ))}
        {hand.length === 0 && <p className="empty-storage">No cards in hand.</p>}
      </div>
    </div>
    <div>
      <h4>Storage</h4>
      <div className="selectable-card-grid trade-select-grid">
        {storage.map((card) => (
          <button
            key={card.id}
            type="button"
            className={`selectable-card ${selectedStorageIds.includes(card.id) ? "selected" : ""}`}
            onClick={() => onToggleStorage(card.id)}
          >
            <CardFace card={card} compact hoverMode="title" />
            <span>{card.name}</span>
          </button>
        ))}
        {storage.length === 0 && <p className="empty-storage">No stored cards.</p>}
      </div>
    </div>
  </div>
);

const ActionReadyModal = ({ goal, goalIndex, hand, onClose, onConfirm }) => {
  const actionCards = hand.filter((card) => card.type === "action");
  const [selectedIds, setSelectedIds] = useState(() => actionCards.slice(0, 7).map((card) => card.id));

  const toggleCard = (id) => {
    setSelectedIds((ids) => {
      if (ids.includes(id)) return ids.filter((selectedId) => selectedId !== id);
      if (ids.length >= 7) return ids;
      return [...ids, id];
    });
  };

  const hasEnoughActions = actionCards.length >= 7;
  const canConfirm = hasEnoughActions && selectedIds.length === 7;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="action-ready-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Special completion</p>
            <h2>{goal.name}</h2>
          </div>
          <button className="ghost-button close-modal-button desktop-modal-close-button" onClick={onClose}>✕</button>
        </div>

        <p className="modal-description">
          Select exactly 7 action cards to reveal to everyone. These cards stay in your hand.
        </p>

        {!hasEnoughActions && (
          <p className="danger-note">You need at least 7 action cards in hand to complete Action-Ready.</p>
        )}

        <div className="action-ready-count-row">
          <span>{selectedIds.length} / 7 selected</span>
          <span>{actionCards.length} action cards available</span>
        </div>

        <div className="selectable-card-grid action-ready-grid">
          {actionCards.map((card) => (
            <button
              key={card.id}
              type="button"
              className={`selectable-card action-ready-selectable ${selectedIds.includes(card.id) ? "selected" : ""}`}
              onClick={() => toggleCard(card.id)}
              disabled={!selectedIds.includes(card.id) && selectedIds.length >= 7}
            >
              <CardFace card={card} compact hoverMode="none" />
              <span>{card.name}</span>
            </button>
          ))}
        </div>

        <button
          className="gold-button modal-confirm-button"
          disabled={!canConfirm}
          onClick={() => onConfirm({ goalIndex, actionCardIds: selectedIds })}
        >
          Reveal 7 Actions
        </button>
        <button type="button" className="ghost-button modal-secondary-close" onClick={onClose}>
          Close
        </button>
      </section>
    </div>
  );
};

const MeditatorModal = ({ goal, goalIndex, hand, onClose, onConfirm }) => {
  const actionCards = hand.filter((card) => card.type === "action");
  const [selectedIds, setSelectedIds] = useState(() => actionCards.slice(0, 4).map((card) => card.id));

  const toggleCard = (id) => {
    setSelectedIds((ids) => {
      if (ids.includes(id)) return ids.filter((selectedId) => selectedId !== id);
      if (ids.length >= 4) return ids;
      return [...ids, id];
    });
  };

  const hasEnoughActions = actionCards.length >= 4;
  const canConfirm = hasEnoughActions && selectedIds.length === 4;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="action-ready-modal meditator-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Special completion</p>
            <h2>{goal.name}</h2>
          </div>
          <button className="ghost-button close-modal-button desktop-modal-close-button" onClick={onClose}>✕</button>
        </div>

        <p className="modal-description">
          Select exactly 4 action cards to discard. These cards go to the discard pile, and Meditator scores 3 points only if all 4 are valid action cards.
        </p>

        {!hasEnoughActions && (
          <p className="danger-note">You need at least 4 action cards in hand to complete Meditator.</p>
        )}

        <div className="action-ready-count-row">
          <span>{selectedIds.length} / 4 selected</span>
          <span>{actionCards.length} action cards available</span>
        </div>

        <div className="selectable-card-grid action-ready-grid">
          {actionCards.map((card) => (
            <button
              key={card.id}
              type="button"
              className={`selectable-card action-ready-selectable ${selectedIds.includes(card.id) ? "selected" : ""}`}
              onClick={() => toggleCard(card.id)}
              disabled={!selectedIds.includes(card.id) && selectedIds.length >= 4}
            >
              <CardFace card={card} compact hoverMode="none" />
              <span>{card.name}</span>
            </button>
          ))}
        </div>

        <button
          className="danger-button modal-confirm-button"
          disabled={!canConfirm}
          onClick={() => onConfirm({ goalIndex, actionCardIds: selectedIds })}
        >
          Discard 4 Actions
        </button>
        <button type="button" className="ghost-button modal-secondary-close" onClick={onClose}>
          Close
        </button>
      </section>
    </div>
  );
};

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
          <button className="ghost-button close-modal-button desktop-modal-close-button" onClick={onClose}>✕</button>
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
        <button type="button" className="ghost-button modal-secondary-close" onClick={onClose}>
          Close
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
    {getCardImage(card) ? <img src={getCardImage(card)} alt={card.name} /> : <span>{hyphenateLongWords(card.name)}</span>}
    <span className="hover-card-details hover-card-title-only">
      <strong>{hyphenateLongWords(card.name)}</strong>
    </span>
  </button>
);

const PlayerAvatar = ({ player, size = "normal" }) => (
  <span className={`player-avatar player-avatar-${size}`} style={getAvatarStyle(player)}>
    {getInitial(player)}
  </span>
);

const CombinedDiscardModal = ({ playingCards = [], goalCards = [], onClose, onExpandGoal }) => {
  const [activePile, setActivePile] = useState("playing");
  const cards = activePile === "playing"
    ? playingCards.map((card) => ({ ...card, pileLabel: "Card discard", isGoalCard: false })).reverse()
    : goalCards.map((card) => ({ ...card, pileLabel: "Goal discard", isGoalCard: true })).reverse();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="discard-modal combined-discard-modal" onClick={(event) => event.stopPropagation()}>
        <p className="eyebrow" style={{ textAlign: "center" }}>Table Memory</p>
        <h2 className="discard-modal-title">Discarded Cards</h2>
        <div className="combined-discard-tabs">
          <button
            type="button"
            className={activePile === "playing" ? "active" : ""}
            onClick={() => setActivePile("playing")}
          >
            Card discard ({playingCards.length})
          </button>
          <button
            type="button"
            className={activePile === "goals" ? "active" : ""}
            onClick={() => setActivePile("goals")}
          >
            Goal discard ({goalCards.length})
          </button>
        </div>
        {cards.length === 0 ? (
          <p className="empty-storage" style={{ textAlign: "center", margin: "24px 0" }}>Nothing here yet.</p>
        ) : (
          <div className="discard-modal-grid">
            {cards.map((card) => (
              <article className="discard-modal-card" key={`${card.pileLabel}-${card.id}`}>
                <CardFace
                  card={card}
                  compact
                  className={!card.isGoalCard && card.type === "action" ? "discard-action-card-face" : ""}
                  hoverMode={card.isGoalCard ? "expand" : card.type === "action" ? "none" : undefined}
                  hoverButtonLabel="Expand"
                  onHoverButtonClick={card.isGoalCard ? () => onExpandGoal?.(card) : undefined}
                  onClick={card.isGoalCard ? () => { if (isMobileTableViewport()) onExpandGoal?.(card); } : undefined}
                  noHoverScale={card.isGoalCard}
                />
                <span>{hyphenateLongWords(card.name)}</span>
              </article>
            ))}
          </div>
        )}
        <button className="ghost-button discard-modal-close" onClick={onClose}>Close</button>
      </section>
    </div>
  );
};

const DiscardPileModal = ({ playingCards = [], goalCards = [], title = "Discard Pile", onClose, onExpandGoal }) => {
  const combined = [
    ...playingCards.map((card) => ({ ...card, pileLabel: "Playing discard", isGoalCard: false })),
    ...goalCards.map((card) => ({ ...card, pileLabel: "Goal discard", isGoalCard: true })),
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
                <CardFace
                  card={card}
                  compact
                  className={!card.isGoalCard && card.type === "action" ? "discard-action-card-face" : ""}
                  hoverMode={card.isGoalCard ? "expand" : card.type === "action" ? "none" : undefined}
                  hoverButtonLabel="Expand"
                  onHoverButtonClick={card.isGoalCard ? () => onExpandGoal?.(card) : undefined}
                  onClick={card.isGoalCard ? () => { if (isMobileTableViewport()) onExpandGoal?.(card); } : undefined}
                  noHoverScale={card.isGoalCard}
                />
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
      <section className="discard-modal magic-hand-choice-modal image-only-choice-modal">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Magic Hand</p>
            <h2>Choose from the discard pile</h2>
          </div>
        </div>
        <p className="modal-description">Pick one available playing card, then confirm to add it to your hand.</p>
        <div className="discard-modal-grid magic-hand-image-grid">
          {(choice.choices || []).map((card) => (
            <button
              type="button"
              className={`discard-modal-card selectable-discard-card magic-hand-image-choice ${selectedCardId === card.id ? "selected" : ""}`}
              key={card.id}
              onClick={() => setSelectedCardId(card.id)}
              aria-label={`Choose ${card.name || titleCase(card.key || "card")}`}
              title={card.name || titleCase(card.key || "card")}
            >
              <CardFace card={card} compact hoverMode="none" noHoverScale className="magic-hand-choice-face" />
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


const ExpandedGoalCardModal = ({ card, onClose }) => {
  const image = getCardImage(card);
  const title = card?.name || titleCase(card?.key || "Goal Card");

  return (
    <div className="modal-backdrop expanded-goal-backdrop" onClick={onClose}>
      <section className="expanded-goal-modal" onClick={(event) => event.stopPropagation()}>
        <button className="ghost-button close-modal-button expanded-goal-close desktop-modal-close-button" onClick={onClose}>✕</button>
        <div className="expanded-goal-image-wrap">
          {image ? <img src={image} alt={title} /> : <div className="card-fallback">{hyphenateLongWords(title)}</div>}
        </div>
        <div className="expanded-goal-details">
          <p className="eyebrow">Goal Card</p>
          <h2>{hyphenateLongWords(title)}</h2>
          <p>{card?.description || "Read the enlarged card to check this goal."}</p>
          <strong>{card?.key === "investor" ? "Variable points" : `${card?.points || 1} point${(card?.points || 1) === 1 ? "" : "s"}`}</strong>
        </div>
        <button type="button" className="ghost-button modal-secondary-close" onClick={onClose}>
          Close
        </button>
      </section>
    </div>
  );
};

const RevealModal = ({ reveal, onClose }) => {
  const isActionReady = reveal.type === "actionReadyReveal";
  const title = isActionReady ? `${reveal.actorName} completed Action-Ready` : `${reveal.targetName}'s Hand`;
  const eyebrow = isActionReady ? "Goal completed" : "Oracle's Power";
  const emptyText = isActionReady ? "No action cards were revealed." : "That player has no cards in hand.";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="discard-modal oracle-reveal-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2>{hyphenateLongWords(title)}</h2>
          </div>
          <button className="ghost-button close-modal-button desktop-modal-close-button" onClick={onClose}>✕</button>
        </div>
        {isActionReady && (
          <p className="modal-description">{reveal.actorName} revealed 7 action cards to complete the task Action-Ready.</p>
        )}
        {(reveal.cards || []).length === 0 ? (
          <p className="empty-storage">{emptyText}</p>
        ) : (
          <div className="discard-modal-grid oracle-hand-grid">
            {reveal.cards.map((card) => (
              <article className="discard-modal-card" key={card.id}>
                <CardFace card={card} compact hoverMode={isActionReady ? "none" : undefined} />
                <span>{hyphenateLongWords(card.name)}</span>
              </article>
            ))}
          </div>
        )}
        <button type="button" className="ghost-button modal-secondary-close" onClick={onClose}>
          Close
        </button>
      </section>
    </div>
  );
};
