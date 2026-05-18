import { useState } from "react";
import { CardFace } from "../cards/CardFace.jsx";

export const MeditatorModal = ({ goal, goalIndex, hand, onClose, onConfirm }) => {
  const actionCards = hand.filter((card) => card.type === "action");
  const [selectedIds, setSelectedIds] = useState(() => actionCards.slice(0, 4).map((card) => card.id));

  const toggleCard = (id) => {
    setSelectedIds((ids) => {
      if (ids.includes(id)) return ids.filter((selectedId) => selectedId !== id);
      if (ids.length >= 4) return ids;
      return [...ids, id];
    });
  };

  const hasEnoughActions = actionCards.length >= 4;
  const canConfirm = hasEnoughActions && selectedIds.length === 4;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="action-ready-modal meditator-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Special completion</p>
            <h2>{goal.name}</h2>
          </div>
          <button className="ghost-button close-modal-button desktop-modal-close-button" onClick={onClose}>✕</button>
        </div>

        <p className="modal-description">
          Select exactly 4 action cards to discard. These cards go to the discard pile, and Meditator scores 3 points only if all 4 are valid action cards.
        </p>

        {!hasEnoughActions && (
          <p className="danger-note">You need at least 4 action cards in hand to complete Meditator.</p>
        )}

        <div className="action-ready-count-row">
          <span>{selectedIds.length} / 4 selected</span>
          <span>{actionCards.length} action cards available</span>
        </div>

        <div className="selectable-card-grid action-ready-grid">
          {actionCards.map((card) => (
            <button
              key={card.id}
              type="button"
              className={`selectable-card action-ready-selectable ${selectedIds.includes(card.id) ? "selected" : ""}`}
              onClick={() => toggleCard(card.id)}
              disabled={!selectedIds.includes(card.id) && selectedIds.length >= 4}
            >
              <CardFace card={card} compact hoverMode="none" />
              <span>{card.name}</span>
            </button>
          ))}
        </div>

        <button
          className="danger-button modal-confirm-button"
          disabled={!canConfirm}
          onClick={() => onConfirm({ goalIndex, actionCardIds: selectedIds })}
        >
          Discard 4 Actions
        </button>
        <button type="button" className="ghost-button modal-secondary-close" onClick={onClose}>
          Close
        </button>
      </section>
    </div>
  );
};
