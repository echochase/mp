import { CANCEL_REACTION_KEYS, TRADE_TOOL_KEYS, titleCase } from "../../../utils/cards.js";
import { CardFace } from "./CardFace.jsx";

export const PlayingCard = ({
  card,
  displayIndex,
  isNew,
  disabled,
  isYourTurn,
  actionPlayed,
  mustDiscard,
  pendingAction,
  activeTrade,
  canReactToAction,
  canDragToStorage,
  canDragToPlay,
  onPlay,
  onDiscard,
}) => {
  const isResource = card.type === "resource";
  const isCancelReaction = CANCEL_REACTION_KEYS.includes(card.key);
  const isTradeTool = TRADE_TOOL_KEYS.includes(card.key);
  const tableLocked = Boolean(activeTrade || (pendingAction && !isCancelReaction));
  const canPlayResource = isResource && isYourTurn && !mustDiscard && !tableLocked;
  const canReact = isCancelReaction && canReactToAction && pendingAction;
  const canPlayNormalAction =
    !isResource && !isCancelReaction && !isTradeTool && !mustDiscard && !tableLocked && isYourTurn && !actionPlayed;
  const showPlayButton = canPlayResource || canPlayNormalAction || canReact;
  const isAction = !isResource;
  const showActionHoverPlay = isAction && !disabled && (canPlayNormalAction || canReact);
  const playDisabled = disabled || (!canPlayResource && !canPlayNormalAction && !canReact);

  const clearPointerDropHighlights = () => {
    if (typeof document === "undefined") return;
    document
      .querySelectorAll(".mobile-pointer-drag-over")
      .forEach((element) => element.classList.remove("mobile-pointer-drag-over"));
  };

  const handleDragStart = (event) => {
    if (!canDragToStorage && !canDragToPlay) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    if (canDragToStorage) event.dataTransfer.setData("application/x-mp-resource-card-id", String(card.id));
    if (canDragToPlay) event.dataTransfer.setData("application/x-mp-action-card-id", String(card.id));
    event.dataTransfer.setData("text/plain", String(card.id));
  };

  const handlePointerDown = (event) => {
    if ((!canDragToStorage && !canDragToPlay) || event.pointerType === "mouse") return;
    if (event.target.closest("button")) return;

    const sourceCard = event.currentTarget;
    const sourceFace = sourceCard.querySelector(".card-face-button");
    const startX = event.clientX;
    const startY = event.clientY;
    let dragging = false;
    let dragGhost = null;

    const positionGhost = (clientX, clientY) => {
      if (!dragGhost) return;
      dragGhost.style.transform = `translate3d(${clientX}px, ${clientY}px, 0) translate(-50%, -62%)`;
    };

    const createGhost = (moveEvent) => {
      if (dragGhost || typeof document === "undefined") return;
      dragGhost = document.createElement("div");
      dragGhost.className = "mobile-drag-card-ghost";
      const clonedFace = sourceFace?.cloneNode(true);
      if (clonedFace) {
        clonedFace.classList.add("no-hover-scale");
        dragGhost.appendChild(clonedFace);
      } else {
        dragGhost.textContent = card.name || titleCase(card.key || "Card");
      }
      document.body.appendChild(dragGhost);
      sourceCard.classList.add("mobile-source-dragging");
      positionGhost(moveEvent.clientX, moveEvent.clientY);
    };

    const removeGhost = () => {
      if (dragGhost?.parentNode) dragGhost.parentNode.removeChild(dragGhost);
      sourceCard.classList.remove("mobile-source-dragging");
      dragGhost = null;
    };

    const handlePointerMove = (moveEvent) => {
      const distance = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
      if (!dragging && distance < 8) return;
      dragging = true;
      moveEvent.preventDefault();
      createGhost(moveEvent);
      positionGhost(moveEvent.clientX, moveEvent.clientY);

      const hoveredElement = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
      const storageDrop = hoveredElement?.closest(".tabletop-me-zone");
      const playDrop = hoveredElement?.closest(".mobile-play-space");
      clearPointerDropHighlights();
      if (canDragToStorage && storageDrop) storageDrop.classList.add("mobile-pointer-drag-over");
      if (canDragToPlay && playDrop) playDrop.classList.add("mobile-pointer-drag-over");
    };

    const finishPointerDrag = (upEvent) => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishPointerDrag);
      window.removeEventListener("pointercancel", finishPointerDrag);

      const hoveredElement = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
      const droppedOnStorage = Boolean(hoveredElement?.closest(".tabletop-me-zone"));
      const droppedOnPlaySpace = Boolean(hoveredElement?.closest(".mobile-play-space"));
      clearPointerDropHighlights();
      removeGhost();

      if (!dragging) return;
      if ((canDragToStorage && droppedOnStorage) || (canDragToPlay && droppedOnPlaySpace)) {
        onPlay?.();
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", finishPointerDrag, { once: true });
    window.addEventListener("pointercancel", finishPointerDrag, { once: true });
  };

  return (
    <article
      className={`mp-card compact-mp-card ${isResource ? "resource-card" : "action-card"} ${
        card.specialResource ? "special-resource-card" : ""
      } ${isNew ? "draw-new-card" : ""} ${mustDiscard ? "must-discard-card" : ""} ${canDragToStorage ? "draggable-resource-card" : ""} ${canDragToPlay ? "draggable-action-card" : ""}`}
      draggable={Boolean(canDragToStorage || canDragToPlay)}
      onDragStart={handleDragStart}
      onPointerDown={handlePointerDown}
    >
      <CardFace
        card={card}
        hoverMode={isAction ? (showActionHoverPlay ? "play" : "none") : undefined}
        hoverButtonLabel="Play"
        hoverButtonDisabled={playDisabled}
        onHoverButtonClick={onPlay}
      />
      <div className="card-actions compact-card-actions">
        {mustDiscard ? (
          <button className="danger-button" disabled={disabled || Boolean(activeTrade || pendingAction)} onClick={onDiscard}>
            Discard
          </button>
        ) : isResource && showPlayButton ? (
          <button disabled={playDisabled} onClick={onPlay}>
            Store
          </button>
        ) : isAction && showPlayButton ? (
          <>
            <button className="mobile-card-action-button" disabled={playDisabled} onClick={onPlay}>
              Play
            </button>
            <span className="card-state-chip desktop-card-state-chip">Hover to play</span>
          </>
        ) : (
          <span className="card-state-chip">
            {isCancelReaction ? "Reaction only" : isTradeTool ? "Trade tool" : tableLocked ? "Waiting" : "Unavailable"}
          </span>
        )}
      </div>
      <span className="card-index">#{displayIndex + 1}</span>
    </article>
  );
};
