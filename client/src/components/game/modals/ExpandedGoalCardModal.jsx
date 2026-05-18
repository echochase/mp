import { getCardImage } from "../../../utils/images.js";
import { titleCase, hyphenateLongWords } from "../../../utils/cards.js";

export const ExpandedGoalCardModal = ({ card, onClose }) => {
  const image = getCardImage(card);
  const title = card?.name || titleCase(card?.key || "Goal Card");

  return (
    <div className="modal-backdrop expanded-goal-backdrop" onClick={onClose}>
      <section className="expanded-goal-modal" onClick={(event) => event.stopPropagation()}>
        <button className="ghost-button close-modal-button expanded-goal-close desktop-modal-close-button" onClick={onClose}>✕</button>
        <div className="expanded-goal-image-wrap">
          {image
            ? <img src={image} alt={title} />
            : <div className="card-fallback">{hyphenateLongWords(title)}</div>}
        </div>
        <div className="expanded-goal-details">
          <p className="eyebrow">Goal Card</p>
          <h2>{hyphenateLongWords(title)}</h2>
          <p>{card?.description || "Read the enlarged card to check this goal."}</p>
          <strong>
            {card?.key === "investor"
              ? "Variable points"
              : `${card?.points || 1} point${(card?.points || 1) === 1 ? "" : "s"}`}
          </strong>
        </div>
        <button type="button" className="ghost-button modal-secondary-close" onClick={onClose}>
          Close
        </button>
      </section>
    </div>
  );
};
