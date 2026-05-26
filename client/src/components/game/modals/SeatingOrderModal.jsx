import { useGame } from "../../../contexts/GameContext.jsx";
import { SeatingOrder } from "../table/SeatingOrder.jsx";

export const SeatingOrderModal = () => {
  const { closeModal } = useGame();

  return (
    <div className="modal-backdrop" onMouseDown={closeModal} role="presentation">
      <section className="trade-modal seating-order-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Players</p>
            <h2>Seating Order</h2>
          </div>
        </div>
        <p className="modal-description seating-order-description">Turn order moves clockwise around the table.</p>
        <div className="seating-order-modal-stage">
          <SeatingOrder showScore />
        </div>
        <button type="button" className="modal-confirm-button" onClick={closeModal}>
          Close
        </button>
      </section>
    </div>
  );
};
