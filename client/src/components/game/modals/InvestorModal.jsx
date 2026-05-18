import { useState } from "react";
import { MiniMoneyCard } from "./MiniMoneyCard.jsx";

export const InvestorModal = ({ goal, goalIndex, storage, opponents, defaultTargetName, onClose, onConfirm }) => {
  const moneyCards = storage.filter((card) => card.key === "money");
  const [selectedIds, setSelectedIds] = useState([]);
  const [target, setTarget] = useState(
    opponents.some((p) => p.name === defaultTargetName) ? defaultTargetName : opponents[0]?.name || ""
  );

  const selectedCards = moneyCards.filter((card) => selectedIds.includes(card.id));
  const availableCards = moneyCards.filter((card) => !selectedIds.includes(card.id));
  const previewPoints = selectedIds.length >= 2 ? Math.max(1, selectedIds.length - 1) : 0;

  const addCard = (cardId) => setSelectedIds((ids) => (ids.includes(cardId) ? ids : [...ids, cardId]));
  const removeCard = (cardId) => setSelectedIds((ids) => ids.filter((id) => id !== cardId));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="investor-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Special completion</p>
            <h2>Investor</h2>
          </div>
          <button className="ghost-button close-modal-button desktop-modal-close-button" onClick={onClose}>✕</button>
        </div>

        <p className="modal-description">{goal.description}</p>

        <label className="modal-label" htmlFor="investor-target">Invest in</label>
        <select
          id="investor-target"
          className="modal-select"
          value={target}
          onChange={(event) => setTarget(event.target.value)}
        >
          {opponents.map((player) => (
            <option key={player.name} value={player.name}>{player.name}</option>
          ))}
        </select>

        <div className="investor-columns">
          <div>
            <h3>Money in storage</h3>
            <div className="investor-money-list">
              {availableCards.map((card) => (
                <MiniMoneyCard
                  key={card.id}
                  card={card}
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData("text/plain", card.id)}
                  onClick={() => addCard(card.id)}
                />
              ))}
              {availableCards.length === 0 && <p className="empty-storage">No unselected Money left.</p>}
            </div>
          </div>

          <div
            className="investor-drop-zone"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              addCard(event.dataTransfer.getData("text/plain"));
            }}
          >
            <h3>Dragged investment</h3>
            <div className="investor-money-list selected-money-list">
              {selectedCards.map((card) => (
                <MiniMoneyCard key={card.id} card={card} selected onClick={() => removeCard(card.id)} />
              ))}
              {selectedCards.length === 0 && (
                <p className="empty-storage">Drag at least 2 Money cards here.</p>
              )}
            </div>
            <div className="investor-preview">
              <span>{selectedIds.length} Money selected</span>
              <strong>{previewPoints} point{previewPoints === 1 ? "" : "s"}</strong>
            </div>
          </div>
        </div>

        <button
          className="gold-button investor-confirm-button"
          disabled={selectedIds.length < 2 || !target}
          onClick={() => onConfirm({ goalIndex, targetName: target, moneyCardIds: selectedIds })}
        >
          Confirm Investment
        </button>
        <button type="button" className="ghost-button modal-secondary-close" onClick={onClose}>
          Close
        </button>
      </section>
    </div>
  );
};
