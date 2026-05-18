import { CardFace } from "../cards/CardFace.jsx";

export const TableDiscardPile = ({ cards = [], label = "Discard Pile", onOpen }) => {
  const count = cards.length;
  const topCard = cards[cards.length - 1] || null;

  return (
    <button className="table-discard-pile" type="button" onClick={onOpen} title={`View ${label}`}>
      <div className="table-discard-stack">
        <span className="discard-card-layer discard-layer-one" />
        <span className="discard-card-layer discard-layer-two" />
        <span className="discard-card-layer discard-layer-three">
          {topCard
            ? <CardFace card={topCard} compact hoverMode="none" noHoverScale />
            : <span className="empty-discard-face">Empty</span>}
        </span>
        <strong>{count}</strong>
      </div>
      <p className="eyebrow" style={{ marginTop: 8, color: "rgba(201,168,76,0.55)" }}>{label}</p>
    </button>
  );
};
