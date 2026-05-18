import { useState } from "react";
import { TradeOffer } from "../panels/TradeOffer.jsx";
import { SelectableOfferGrid } from "./SelectableOfferGrid.jsx";

export const TradeResponseModal = ({ hand, storage, trade, onClose, onConfirm }) => {
  const [selectedHandIds, setSelectedHandIds] = useState([]);
  const [selectedStorageIds, setSelectedStorageIds] = useState([]);
  const selectedCount = selectedHandIds.length + selectedStorageIds.length;

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
            <p className="eyebrow">Respond to trade</p>
            <h2>{trade.initiatorName}'s offer</h2>
          </div>
          <button className="ghost-button close-modal-button desktop-modal-close-button" onClick={onClose}>✕</button>
        </div>

        {trade.bindingUsed && (
          <p className="binding-contract-alert">
            {trade.initiatorName} used Binding Contract on this trade. If the trade is accepted, no one can use It's a Scam.
          </p>
        )}

        <TradeOffer
          title={`${trade.initiatorName} offers`}
          cards={trade.initiatorOffer}
          handCards={trade.initiatorOfferHand}
          storageCards={trade.initiatorOfferStorage}
        />
        <h3>Select 0 to 4 cards to offer back</h3>
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
          onClick={() => onConfirm({ cardIds: selectedHandIds, storageCardIds: selectedStorageIds })}
        >
          Send Response
        </button>
        <button type="button" className="ghost-button modal-secondary-close" onClick={onClose}>
          Close
        </button>
      </section>
    </div>
  );
};
