import { useGame } from "../../../contexts/GameContext.jsx";
import { CardFace } from "../cards/CardFace.jsx";

export const SelectableOfferGrid = ({
  selectedHandIds,
  selectedStorageIds,
  onToggleHand,
  onToggleStorage,
}) => {
  const { sortedHand: hand, me } = useGame();
  const { storage = [] } = me;

  return (
    <div className="trade-offer-picker">
      <div>
        <h4>Hand</h4>
        <div className="selectable-card-grid trade-select-grid">
          {hand.map((card) => (
            <button
              key={card.id}
              type="button"
              className={`selectable-card ${selectedHandIds.includes(card.id) ? "selected" : ""}`}
              onClick={() => onToggleHand(card.id)}
            >
              <CardFace card={card} compact hoverMode={card.type === "resource" ? "title" : "none"} />
              <span>{card.name}</span>
            </button>
          ))}
          {hand.length === 0 && <p className="empty-storage">No cards in hand.</p>}
        </div>
      </div>
      <div>
        <h4>Storage</h4>
        <div className="selectable-card-grid trade-select-grid">
          {storage.map((card) => (
            <button
              key={card.id}
              type="button"
              className={`selectable-card ${selectedStorageIds.includes(card.id) ? "selected" : ""}`}
              onClick={() => onToggleStorage(card.id)}
            >
              <CardFace card={card} compact hoverMode="title" />
              <span>{card.name}</span>
            </button>
          ))}
          {storage.length === 0 && <p className="empty-storage">No stored cards.</p>}
        </div>
      </div>
    </div>
  );
};
