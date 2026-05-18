import { titleCase, formatCountdown } from "../../../utils/cards.js";
import { TradeOffer } from "./TradeOffer.jsx";

export const ActiveTradePanel = ({ trade, name, me, now, onRespond, onAccept, onDecline, onScam }) => {
  const isInitiator = trade.initiatorName === name;
  const isResponder = trade.responderName === name;
  const isParticipant = isInitiator || isResponder;
  const canRespond = trade.state === "open" && !isInitiator && (!trade.targetName || trade.targetName === name);
  const canAccept = trade.state === "configured" && isInitiator;
  const canDecline = trade.state !== "scamWindow" && isParticipant;
  const isScamWindow = trade.state === "scamWindow";

  return (
    <section className="game-panel active-trade-panel compact-panel">
      <div className="trade-panel-header">
        <div>
          <p className="eyebrow">Trading</p>
          <h2>{trade.initiatorName} → {trade.targetName || "Everyone"}</h2>
          <p>
            {trade.bindingUsed
              ? "Binding Contract active. No scams allowed."
              : "Unprotected trade. Scams may happen after acceptance."}
          </p>
        </div>
        <span className={`trade-state-pill ${trade.state}`}>{titleCase(trade.state)}</span>
      </div>

      {trade.bindingUsed && (
        <p className="binding-contract-alert">
          {trade.initiatorName} used Binding Contract on this trade. If the trade is accepted, no one can use It's a Scam.
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

      <div className="trade-panel-actions">
        {canRespond && <button onClick={onRespond}>Respond to trade</button>}
        {canAccept && <button className="gold-button" onClick={onAccept}>Accept trade</button>}
        {canDecline && <button className="danger-outline-button" onClick={onDecline}>Cancel trade</button>}
        {isScamWindow && isParticipant && (
          <button className="danger-button" disabled={!me.canPlayScam} onClick={onScam}>
            {me.canPlayScam
              ? "Play It's a Scam"
              : trade.scamsPlayed.includes(name)
                ? "Scam played"
                : "No scam available"}
          </button>
        )}
        {!canRespond && !canAccept && !canDecline && !isScamWindow && (
          <span className="card-state-chip">Waiting...</span>
        )}
      </div>
    </section>
  );
};
