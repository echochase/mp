import { useCardSelection } from "../../../hooks/useCardSelection.js";
import { CardFace } from "../cards/CardFace.jsx";

export const ActionCardSelectionModal = ({
  goal,
  goalIndex,
  hand,
  requiredCount,
  description,
  confirmLabel,
  confirmVariant = "gold-button",
  onClose,
  onConfirm,
}) => {
  const actionCards = hand.filter((card) => card.type === "action");
  const [selectedIds, toggle] = useCardSelection(
    () => actionCards.slice(0, requiredCount).map((card) => card.id),
    requiredCount
  );

  const hasEnough = actionCards.length >= requiredCount;
  const canConfirm = hasEnough && selectedIds.length === requiredCount;

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

        <p className="modal-description">{description}</p>

        {!hasEnough && (
          <p className="danger-note">
            You need at least {requiredCount} action cards in hand to complete {goal.name}.
          </p>
        )}

        <div className="action-ready-count-row">
          <span>{selectedIds.length} / {requiredCount} selected</span>
          <span>{actionCards.length} action cards available</span>
        </div>

        <div className="selectable-card-grid action-ready-grid">
          {actionCards.map((card) => (
            <button
              key={card.id}
              type="button"
              className={`selectable-card action-ready-selectable ${selectedIds.includes(card.id) ? "selected" : ""}`}
              onClick={() => toggle(card.id)}
              disabled={!selectedIds.includes(card.id) && selectedIds.length >= requiredCount}
            >
              <CardFace card={card} compact hoverMode="none" />
              <span>{card.name}</span>
            </button>
          ))}
        </div>

        <button
          className={`${confirmVariant} modal-confirm-button`}
          disabled={!canConfirm}
          onClick={() => onConfirm({ goalIndex, actionCardIds: selectedIds })}
        >
          {confirmLabel}
        </button>
        <button type="button" className="ghost-button modal-secondary-close" onClick={onClose}>
          Close
        </button>
      </section>
    </div>
  );
};
