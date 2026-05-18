import { useState } from "react";
import { CardFace } from "../cards/CardFace.jsx";

export const ActionReadyModal = ({ goal, goalIndex, hand, onClose, onConfirm }) => {
  const actionCards = hand.filter((card) => card.type === "action");
  const [selectedIds, setSelectedIds] = useState(() => actionCards.slice(0, 7).map((card) => card.id));

  const toggleCard = (id) => {
    setSelectedIds((ids) => {
      if (ids.includes(id)) return ids.filter((selectedId) => selectedId !== id);
      if (ids.length >= 7) return ids;
      return [...ids, id];
    });
  };

  const hasEnoughActions = actionCards.length >= 7;
  const canConfirm = hasEnoughActions && selectedIds.length === 7;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="action-ready-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Special completion</p>
            <h2>{goal.name}</h2>
          </div>
          <button className="ghost-button close-modal-button desktop-modal-close-button" onClick={onClose}>✕</button>
        </div>

        <p className="modal-description">
          Select exactly 7 action cards to reveal to everyone. These cards stay in your hand.
        </p>

        {!hasEnoughActions && (
          <p className="danger-note">You need at least 7 action cards in hand to complete Action-Ready.</p>
        )}

        <div className="action-ready-count-row">
          <span>{selectedIds.length} / 7 selected</span>
          <span>{actionCards.length} action cards available</span>
        </div>

        <div className="selectable-card-grid action-ready-grid">
          {actionCards.map((card) => (
            <button
              key={card.id}
              type="button"
              className={`selectable-card action-ready-selectable ${selectedIds.includes(card.id) ? "selected" : ""}`}
              onClick={() => toggleCard(card.id)}
              disabled={!selectedIds.includes(card.id) && selectedIds.length >= 7}
            >
              <CardFace card={card} compact hoverMode="none" />
              <span>{card.name}</span>
            </button>
          ))}
        </div>

        <button
          className="gold-button modal-confirm-button"
          disabled={!canConfirm}
          onClick={() => onConfirm({ goalIndex, actionCardIds: selectedIds })}
        >
          Reveal 7 Actions
        </button>
        <button type="button" className="ghost-button modal-secondary-close" onClick={onClose}>
          Close
        </button>
      </section>
    </div>
  );
};
