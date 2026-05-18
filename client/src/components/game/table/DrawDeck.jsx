import { imageMap } from "../../../utils/images.js";

export const DrawDeck = ({ count = 0 }) => {
  const backSrc = imageMap["card-back"];

  return (
    <div className="table-discard-pile draw-deck" aria-label="Draw deck">
      <div className="table-discard-stack">
        <span className="discard-card-layer discard-layer-one" />
        <span className="discard-card-layer discard-layer-two" />
        <span className="discard-card-layer discard-layer-three draw-deck-face">
          {backSrc ? <img src={backSrc} alt="Card back" /> : <span className="empty-discard-face">Deck</span>}
        </span>
        <strong>{count}</strong>
      </div>
      <p className="eyebrow" style={{ marginTop: 8, color: "rgba(201,168,76,0.55)" }}>Draw Deck</p>
    </div>
  );
};
