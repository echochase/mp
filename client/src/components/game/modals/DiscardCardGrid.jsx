import { hyphenateLongWords } from "../../../utils/cards.js";
import { isMobileTableViewport } from "../../../utils/viewport.js";
import { CardFace } from "../cards/CardFace.jsx";

export const DiscardCardGrid = ({ cards = [], showName = false, onExpandGoal }) => {
  if (cards.length === 0) {
    return (
      <p className="empty-storage" style={{ textAlign: "center", margin: "24px 0" }}>
        Nothing here yet.
      </p>
    );
  }

  return (
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
          {showName && <span>{hyphenateLongWords(card.name)}</span>}
        </article>
      ))}
    </div>
  );
};
