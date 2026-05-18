import { isMobileTableViewport } from "../../../utils/viewport.js";
import { CardFace } from "../cards/CardFace.jsx";

export const DiscardPileModal = ({ playingCards = [], goalCards = [], title = "Discard Pile", onClose, onExpandGoal }) => {
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
