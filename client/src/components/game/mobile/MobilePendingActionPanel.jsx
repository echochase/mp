import { useGame } from "../../../contexts/GameContext.jsx";
import { CANCEL_REACTION_KEYS, formatCountdown, getPendingActionContext } from "../../../utils/cards.js";
import { CardFace } from "../cards/CardFace.jsx";

export const MobilePendingActionPanel = () => {
  const { gameState, me, now, sortedHand, playCard } = useGame();
  const { pendingAction } = gameState;

  const reactionCards = sortedHand.filter((card) => CANCEL_REACTION_KEYS.includes(card.key));
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
            onClick={() => playCard(card)}
            disabled={!me.canReactToAction}
          >
            {card.name}
          </button>
        ))}
      </div>
    </div>
  );
};
