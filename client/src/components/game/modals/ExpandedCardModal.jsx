import { useGame } from "../../../contexts/GameContext.jsx";
import { getCardImage } from "../../../utils/images.js";
import { titleCase, hyphenateLongWords } from "../../../utils/cards.js";

export const ExpandedCardModal = () => {
  const { activeModal, closeModal } = useGame();
  const card = activeModal?.card;
  const image = getCardImage(card);
  const title = card?.name || titleCase(card?.key || "Card");

  return (
    <div className="modal-backdrop expanded-card-backdrop" onClick={closeModal}>
      <section className="expanded-card-modal" onClick={(event) => event.stopPropagation()}>
        <button className="ghost-button close-modal-button expanded-card-close desktop-modal-close-button" onClick={closeModal}>✕</button>
        <div className="expanded-card-image-wrap">
          {image
            ? <img src={image} alt={title} />
            : <div className="card-fallback">{hyphenateLongWords(title)}</div>}
        </div>
        <div className="expanded-card-details">
          <p className="eyebrow">
            {card?.type ? `${card.type} card` : "card"}
          </p>
          <h2>{hyphenateLongWords(title)}</h2>
          <p>{card?.description || "Read the enlarged card for details."}</p>
          {card?.type === "goal" && (
            <strong>
              {card?.key === "investor"
                ? "Variable points"
                : `${card?.points || 1} point${(card?.points || 1) === 1 ? "" : "s"}`}
            </strong>
          )}
        </div>
        <button type="button" className="ghost-button modal-secondary-close" onClick={closeModal}>
          Close
        </button>
      </section>
    </div>
  );
};
