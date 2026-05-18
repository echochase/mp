import { StorageCards } from "../table/StorageCards.jsx";

export const StorageModal = ({ player, onClose }) => (
  <div className="modal-backdrop" onMouseDown={onClose} role="presentation">
    <section className="trade-modal storage-modal" onMouseDown={(event) => event.stopPropagation()}>
      <div className="modal-heading">
        <div>
          <p className="eyebrow">Storage</p>
          <h2>{player?.name || "Player"}</h2>
        </div>
      </div>
      <div className="storage-modal-body">
        <StorageCards cards={player?.storage || []} />
      </div>
      <button type="button" className="modal-confirm-button" onClick={onClose}>
        Close
      </button>
    </section>
  </div>
);
