import { useGame } from "../../../contexts/GameContext.jsx";
import { DiscardCardGrid } from "./DiscardCardGrid.jsx";

export const DesktopDiscardModal = ({ cards, title }) => {
  const { closeModal } = useGame();

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <section className="discard-modal" onClick={(event) => event.stopPropagation()}>
        <p className="eyebrow" style={{ textAlign: "center" }}>Table Memory</p>
        <h2 className="discard-modal-title">{title}</h2>
        <DiscardCardGrid cards={cards} />
        <button className="ghost-button discard-modal-close" onClick={closeModal}>Close</button>
      </section>
    </div>
  );
};
