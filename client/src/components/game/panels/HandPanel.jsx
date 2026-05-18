import { PlayingCard } from "../cards/PlayingCard.jsx";

export const HandPanel = ({
  hand,
  me,
  gameState,
  tableLocked,
  newCardIds,
  canStoreResourceCard,
  canPlayActionCard,
  onOpenTrade,
  onEndTurn,
  onPlay,
  onDiscard,
}) => {
  const pendingChoice = gameState.pendingChoice || me.pendingChoice;
  const activeTrade = gameState.activeTrade || pendingChoice;

  return (
    <section className="game-panel hand-panel compact-panel compact-hand-strip">
      <div className="panel-heading split-heading small-heading">
        <div>
          <p className="eyebrow">Your hand</p>
          <h2>{hand.length} cards</h2>
        </div>
        <div className="hand-header-right">
          {me.mustDiscard && <span className="danger-pill">Discard {hand.length - 8}</span>}
          <div className="hand-action-buttons">
            <button
              className={`trade-turn-button ${me.canCreateTrade ? "active" : ""}`}
              disabled={!me.canCreateTrade}
              onClick={onOpenTrade}
            >
              Trade
            </button>
            {!gameState.pendingAction && !pendingChoice && (
              <button
                className="gold-button"
                disabled={!me.isYourTurn || me.mustDiscard || Boolean(gameState.winner) || tableLocked}
                onClick={onEndTurn}
              >
                End Turn
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="card-strip compact-card-strip">
        {hand.map((card, displayIndex) => (
          <PlayingCard
            key={card.id || `${card.key}-${displayIndex}`}
            card={card}
            displayIndex={displayIndex}
            isNew={newCardIds.has(card.id)}
            disabled={Boolean(gameState.winner || pendingChoice)}
            isYourTurn={me.isYourTurn}
            actionPlayed={me.actionPlayed}
            mustDiscard={me.mustDiscard}
            pendingAction={gameState.pendingAction}
            activeTrade={activeTrade}
            canReactToAction={me.canReactToAction}
            canDragToStorage={canStoreResourceCard(card)}
            canDragToPlay={canPlayActionCard(card)}
            onPlay={() => onPlay(card)}
            onDiscard={() => onDiscard(card)}
          />
        ))}
      </div>
    </section>
  );
};
