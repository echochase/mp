import { DiscardCardGrid } from "./DiscardCardGrid.jsx";

export const DiscardPileModal = ({ playingCards = [], goalCards = [], title = "Discard Pile", onClose, onExpandGoal }) => {
  const cards = [
    ...playingCards.map((card) => ({ ...card, pileLabel: "Playing discard", isGoalCard: false })),
    ...goalCards.map((card) => ({ ...card, pileLabel: "Goal discard", isGoalCard: true })),
  ].reverse();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="discard-modal" onClick={(event) => event.stopPropagation()}>
        <p className="eyebrow" style={{ textAlign: "center" }}>Table Memory</p>
        <h2 className="discard-modal-title">{title}</h2>
        <DiscardCardGrid cards={cards} onExpandGoal={onExpandGoal} />
        <button className="ghost-button discard-modal-close" onClick={onClose}>Close</button>
      </section>
    </div>
  );
};
