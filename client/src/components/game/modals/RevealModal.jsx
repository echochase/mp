import { hyphenateLongWords } from "../../../utils/cards.js";
import { CardFace } from "../cards/CardFace.jsx";

export const RevealModal = ({ reveal, onClose }) => {
  const isActionReady = reveal.type === "actionReadyReveal";
  const title = isActionReady
    ? `${reveal.actorName} completed Action-Ready`
    : `${reveal.targetName}'s Hand`;
  const eyebrow = isActionReady ? "Goal completed" : "Oracle's Power";
  const emptyText = isActionReady
    ? "No action cards were revealed."
    : "That player has no cards in hand.";

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
          <p className="modal-description">
            {reveal.actorName} revealed 7 action cards to complete the task Action-Ready.
          </p>
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
