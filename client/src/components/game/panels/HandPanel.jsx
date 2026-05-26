import { useGame } from "../../../contexts/GameContext.jsx";
import { PlayingCard } from "../cards/PlayingCard.jsx";

export const HandPanel = () => {
  const { sortedHand, me, gameState, tableLocked, openModal, endTurn } = useGame();

  const pendingChoice = gameState.pendingChoice || me.pendingChoice;

  return (
    <section className="game-panel hand-panel compact-panel compact-hand-strip">
      <div className="panel-heading split-heading small-heading">
        <div>
          <p className="eyebrow">Your hand</p>
          <h2>{sortedHand.length} cards</h2>
        </div>
        <div className="hand-header-right">
          {me.mustDiscard && <span className="danger-pill">Discard {sortedHand.length - 8}</span>}
          <div className="hand-action-buttons">
            <button
              className={`trade-turn-button ${me.canCreateTrade ? "active" : ""}`}
              disabled={!me.canCreateTrade}
              onClick={() => openModal("tradeBuilder")}
            >
              Trade
            </button>
            {!gameState.pendingAction && !pendingChoice && (
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
          />
        ))}
      </div>
    </section>
  );
};
