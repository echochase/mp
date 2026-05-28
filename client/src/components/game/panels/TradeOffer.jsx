import { CardFace } from "../cards/CardFace.jsx";

export const TradeOffer = ({ title, cards = [], handCards, storageCards }) => {
  const hasPartition = Boolean(handCards || storageCards || cards.some((card) => card.tradeZone));
  const handOffer = (handCards || cards.filter((card) => card.tradeZone === "hand")).slice(0, 4);
  const storageOffer = (storageCards || cards.filter((card) => card.tradeZone === "storage")).slice(0, 4);

  if (!hasPartition) {
    return (
      <div className="trade-offer-box">
        {title && <strong>{title}</strong>}
        <div className="trade-card-row">
          {cards.length === 0 ? (
            <span className="empty-storage">Nothing</span>
          ) : (
            cards.map((card) => <CardFace key={card.id} card={card} compact />)
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="trade-offer-box partitioned-trade-offer-box">
      {title && <strong>{title}</strong>}
      <div className="trade-offer-zone">
        <span className="trade-offer-zone-label">To hand</span>
        <div className="trade-card-row">
          {handOffer.length === 0 ? (
            <span className="empty-storage">Nothing</span>
          ) : (
            handOffer.map((card) => <CardFace key={card.id} card={card} compact />)
          )}
        </div>
      </div>
      <div className="trade-offer-zone">
        <span className="trade-offer-zone-label">To storage</span>
        <div className="trade-card-row">
          {storageOffer.length === 0 ? (
            <span className="empty-storage">Nothing</span>
          ) : (
            storageOffer.map((card) => <CardFace key={card.id} card={card} compact />)
          )}
        </div>
      </div>
    </div>
  );
};
