import { useGame } from "../../../contexts/GameContext.jsx";
import { formatCountdown } from "../../../utils/cards.js";
import { TradeOffer } from "../panels/TradeOffer.jsx";
import { PlayerAvatar } from "../PlayerAvatar.jsx";

export const TradeDetailsModal = () => {
  const { gameState, name, me, now, closeModal, acceptTrade, declineTrade, playScam, openModal } = useGame();

  const trade = gameState.activeTrade;
  if (!trade) return null;

  const responses = trade.responses || [];
  const isInitiator = trade.initiatorName === name;
  const myResponse = responses.find((r) => r.responderName === name);
  const isParticipant = isInitiator || Boolean(myResponse) || trade.responderName === name;
  const canRespond = trade.state === "open"
    && !isInitiator
    && (!trade.targetName || trade.targetName === name);
  const canDecline = trade.state !== "scamWindow" && isParticipant;
  const isScamWindow = trade.state === "scamWindow";

  const initiatorPlayer = gameState.players?.find((p) => p.name === trade.initiatorName);

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <section className="trade-details-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
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

        {/* Initiator's offer */}
        <div className="tdm-section">
          <div className="tdm-section-label">
            <PlayerAvatar player={initiatorPlayer || { name: trade.initiatorName }} size="normal" />
            <span>{trade.initiatorName} offers</span>
          </div>
          <TradeOffer
            cards={trade.initiatorOffer}
            handCards={trade.initiatorOfferHand}
            storageCards={trade.initiatorOfferStorage}
          />
        </div>

        {/* Divider */}
        <div className="tdm-exchange-divider">
          <span>⇄</span>
        </div>

        {/* During scam window: show the single accepted pairing */}
        {isScamWindow ? (
          <div className="tdm-section">
            <div className="tdm-section-label">
              <PlayerAvatar
                player={gameState.players?.find((p) => p.name === trade.responderName) || { name: trade.responderName }}
                size="normal"
              />
              <span>{trade.responderName} offers</span>
            </div>
            <TradeOffer
              cards={trade.responderOffer}
              handCards={trade.responderOfferHand}
              storageCards={trade.responderOfferStorage}
            />
          </div>
        ) : (
          /* Pre-accept: all pending responses */
          <div className="tdm-responses-section">
            <p className="tdm-responses-header eyebrow">
              {responses.length === 0
                ? "Responses"
                : responses.length === 1
                  ? "1 response"
                  : `${responses.length} responses`}
            </p>
            {responses.length === 0 ? (
              <div className="tdm-empty-responses">
                <span>Waiting for responses…</span>
              </div>
            ) : (
              <div className="tdm-response-list">
                {responses.map((r) => {
                  const responderPlayer = gameState.players?.find((p) => p.name === r.responderName);
                  const isMyOffer = r.responderName === name;
                  return (
                    <div key={r.responderName} className={`tdm-response-card${isMyOffer ? " tdm-response-card-mine" : ""}${isInitiator ? " tdm-response-card-actionable" : ""}`}>
                      <div className="tdm-response-card-header">
                        <div className="tdm-response-card-identity">
                          <PlayerAvatar player={responderPlayer || { name: r.responderName }} size="normal" />
                          <span className="tdm-response-name">{r.responderName}</span>
                          {isMyOffer && <span className="tdm-my-offer-tag">your offer</span>}
                        </div>
                      </div>
                      <TradeOffer
                        cards={r.offer}
                        handCards={r.offerHand}
                        storageCards={r.offerStorage}
                      />
                      {isInitiator && (
                        <div className="tdm-response-card-footer">
                          <button
                            className="tdm-accept-btn"
                            onClick={() => { acceptTrade(r.responderName); closeModal(); }}
                          >
                            ✓ Accept this offer
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Scam window banner */}
        {isScamWindow && (
          <div className="tdm-scam-banner">
            <div className="tdm-scam-banner-left">
              <span className="tdm-scam-label">Scam window</span>
              <strong>{formatCountdown(trade.scamEndsAt, now)}</strong>
            </div>
            <span className="tdm-scam-played">
              {trade.scamsPlayed.length
                ? `Scammed by: ${trade.scamsPlayed.join(", ")}`
                : "No scams played"}
            </span>
          </div>
        )}

        {/* Action bar */}
        {(canRespond || canDecline || (isScamWindow && isParticipant)) && (
          <div className="tdm-action-bar">
            {canRespond && (
              <button className="tdm-action-btn tdm-action-btn-neutral" onClick={() => { closeModal(); openModal("tradeResponse"); }}>
                <span>↩</span><span>{myResponse ? "Update offer" : "Respond"}</span>
              </button>
            )}
            {canDecline && (
              <button className="tdm-action-btn tdm-action-btn-danger" onClick={() => { declineTrade(); closeModal(); }}>
                <span>✕</span><span>{isInitiator ? "Cancel trade" : "Withdraw offer"}</span>
              </button>
            )}
            {isScamWindow && isParticipant && (
              <button className="tdm-action-btn tdm-action-btn-scam" disabled={!me.canPlayScam} onClick={() => { playScam(); closeModal(); }}>
                <span>⚡</span><span>{me.canPlayScam ? "Play It's a Scam" : trade.scamsPlayed.includes(name) ? "Scam played" : "No scam available"}</span>
              </button>
            )}
          </div>
        )}

        <button type="button" className="ghost-button modal-secondary-close" onClick={closeModal}>Close</button>
      </section>
    </div>
  );
};
