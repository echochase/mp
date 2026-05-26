import { useGame } from "../../../contexts/GameContext.jsx";
import { CardFace } from "../cards/CardFace.jsx";

export const ActiveTradePanel = () => {
  const { gameState, name, me, openModal, playScam } = useGame();

  const trade = gameState.activeTrade;
  const isInitiator = trade.initiatorName === name;
  const responses = trade.responses || [];
  const isParticipant = isInitiator || responses.some((r) => r.responderName === name) || trade.responderName === name;
  const isScamWindow = trade.state === "scamWindow";

  return (
    <>
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        <clipPath id="trade-panel-clip" clipPathUnits="objectBoundingBox">
          <path d="M 0.029,0 Q 0,0 0,0.2 L 0,0.8 Q 0,1 0.029,1 L 0.929,1 Q 0.948,1 0.96,0.889 L 0.989,0.611 Q 1,0.5 0.989,0.389 L 0.96,0.111 Q 0.948,0 0.929,0 Z" />
        </clipPath>
      </defs>
    </svg>
    <section className="active-trade-panel compact-panel">
      <div className="trade-panel-row">
        <div className="trade-panel-left">
          <div className="trade-panel-identity">
            <p className="eyebrow">Active Trade</p>
            <p className="trade-panel-participants">{trade.initiatorName} <span>→</span> {trade.targetName || "Everyone"}</p>
          </div>
          {(trade.initiatorOffer?.length > 0) && (
            <div className="trade-panel-offer-strip">
              {trade.initiatorOffer.map((card) => (
                <CardFace key={card.id} card={card} compact hoverMode="none" noHoverScale />
              ))}
            </div>
          )}
        </div>
        <div className="trade-panel-actions">
          {isInitiator && responses.length > 0 && !isScamWindow && (
            <span className="trade-response-count-pill">{responses.length} {responses.length === 1 ? "offer" : "offers"}</span>
          )}
          {isScamWindow && isParticipant && (
            <button className="danger-button" disabled={!me.canPlayScam} onClick={playScam}>
              {me.canPlayScam ? "Play It's a Scam" : trade.scamsPlayed.includes(name) ? "Scam played" : "No scam"}
            </button>
          )}
        </div>
        <button className="trade-panel-chevron" onClick={() => openModal("tradeDetails")} aria-label="View trade details">
          ›
        </button>
      </div>
    </section>
    </>
  );
};
