import { useState } from "react";
import { SelectableOfferGrid } from "./SelectableOfferGrid.jsx";

export const TradeBuilderModal = ({ hand, storage, opponents, defaultTargetName, onClose, onConfirm }) => {
  const [selectedHandIds, setSelectedHandIds] = useState([]);
  const [selectedStorageIds, setSelectedStorageIds] = useState([]);
  const [targetMode, setTargetMode] = useState("everyone");
  const [target, setTarget] = useState(
    opponents.some((p) => p.name === defaultTargetName) ? defaultTargetName : opponents[0]?.name || ""
  );
  const [useBinding, setUseBinding] = useState(false);

  const selectedCount = selectedHandIds.length + selectedStorageIds.length;
  const hasBinding = hand.some((card) => card.key === "bindingContract" && !selectedHandIds.includes(card.id));

  const toggleHandCard = (id) => {
    setSelectedHandIds((ids) => {
      if (ids.includes(id)) return ids.filter((selectedId) => selectedId !== id);
      if (selectedCount >= 4) return ids;
      return [...ids, id];
    });
  };

  const toggleStorageCard = (id) => {
    setSelectedStorageIds((ids) => {
      if (ids.includes(id)) return ids.filter((selectedId) => selectedId !== id);
      if (selectedCount >= 4) return ids;
      return [...ids, id];
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="trade-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Open trade</p>
            <h2>Make an offer</h2>
          </div>
          <button className="ghost-button close-modal-button desktop-modal-close-button" onClick={onClose}>✕</button>
        </div>

        <p className="trade-storage-note">
          Hand cards stay hand cards after trading. Storage cards stay storage cards after trading.
        </p>

        <div className="trade-target-row">
          <label>
            <input type="radio" checked={targetMode === "everyone"} onChange={() => setTargetMode("everyone")} />
            Offer to everyone
          </label>
          <label>
            <input type="radio" checked={targetMode === "specific"} onChange={() => setTargetMode("specific")} />
            Specific player
          </label>
          {targetMode === "specific" && (
            <select className="modal-select" value={target} onChange={(event) => setTarget(event.target.value)}>
              {opponents.map((player) => (
                <option key={player.name} value={player.name}>{player.name}</option>
              ))}
            </select>
          )}
        </div>

        <label className="binding-checkbox">
          <input
            type="checkbox"
            checked={useBinding}
            disabled={!hasBinding}
            onChange={(event) => setUseBinding(event.target.checked)}
          />
          Use Binding Contract immediately {hasBinding ? "" : "(none available or selected)"}
        </label>

        <h3>Select 0 to 4 cards to offer</h3>
        <SelectableOfferGrid
          hand={hand}
          storage={storage}
          selectedHandIds={selectedHandIds}
          selectedStorageIds={selectedStorageIds}
          onToggleHand={toggleHandCard}
          onToggleStorage={toggleStorageCard}
        />

        <button
          className="gold-button modal-confirm-button"
          disabled={targetMode === "specific" && !target}
          onClick={() => onConfirm({
            targetName: targetMode === "specific" ? target : "",
            cardIds: selectedHandIds,
            storageCardIds: selectedStorageIds,
            useBinding,
          })}
        >
          Offer Trade
        </button>
        <button type="button" className="ghost-button modal-secondary-close" onClick={onClose}>
          Close
        </button>
      </section>
    </div>
  );
};
