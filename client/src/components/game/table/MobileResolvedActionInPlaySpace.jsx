import { CardFace } from "../cards/CardFace.jsx";

export const MobileResolvedActionInPlaySpace = ({ card }) => (
  <div className="mobile-resolved-action-play-space" aria-hidden="true">
    <div className="mobile-resolved-action-card">
      <CardFace card={card} compact hoverMode="none" noHoverScale />
    </div>
    <span>Resolving to discard</span>
  </div>
);
