import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/game.css";
import { CANCEL_REACTION_KEYS, TARGETED_ACTION_KEYS, TRADE_TOOL_KEYS, sortCards } from "../utils/cards.js";
import { PlayerAvatar } from "../components/game/PlayerAvatar.jsx";
import { CardFace } from "../components/game/cards/CardFace.jsx";
import { PlayingCard } from "../components/game/cards/PlayingCard.jsx";
import { GoalCard } from "../components/game/cards/GoalCard.jsx";
import { PendingActionPanel } from "../components/game/panels/PendingActionPanel.jsx";
import { ActiveTradePanel } from "../components/game/panels/ActiveTradePanel.jsx";
import { CompletedGoalsPanel } from "../components/game/panels/CompletedGoalsPanel.jsx";
import { MyProgressPanel } from "../components/game/panels/MyProgressPanel.jsx";
import { MobileTableDashboard } from "../components/game/panels/MobileTableDashboard.jsx";
import { TableTopView } from "../components/game/table/TableTopView.jsx";
import { SeatingOrder } from "../components/game/table/SeatingOrder.jsx";
import { ActionTargetModal } from "../components/game/modals/ActionTargetModal.jsx";
import { TradeBuilderModal } from "../components/game/modals/TradeBuilderModal.jsx";
import { TradeResponseModal } from "../components/game/modals/TradeResponseModal.jsx";
import { ActionReadyModal } from "../components/game/modals/ActionReadyModal.jsx";
import { MeditatorModal } from "../components/game/modals/MeditatorModal.jsx";
import { InvestorModal } from "../components/game/modals/InvestorModal.jsx";
import { CombinedDiscardModal } from "../components/game/modals/CombinedDiscardModal.jsx";
import { DiscardPileModal } from "../components/game/modals/DiscardPileModal.jsx";
import { MagicHandChoiceModal } from "../components/game/modals/MagicHandChoiceModal.jsx";
import { ExpandedGoalCardModal } from "../components/game/modals/ExpandedGoalCardModal.jsx";
import { RevealModal } from "../components/game/modals/RevealModal.jsx";
import { TableLogModal } from "../components/game/modals/TableLogModal.jsx";
import { StorageModal } from "../components/game/modals/StorageModal.jsx";
import { SeatingOrderModal } from "../components/game/modals/SeatingOrderModal.jsx";

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
    </main>
  );
};
