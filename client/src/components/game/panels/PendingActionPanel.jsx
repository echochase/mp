import { CANCEL_REACTION_KEYS, formatCountdown, getPendingActionContext } from "../../../utils/cards.js";
import { CardFace } from "../cards/CardFace.jsx";

export const PendingActionPanel = ({ pendingAction, me, now, onReact, hand }) => {
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
