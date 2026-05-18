import { imageMap } from "../../../utils/images.js";

export const MobileDeckSummary = ({ deckCounts = {} }) => {
  const backSrc = imageMap["card-back"];

  return (
    <section className="game-panel compact-panel mobile-table-deck-panel" aria-label="Deck counts">
      <p className="eyebrow">Deck</p>
      <div className="mobile-deck-card">
        {backSrc ? <img src={backSrc} alt="Deck" /> : <span>Deck</span>}
        <strong>{deckCounts.playing ?? 0}</strong>
      </div>
      <span>{deckCounts.goals ?? 0} goals</span>
    </section>
  );
};
