import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/game.css";
import { GameProvider, useGame } from "../contexts/GameContext.jsx";
import { PlayerAvatar } from "../components/game/PlayerAvatar.jsx";
import { GoalCard } from "../components/game/cards/GoalCard.jsx";
import { DesktopPendingActionPanel } from "../components/game/panels/DesktopPendingActionPanel.jsx";
import { CompletedGoalsPanel } from "../components/game/panels/CompletedGoalsPanel.jsx";
import { HandPanel } from "../components/game/panels/HandPanel.jsx";
import { MyProgressPanel } from "../components/game/panels/MyProgressPanel.jsx";
import { TableTopView } from "../components/game/table/TableTopView.jsx";
import { SeatingOrder } from "../components/game/table/SeatingOrder.jsx";
import { ActionTargetModal } from "../components/game/modals/ActionTargetModal.jsx";
import { TradeBuilderModal } from "../components/game/modals/TradeBuilderModal.jsx";
import { TradeResponseModal } from "../components/game/modals/TradeResponseModal.jsx";
import { TradeDetailsModal } from "../components/game/modals/TradeDetailsModal.jsx";
import { ActionCardSelectionModal } from "../components/game/modals/ActionCardSelectionModal.jsx";
import { InvestorModal } from "../components/game/modals/InvestorModal.jsx";
import { DesktopDiscardModal } from "../components/game/modals/DesktopDiscardModal.jsx";
import { MobileDiscardModal } from "../components/game/mobile/MobileDiscardModal.jsx";
import { MagicHandChoiceModal } from "../components/game/modals/MagicHandChoiceModal.jsx";
import { ExpandedCardModal } from "../components/game/modals/ExpandedCardModal.jsx";
import { RevealModal } from "../components/game/modals/RevealModal.jsx";
import { TableLogModal } from "../components/game/modals/TableLogModal.jsx";
import { StorageModal } from "../components/game/modals/StorageModal.jsx";
import { SeatingOrderModal } from "../components/game/modals/SeatingOrderModal.jsx";

const GameLayout = () => {
  const {
    gameState, error, me, name, roomCode,
    magicHandChoice, turnPulse, noticeToast,
    activeModal, openModal, closeModal, activeReveal, dismissReveal,
    leaveTable, completeActionReady, completeMeditator,
  } = useGame();

  const navigate = useNavigate();

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") return;
      let handled = true;
      if (activeModal) closeModal();
      else if (activeReveal) dismissReveal();
      else handled = false;
      if (handled) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [activeModal, activeReveal, closeModal, dismissReveal]);

  if (!gameState || !me) {
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
  const currentTurnPlayer = gameState.players?.find((p) => p.name === gameState.currentPlayerName);

  const tableLayoutClassName = [
    "table-layout",
    playerCount < 4 ? "mobile-low-player-count" : "",
    playerCount < 6 ? "mobile-under-full-lobby" : "mobile-full-lobby",
  ].filter(Boolean).join(" ");

  const gamePageClassName = [
    "game-page",
    playerCount < 6 ? "mobile-under-full-lobby-page" : "mobile-full-lobby-page",
  ].filter(Boolean).join(" ");

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
        {/* ── LEFT SIDEBAR ── */}
        <aside className="game-sidebar left-game-sidebar">
          <div className="mobile-progress-goals-combo">
            <MyProgressPanel />
            <section className="game-panel goals-panel compact-panel compact-goals-panel">
              <div className="panel-heading small-heading goals-panel-heading">
                <p className="eyebrow">Private</p>
                <h2>Your Goals</h2>
              </div>
              <div className="goals-grid compact-goals-grid">
                {me.goals.map((goal, index) => (
                  <GoalCard key={goal.id || `${goal.key}-${index}`} goal={goal} index={index} />
                ))}
              </div>
            </section>
          </div>
          <CompletedGoalsPanel />
        </aside>

        {/* ── CENTRE ── */}
        <section className="tabletop-column">
          {gameState.pendingAction && <DesktopPendingActionPanel />}
          <TableTopView />
          <HandPanel />
        </section>

        {/* ── RIGHT SIDEBAR ── */}
        <aside className="game-sidebar right-game-sidebar">
          <section className="game-panel compact-panel seating-panel">
            <div className="panel-heading split-heading small-heading seating-heading">
              <div>
                <p className="eyebrow">Players</p>
                <h2>Seating Order</h2>
              </div>
              <span className="deck-pill seated-count-pill">{gameState.players.length} seated</span>
              <button className="mobile-seating-expand-button" type="button" onClick={() => openModal("seatingOrder")}>
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
            <SeatingOrder showScore={false} />
          </section>
          <section className="game-panel log-panel compact-panel compact-log-panel mobile-collapsed-log-panel">
            <div className="panel-heading split-heading small-heading">
              <div>
                <p className="eyebrow">History</p>
                <h2>Table Log</h2>
              </div>
              <button className="mobile-log-expand-button" type="button" onClick={() => openModal("tableLog")}>Expand</button>
            </div>
            <div className="log-list compact-log-list">
              {gameState.log.slice().reverse().map((entry, index) => (
                <p key={`${entry}-${index}`}>{entry}</p>
              ))}
            </div>
          </section>
        </aside>
      </section>

      {activeModal?.type === "actionTarget" && <ActionTargetModal />}
      {activeModal?.type === "tradeBuilder" && <TradeBuilderModal />}
      {activeModal?.type === "tradeResponse" && gameState.activeTrade && <TradeResponseModal />}
      {activeModal?.type === "investor" && <InvestorModal />}
      {activeModal?.type === "actionReady" && (
        <ActionCardSelectionModal
          requiredCount={7}
          description="Select exactly 7 action cards to reveal to everyone. These cards stay in your hand."
          confirmLabel="Reveal 7 Actions"
          confirmVariant="gold-button"
          onConfirm={completeActionReady}
        />
      )}
      {activeModal?.type === "meditator" && (
        <ActionCardSelectionModal
          requiredCount={4}
          description="Select exactly 4 action cards to discard. These cards go to the discard pile, and Meditator scores 3 points only if all 4 are valid action cards."
          confirmLabel="Discard 4 Actions"
          confirmVariant="danger-button"
          onConfirm={completeMeditator}
        />
      )}
      {activeModal?.type === "completedGoals" && (
        <DesktopDiscardModal cards={me.completedGoals || []} title="Completed Goals" />
      )}
      {activeModal?.type === "goalDiscard" && (
        <DesktopDiscardModal cards={gameState.discardPile?.goals || []} title="Goal Discard" />
      )}
      {activeModal?.type === "discardPile" && (
        <DesktopDiscardModal cards={gameState.discardPile?.playing || []} title="Card Discard" />
      )}
      {activeModal?.type === "tradeDetails" && <TradeDetailsModal />}
      {activeModal?.type === "combinedDiscard" && <MobileDiscardModal />}
      {magicHandChoice && <MagicHandChoiceModal />}
      {activeReveal && <RevealModal />}
      {activeModal?.type === "expandedCard" && <ExpandedCardModal />}
      {activeModal?.type === "tableLog" && <TableLogModal />}
      {activeModal?.type === "seatingOrder" && <SeatingOrderModal />}
      {activeModal?.type === "storage" && <StorageModal />}

      <button className="exit-table-button compact-exit-button" onClick={leaveTable}>Leave Table</button>
    </main>
  );
};

export const Game = ({ socket, name, room, setRoom }) => {
  const { roomCode } = useParams();
  return (
    <GameProvider socket={socket} name={name} room={room} setRoom={setRoom} roomCode={roomCode}>
      <GameLayout />
    </GameProvider>
  );
};
