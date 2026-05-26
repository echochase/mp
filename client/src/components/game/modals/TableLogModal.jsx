import { useGame } from "../../../contexts/GameContext.jsx";

export const TableLogModal = () => {
  const { gameState, closeModal } = useGame();
  const { log = [] } = gameState;

  return (
    <div className="modal-backdrop" onMouseDown={closeModal} role="presentation">
      <section className="trade-modal table-log-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">History</p>
            <h2>Table Log</h2>
          </div>
        </div>
        <div className="log-list table-log-modal-list">
          {log.length === 0 ? (
            <p>No table events yet.</p>
          ) : (
            log.slice().reverse().map((entry, index) => <p key={`${entry}-${index}`}>{entry}</p>)
          )}
        </div>
        <button type="button" className="modal-confirm-button" onClick={closeModal}>
          Close
        </button>
      </section>
    </div>
  );
};
