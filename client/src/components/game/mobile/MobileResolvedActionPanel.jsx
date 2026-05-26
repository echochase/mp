import { useGame } from "../../../contexts/GameContext.jsx";
import { CardFace } from "../cards/CardFace.jsx";

export const MobileResolvedActionPanel = () => {
  const { resolvedMobileAction } = useGame();

  return (
    <div className="mobile-resolved-action-play-space" aria-hidden="true">
      <div className="mobile-resolved-action-card">
        <CardFace card={resolvedMobileAction.card} compact hoverMode="none" noHoverScale />
      </div>
      <span>Resolving to discard</span>
    </div>
  );
};
