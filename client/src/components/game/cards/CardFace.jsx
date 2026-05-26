import { getCardImage } from "../../../utils/images.js";
import { titleCase, hyphenateLongWords } from "../../../utils/cards.js";
import { useGame } from "../../../contexts/GameContext.jsx";

export const CardFace = ({
  card,
  className = "",
  compact = false,
  hoverMode,
  hoverButtonLabel = "Expand",
  hoverButtonDisabled = false,
  onHoverButtonClick,
  onClickExpand = false,
  noHoverScale = false,
}) => {
  const { openModal } = useGame();

  const image = getCardImage(card);
  const cardTitle = card?.name || titleCase(card?.key || "Card");
  const cardDisplayTitle = hyphenateLongWords(cardTitle);
  const effectiveHoverMode = hoverMode || (card?.type === "resource" ? "title" : "details");

  const handleHoverButtonClick = (event) => {
    event.stopPropagation();
    if (!hoverButtonDisabled) onHoverButtonClick?.();
  };

  const renderHoverLayer = () => {
    if (effectiveHoverMode === "none") return null;
    if (effectiveHoverMode === "play" || effectiveHoverMode === "expand") {
      return (
        <span className={`hover-card-action hover-card-action-${effectiveHoverMode}`}>
          <button
            type="button"
            disabled={hoverButtonDisabled}
            onClick={handleHoverButtonClick}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {hoverButtonLabel}
          </button>
        </span>
      );
    }
  };

  return (
    <div
      className={`card-face-button ${compact ? "compact-face" : ""} ${noHoverScale ? "no-hover-scale" : ""} hover-mode-${effectiveHoverMode} ${className}`}
      aria-label={cardTitle}
      onClick={onClickExpand ? () => openModal("expandedCard", { card }) : undefined}
    >
      {image ? <img src={image} alt={cardTitle} /> : <div className="card-fallback">{cardDisplayTitle}</div>}
      {renderHoverLayer()}
    </div>
  );
};
