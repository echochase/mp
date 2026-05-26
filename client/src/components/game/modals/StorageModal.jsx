import { useGame } from "../../../contexts/GameContext.jsx";
import { StorageCards } from "../table/StorageCards.jsx";

export const StorageModal = () => {
  const { activeModal, closeModal } = useGame();
  const player = activeModal?.player;

  return (
    <div className="modal-backdrop" onMouseDown={closeModal} role="presentation">
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
        <button type="button" className="modal-confirm-button" onClick={closeModal}>
          Close
        </button>
      </section>
    </div>
  );
};
