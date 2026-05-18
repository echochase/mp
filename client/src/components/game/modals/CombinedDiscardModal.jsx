import { useState } from "react";
import { hyphenateLongWords } from "../../../utils/cards.js";
import { isMobileTableViewport } from "../../../utils/viewport.js";
import { CardFace } from "../cards/CardFace.jsx";

export const CombinedDiscardModal = ({ playingCards = [], goalCards = [], onClose, onExpandGoal }) => {
  const [activePile, setActivePile] = useState("playing");
  const cards = activePile === "playing"
    ? playingCards.map((card) => ({ ...card, pileLabel: "Card discard", isGoalCard: false })).reverse()
    : goalCards.map((card) => ({ ...card, pileLabel: "Goal discard", isGoalCard: true })).reverse();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="discard-modal combined-discard-modal" onClick={(event) => event.stopPropagation()}>
        <p className="eyebrow" style={{ textAlign: "center" }}>Table Memory</p>
        <h2 className="discard-modal-title">Discarded Cards</h2>
        <div className="combined-discard-tabs">
          <button
            type="button"
            className={activePile === "playing" ? "active" : ""}
            onClick={() => setActivePile("playing")}
          >
            Card discard ({playingCards.length})
          </button>
          <button
            type="button"
            className={activePile === "goals" ? "active" : ""}
            onClick={() => setActivePile("goals")}
          >
            Goal discard ({goalCards.length})
          </button>
        </div>
        {cards.length === 0 ? (
          <p className="empty-storage" style={{ textAlign: "center", margin: "24px 0" }}>Nothing here yet.</p>
        ) : (
          <div className="discard-modal-grid">
            {cards.map((card) => (
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
                <span>{hyphenateLongWords(card.name)}</span>
              </article>
            ))}
          </div>
        )}
        <button className="ghost-button discard-modal-close" onClick={onClose}>Close</button>
      </section>
    </div>
  );
};
