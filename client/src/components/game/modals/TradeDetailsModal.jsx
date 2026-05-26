import { useGame } from "../../../contexts/GameContext.jsx";
import { formatCountdown } from "../../../utils/cards.js";
import { TradeOffer } from "../panels/TradeOffer.jsx";

export const TradeDetailsModal = () => {
  const { gameState, name, me, now, closeModal, acceptTrade, declineTrade, playScam, openModal } = useGame();

  const trade = gameState.activeTrade;
  if (!trade) return null;

  const isInitiator = trade.initiatorName === name;
  const isParticipant = isInitiator || trade.responderName === name;
  const canRespond = trade.state === "open" && !isInitiator && (!trade.targetName || trade.targetName === name);
  const canAccept = trade.state === "configured" && isInitiator;
  const canDecline = trade.state !== "scamWindow" && isParticipant;
  const isScamWindow = trade.state === "scamWindow";

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <section className="trade-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Trade offer</p>
            <h2>{trade.initiatorName} → {trade.targetName || "Everyone"}</h2>
          </div>
          <button className="ghost-button close-modal-button desktop-modal-close-button" onClick={closeModal}>✕</button>
        </div>

        {trade.bindingUsed && (
          <p className="binding-contract-alert">
            {trade.initiatorName} used Binding Contract. If accepted, no one can use It's a Scam.
          </p>
        )}

        <div className="trade-offers-grid">
          <TradeOffer
            title={`${trade.initiatorName} offers`}
            cards={trade.initiatorOffer}
            handCards={trade.initiatorOfferHand}
            storageCards={trade.initiatorOfferStorage}
          />
          <TradeOffer
            title={trade.responderName ? `${trade.responderName} offers` : "Waiting for response"}
            cards={trade.responderOffer}
            handCards={trade.responderOfferHand}
            storageCards={trade.responderOfferStorage}
          />
        </div>

        {isScamWindow && (
          <div className="scam-window-row">
            <span>Scam window closes in <strong>{formatCountdown(trade.scamEndsAt, now)}</strong></span>
            <span>Scams played: {trade.scamsPlayed.length ? trade.scamsPlayed.join(", ") : "none"}</span>
          </div>
        )}

        <div className="trade-panel-actions" style={{ marginTop: 14 }}>
          {canRespond && <button onClick={() => { closeModal(); openModal("tradeResponse"); }}>Respond</button>}
          {canAccept && <button className="gold-button" onClick={() => { acceptTrade(); closeModal(); }}>Accept</button>}
          {canDecline && <button className="danger-outline-button" onClick={() => { declineTrade(); closeModal(); }}>Cancel trade</button>}
          {isScamWindow && isParticipant && (
            <button className="danger-button" disabled={!me.canPlayScam} onClick={() => { playScam(); closeModal(); }}>
              {me.canPlayScam ? "Play It's a Scam" : trade.scamsPlayed.includes(name) ? "Scam played" : "No scam available"}
            </button>
          )}
        </div>

        <button type="button" className="ghost-button modal-secondary-close" onClick={closeModal}>Close</button>
      </section>
    </div>
  );
};
