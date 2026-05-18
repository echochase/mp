import { getCardImage } from "../../../utils/images.js";
import { hyphenateLongWords } from "../../../utils/cards.js";

export const MiniMoneyCard = ({ card, selected = false, onClick, draggable = false, onDragStart }) => (
  <button
    type="button"
    className={`mini-money-card ${selected ? "selected-mini-money-card" : ""}`}
    draggable={draggable}
    onDragStart={onDragStart}
    onClick={onClick}
    title={selected ? "Click to remove." : "Drag or click to invest."}
  >
    {getCardImage(card)
      ? <img src={getCardImage(card)} alt={card.name} />
      : <span>{hyphenateLongWords(card.name)}</span>}
    <span className="hover-card-details hover-card-title-only">
      <strong>{hyphenateLongWords(card.name)}</strong>
    </span>
  </button>
);
