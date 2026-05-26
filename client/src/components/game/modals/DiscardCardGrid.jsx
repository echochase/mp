import { CardFace } from "../cards/CardFace.jsx";

export const DiscardCardGrid = ({ cards }) => {
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
        <article className="discard-modal-card" key={card.id}>
          <CardFace
            card={card}
            compact
            hoverMode="none"
            onClickExpand
          />
        </article>
      ))}
    </div>
  );
};
