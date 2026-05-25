import { useState } from "react";
import { DiscardCardGrid } from "../modals/DiscardCardGrid.jsx";

export const MobileDiscardModal = ({ playingCards = [], goalCards = [], onClose, onExpandGoal }) => {
  const [activePile, setActivePile] = useState("playing");
  const cards = activePile === "playing"
    ? playingCards.map((card) => ({ ...card, pileLabel: "Card discard", isGoalCard: false })).reverse()
    : goalCards.map((card) => ({ ...card, pileLabel: "Goal discard", isGoalCard: true })).reverse();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="discard-modal combined-discard-modal" onClick={(event) => event.stopPropagation()}>
        <p className="eyebrow" style={{ textAlign: "center" }}>Table Memory</p>
        <h2 className="discard-modal-title">Discarded Cards</h2>
        <div className="combined-discard-tabs">
          <button
            type="button"
            className={activePile === "playing" ? "active" : ""}
            onClick={() => setActivePile("playing")}
          >
            Card discard ({playingCards.length})
          </button>
          <button
            type="button"
            className={activePile === "goals" ? "active" : ""}
            onClick={() => setActivePile("goals")}
          >
            Goal discard ({goalCards.length})
          </button>
        </div>
        <DiscardCardGrid cards={cards} showName onExpandGoal={onExpandGoal} />
        <button className="ghost-button discard-modal-close" onClick={onClose}>Close</button>
      </section>
    </div>
  );
};
