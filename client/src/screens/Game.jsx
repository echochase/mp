import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGameSocket } from "../hooks/useGameSocket.js";
import { useGameEffects } from "../hooks/useGameEffects.js";
import { useCardPermissions } from "../hooks/useCardPermissions.js";
import "../styles/game.css";
import { CANCEL_REACTION_KEYS, TARGETED_ACTION_KEYS, sortCards } from "../utils/cards.js";
import { PlayerAvatar } from "../components/game/PlayerAvatar.jsx";
import { GoalCard } from "../components/game/cards/GoalCard.jsx";
import { DesktopPendingActionPanel } from "../components/game/panels/DesktopPendingActionPanel.jsx";
import { ActiveTradePanel } from "../components/game/panels/ActiveTradePanel.jsx";
import { CompletedGoalsPanel } from "../components/game/panels/CompletedGoalsPanel.jsx";
import { HandPanel } from "../components/game/panels/HandPanel.jsx";
import { MyProgressPanel } from "../components/game/panels/MyProgressPanel.jsx";
import { MobileTableDashboard } from "../components/game/mobile/MobileTableDashboard.jsx";
import { TableTopView } from "../components/game/table/TableTopView.jsx";
import { SeatingOrder } from "../components/game/table/SeatingOrder.jsx";
import { ActionTargetModal } from "../components/game/modals/ActionTargetModal.jsx";
import { TradeBuilderModal } from "../components/game/modals/TradeBuilderModal.jsx";
import { TradeResponseModal } from "../components/game/modals/TradeResponseModal.jsx";
import { ActionCardSelectionModal } from "../components/game/modals/ActionCardSelectionModal.jsx";
import { InvestorModal } from "../components/game/modals/InvestorModal.jsx";
import { DesktopDiscardModal } from "../components/game/modals/DesktopDiscardModal.jsx";
import { MobileDiscardModal } from "../components/game/mobile/MobileDiscardModal.jsx";
import { MagicHandChoiceModal } from "../components/game/modals/MagicHandChoiceModal.jsx";
import { ExpandedGoalCardModal } from "../components/game/modals/ExpandedGoalCardModal.jsx";
import { RevealModal } from "../components/game/modals/RevealModal.jsx";
import { TableLogModal } from "../components/game/modals/TableLogModal.jsx";
import { StorageModal } from "../components/game/modals/StorageModal.jsx";
import { SeatingOrderModal } from "../components/game/modals/SeatingOrderModal.jsx";

export const Game = ({ socket, name, room, setRoom }) => {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const { gameState, error } = useGameSocket(socket, name, roomCode, room, setRoom);
  const { newCardIds, turnPulse, noticeToast, resolvedMobileAction, now } = useGameEffects(gameState);
  const [activeModal, setActiveModal] = useState(null);
  const [dismissedRevealIds, setDismissedRevealIds] = useState(new Set());

  const closeModal = () => setActiveModal(null);

  useEffect(() => {
    if (!gameState?.activeTrade)
      setActiveModal((m) => (m?.type === "tradeResponse" ? null : m));
  }, [gameState?.activeTrade]);

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

  const { canStoreResourceCard, canPlayActionCard, tableLocked } = useCardPermissions(gameState, me);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") return;

      let handled = true;
      if (activeModal) closeModal();
      else if (activeReveal) setDismissedRevealIds((ids) => new Set([...ids, activeReveal.id]));
      else handled = false;

      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [activeModal, activeReveal]);

  const playCard = (card, extraPayload = {}) => {
    socket.emit("play-card", roomCode, { cardIndex: card.originalIndex, ...extraPayload });
  };

  const beginPlayCard = (card) => {
    const needsModal = TARGETED_ACTION_KEYS.includes(card.key) || card.needsTarget;
    if (needsModal && card.type === "action" && !CANCEL_REACTION_KEYS.includes(card.key)) {
      setActiveModal({ type: "actionTarget", card });
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
    closeModal();
  };

  const completeActionReady = ({ goalIndex, actionCardIds }) => {
    socket.emit("complete-action-ready", roomCode, { goalIndex, actionCardIds });
    closeModal();
  };

  const completeMeditator = ({ goalIndex, actionCardIds }) => {
    socket.emit("complete-meditator", roomCode, { goalIndex, actionCardIds });
    closeModal();
  };

  const createTrade = (payload) => {
    socket.emit("create-trade", roomCode, payload);
    closeModal();
  };

  const respondTrade = (payload) => {
    socket.emit("respond-trade", roomCode, payload);
    closeModal();
  };

  const acceptTrade = () => socket.emit("accept-trade", roomCode);
  const declineTrade = () => socket.emit("decline-trade", roomCode);
  const playScam = () => socket.emit("play-scam", roomCode);
  const chooseDiscardCard = (cardId) => socket.emit("choose-discard-card", roomCode, { cardId });
  const endTurn = () => socket.emit("end-turn", roomCode);

  const storeResourceCard = (card) => {
    if (!canStoreResourceCard(card)) return;
    playCard(card);
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
                    onInvestor={() => setActiveModal({ type: "investor", goal, goalIndex: index })}
                    onActionReady={() => setActiveModal({ type: "actionReady", goal, goalIndex: index })}
                    onMeditator={() => setActiveModal({ type: "meditator", goal, goalIndex: index })}
                    actionCardsAvailable={(me.hand || []).filter((handCard) => handCard.type === "action").length}
                    onExpand={() => setActiveModal({ type: "expandedGoal", card: goal })}
                  />
                ))}
              </div>
            </section>
          </div>
          <CompletedGoalsPanel
            completedGoals={me.completedGoals || []}
            onOpen={() => setActiveModal({ type: "completedGoals" })}
            onExpandGoal={(card) => setActiveModal({ type: "expandedGoal", card })}
          />
        </aside>

        {/* ── CENTRE: tabletop ── */}
        <section className="tabletop-column">
          {gameState.pendingAction && (
            <DesktopPendingActionPanel
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
              onRespond={() => setActiveModal({ type: "tradeResponse" })}
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
            onOpenCardDiscard={() => setActiveModal({ type: "discardPile" })}
            onOpenGoalDiscard={() => setActiveModal({ type: "goalDiscard" })}
            canPlayDraggedAction={sortedHand.some(canPlayActionCard)}
            onActionCardDrop={handleActionDrop}
            pendingAction={gameState.pendingAction}
            resolvedMobileAction={resolvedMobileAction}
            now={now}
            reactionHand={sortedHand}
            onReact={(card) => playCard(card)}
            onOpenStorage={(player) => setActiveModal({ type: "storage", player })}
            mobileDashboard={
              <MobileTableDashboard
                me={me}
                isCurrent={me.name === gameState.currentPlayerName}
                disabled={Boolean(gameState.winner) || tableLocked}
                onReroll={rerollGoal}
                onInvestor={(goal, goalIndex) => setActiveModal({ type: "investor", goal, goalIndex })}
                onActionReady={(goal, goalIndex) => setActiveModal({ type: "actionReady", goal, goalIndex })}
                onMeditator={(goal, goalIndex) => setActiveModal({ type: "meditator", goal, goalIndex })}
                actionCardsAvailable={(me.hand || []).filter((handCard) => handCard.type === "action").length}
                onExpandGoal={(card) => setActiveModal({ type: "expandedGoal", card })}
                deckCounts={gameState.deckCounts}
                onOpenSeating={() => setActiveModal({ type: "seatingOrder" })}
                onOpenCompleted={() => setActiveModal({ type: "completedGoals" })}
                onOpenLog={() => setActiveModal({ type: "tableLog" })}
                onOpenDiscarded={() => setActiveModal({ type: "combinedDiscard" })}
              />
            }
          />

          <HandPanel
            hand={sortedHand}
            me={me}
            gameState={gameState}
            tableLocked={tableLocked}
            newCardIds={newCardIds}
            canStoreResourceCard={canStoreResourceCard}
            canPlayActionCard={canPlayActionCard}
            onOpenTrade={() => setActiveModal({ type: "tradeBuilder" })}
            onEndTurn={endTurn}
            onPlay={beginPlayCard}
            onDiscard={discardCard}
          />
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
                onClick={() => setActiveModal({ type: "seatingOrder" })}
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
              <button className="mobile-log-expand-button" type="button" onClick={() => setActiveModal({ type: "tableLog" })}>
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

      {activeModal?.type === "actionTarget" && (
        <ActionTargetModal
          card={activeModal.card}
          gameState={gameState}
          me={me}
          opponents={opponents}
          defaultTargetName={defaultTargetName}
          onClose={closeModal}
          onConfirm={(payload) => {
            playCard(activeModal.card, payload);
            closeModal();
          }}
        />
      )}

      {activeModal?.type === "tradeBuilder" && (
        <TradeBuilderModal
          hand={sortedHand}
          storage={me.storage || []}
          opponents={opponents}
          defaultTargetName={defaultTargetName}
          onClose={closeModal}
          onConfirm={createTrade}
        />
      )}

      {activeModal?.type === "tradeResponse" && gameState.activeTrade && (
        <TradeResponseModal
          hand={sortedHand}
          storage={me.storage || []}
          trade={gameState.activeTrade}
          onClose={closeModal}
          onConfirm={respondTrade}
        />
      )}

      {activeModal?.type === "investor" && (
        <InvestorModal
          goal={activeModal.goal}
          goalIndex={activeModal.goalIndex}
          storage={me.storage}
          opponents={opponents}
          defaultTargetName={defaultTargetName}
          onClose={closeModal}
          onConfirm={completeInvestor}
        />
      )}

      {activeModal?.type === "actionReady" && (
        <ActionCardSelectionModal
          goal={activeModal.goal}
          goalIndex={activeModal.goalIndex}
          hand={me.hand || []}
          requiredCount={7}
          description="Select exactly 7 action cards to reveal to everyone. These cards stay in your hand."
          confirmLabel="Reveal 7 Actions"
          confirmVariant="gold-button"
          onClose={closeModal}
          onConfirm={completeActionReady}
        />
      )}

      {activeModal?.type === "meditator" && (
        <ActionCardSelectionModal
          goal={activeModal.goal}
          goalIndex={activeModal.goalIndex}
          hand={me.hand || []}
          requiredCount={4}
          description="Select exactly 4 action cards to discard. These cards go to the discard pile, and Meditator scores 3 points only if all 4 are valid action cards."
          confirmLabel="Discard 4 Actions"
          confirmVariant="danger-button"
          onClose={closeModal}
          onConfirm={completeMeditator}
        />
      )}

      {activeModal?.type === "completedGoals" && (
        <DesktopDiscardModal
          title="Completed Goals"
          goalCards={me.completedGoals || []}
          onClose={closeModal}
          onExpandGoal={(card) => setActiveModal({ type: "expandedGoal", card })}
        />
      )}

      {activeModal?.type === "goalDiscard" && (
        <DesktopDiscardModal
          title="Goal Discard"
          goalCards={gameState.discardPile?.goals || []}
          onClose={closeModal}
          onExpandGoal={(card) => setActiveModal({ type: "expandedGoal", card })}
        />
      )}

      {activeModal?.type === "discardPile" && (
        <DesktopDiscardModal
          title="Card Discard"
          playingCards={gameState.discardPile?.playing || []}
          onClose={closeModal}
        />
      )}

      {activeModal?.type === "combinedDiscard" && (
        <MobileDiscardModal
          playingCards={gameState.discardPile?.playing || []}
          goalCards={gameState.discardPile?.goals || []}
          onClose={closeModal}
          onExpandGoal={(card) => setActiveModal({ type: "expandedGoal", card })}
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

      {activeModal?.type === "expandedGoal" && (
        <ExpandedGoalCardModal card={activeModal.card} onClose={closeModal} />
      )}

      {activeModal?.type === "tableLog" && (
        <TableLogModal log={gameState.log || []} onClose={closeModal} />
      )}

      {activeModal?.type === "seatingOrder" && (
        <SeatingOrderModal
          players={gameState.players || []}
          currentPlayerName={gameState.currentPlayerName}
          meName={name}
          onClose={closeModal}
        />
      )}

      {activeModal?.type === "storage" && (
        <StorageModal
          player={activeModal.player}
          onClose={closeModal}
        />
      )}

      <button className="exit-table-button compact-exit-button" onClick={leaveTable}>Leave Table</button>
    </main>
  );
};
