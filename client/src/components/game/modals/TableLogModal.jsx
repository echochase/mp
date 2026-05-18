export const TableLogModal = ({ log = [], onClose }) => (
  <div className="modal-backdrop" onMouseDown={onClose} role="presentation">
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
      <button type="button" className="modal-confirm-button" onClick={onClose}>
        Close
      </button>
    </section>
  </div>
);
