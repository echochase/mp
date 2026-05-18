import { CANCEL_REACTION_KEYS, formatCountdown, getPendingActionContext } from "../../../utils/cards.js";
import { CardFace } from "../cards/CardFace.jsx";

export const MobilePendingActionInPlaySpace = ({ pendingAction, me, now, reactionHand = [], onReact }) => {
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
