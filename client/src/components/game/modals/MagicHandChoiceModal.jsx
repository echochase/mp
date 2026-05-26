import { useState } from "react";
import { useGame } from "../../../contexts/GameContext.jsx";
import { titleCase } from "../../../utils/cards.js";
import { CardFace } from "../cards/CardFace.jsx";

export const MagicHandChoiceModal = () => {
  const { magicHandChoice: choice, chooseDiscardCard } = useGame();

  const [selectedCardId, setSelectedCardId] = useState("");
  const selectedCard = choice.choices?.find((card) => card.id === selectedCardId);

  return (
    <div className="modal-backdrop locked-choice-backdrop">
      <section className="discard-modal magic-hand-choice-modal image-only-choice-modal">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Magic Hand</p>
            <h2>Choose from the discard pile</h2>
          </div>
        </div>
        <p className="modal-description">Pick one available playing card, then confirm to add it to your hand.</p>
        <div className="discard-modal-grid magic-hand-image-grid">
          {(choice.choices || []).map((card) => (
            <button
              type="button"
              className={`discard-modal-card selectable-discard-card magic-hand-image-choice ${selectedCardId === card.id ? "selected" : ""}`}
              key={card.id}
              onClick={() => setSelectedCardId(card.id)}
              aria-label={`Choose ${card.name || titleCase(card.key || "card")}`}
              title={card.name || titleCase(card.key || "card")}
            >
              <CardFace card={card} compact hoverMode="none" noHoverScale />
            </button>
          ))}
        </div>
        <div className="magic-hand-confirm-row">
          <span>{selectedCard ? `${selectedCard.name} selected` : "No card selected"}</span>
          <button className="gold-button" disabled={!selectedCardId} onClick={() => chooseDiscardCard(selectedCardId)}>
            Confirm Pick
          </button>
        </div>
      </section>
    </div>
  );
};
