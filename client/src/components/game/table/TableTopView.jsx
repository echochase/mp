import { useState } from "react";
import { TablePlayerChip } from "./TablePlayerChip.jsx";
import { StorageCards } from "./StorageCards.jsx";
import { TableDiscardPile } from "./TableDiscardPile.jsx";
import { DrawDeck } from "./DrawDeck.jsx";
import { MobilePendingActionPanel } from "../mobile/MobilePendingActionPanel.jsx";
import { MobileResolvedActionPanel } from "../mobile/MobileResolvedActionPanel.jsx";

export const TableTopView = ({
  players,
  me,
  currentPlayerName,
  meName,
  discardPile,
  deckCounts,
  canStoreDraggedResource,
  onStoreResourceDrop,
  onOpenCardDiscard,
  onOpenGoalDiscard,
  canPlayDraggedAction,
  onActionCardDrop,
  pendingAction,
  resolvedMobileAction,
  now,
  reactionHand = [],
  onReact,
  onOpenStorage,
  mobileDashboard,
}) => {
  const [isPlaySpaceDragOver, setIsPlaySpaceDragOver] = useState(false);
  const [isStorageDragOver, setIsStorageDragOver] = useState(false);
  const opponents = players.filter((p) => p.name !== meName);
  const hasOddOpponentSlot = opponents.length > 0 && opponents.length % 2 === 1;
  const colTemplate = `repeat(${Math.max(opponents.length, 1)}, 1fr)`;
  const opponentZonesClassName = [
    "tabletop-zones-row tabletop-opponent-zones",
    opponents.length % 2 === 1 ? "has-odd-opponents" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="tabletop-view">
      <div className="tabletop-surface">
        {/* Opponent storage zones */}
        <div className={opponentZonesClassName} style={{ gridTemplateColumns: colTemplate }}>
          {opponents.map((player) => (
            <div
              key={player.name}
              className={`tabletop-player-zone tabletop-opponent-zone${player.name === currentPlayerName ? " tabletop-zone-current" : ""}`}
            >
              <TablePlayerChip player={player} isCurrent={player.name === currentPlayerName} />
              <button
                className="mobile-storage-expand-button"
                type="button"
                onClick={() => onOpenStorage?.(player)}
              >
                Expand
              </button>
              <StorageCards cards={player.storage} compact />
            </div>
          ))}
          {hasOddOpponentSlot && (
            <div className="tabletop-empty-seat-slot">
              <span>Another player would fit here</span>
            </div>
          )}
        </div>

        {/* Table centre — draw deck + two discard piles */}
        <div className="tabletop-center">
          <TableDiscardPile
            cards={discardPile?.goals || []}
            label="Goal Discard"
            onOpen={onOpenGoalDiscard}
          />
          <DrawDeck count={deckCounts?.playing ?? 0} />
          <TableDiscardPile
            cards={discardPile?.playing || []}
            label="Card Discard"
            onOpen={onOpenCardDiscard}
          />
        </div>

        <div
          className={`mobile-play-space${canPlayDraggedAction ? " action-drop-ready" : ""}${isPlaySpaceDragOver ? " action-drop-over" : ""}`}
          onDragEnter={(event) => {
            if (!canPlayDraggedAction) return;
            event.preventDefault();
            setIsPlaySpaceDragOver(true);
          }}
          onDragOver={(event) => {
            if (!canPlayDraggedAction) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setIsPlaySpaceDragOver(true);
          }}
          onDragLeave={() => setIsPlaySpaceDragOver(false)}
          onDrop={(event) => {
            if (!canPlayDraggedAction) return;
            event.preventDefault();
            setIsPlaySpaceDragOver(false);
            const cardId =
              event.dataTransfer.getData("application/x-mp-action-card-id") ||
              event.dataTransfer.getData("text/plain");
            if (cardId) onActionCardDrop?.(cardId);
          }}
        >
          {pendingAction ? (
            <MobilePendingActionPanel
              pendingAction={pendingAction}
              me={me}
              now={now}
              reactionHand={reactionHand}
              onReact={onReact}
            />
          ) : resolvedMobileAction ? (
            <MobileResolvedActionPanel card={resolvedMobileAction.card} />
          ) : (
            <>
              <strong>Play Space</strong>
              <span>{isPlaySpaceDragOver ? "Release to play this action" : "Drag action cards here"}</span>
            </>
          )}
        </div>

        {mobileDashboard && (
          <div className="mobile-table-dashboard-shell">
            {mobileDashboard}
          </div>
        )}

        {/* My storage zone */}
        <div
          className={`tabletop-player-zone tabletop-me-zone${me?.name === currentPlayerName ? " tabletop-zone-current" : ""}${
            canStoreDraggedResource ? " storage-drop-ready" : ""
          }${isStorageDragOver ? " storage-drop-over" : ""}`}
          onDragEnter={(event) => {
            if (!canStoreDraggedResource) return;
            event.preventDefault();
            setIsStorageDragOver(true);
          }}
          onDragOver={(event) => {
            if (!canStoreDraggedResource) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setIsStorageDragOver(true);
          }}
          onDragLeave={() => setIsStorageDragOver(false)}
          onDrop={(event) => {
            if (!canStoreDraggedResource) return;
            event.preventDefault();
            setIsStorageDragOver(false);
            const cardId =
              event.dataTransfer.getData("application/x-mp-resource-card-id") ||
              event.dataTransfer.getData("text/plain");
            if (cardId) onStoreResourceDrop(cardId);
          }}
        >
          <p className="tabletop-zone-label">Your Storage</p>
          {canStoreDraggedResource && <p className="storage-drop-hint">Drag resources here to store them.</p>}
          <StorageCards cards={me?.storage || []} paginate={false} />
        </div>
      </div>
    </div>
  );
};
