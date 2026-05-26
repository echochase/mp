import { useState } from "react";
import { useGame } from "../../../contexts/GameContext.jsx";
import { TablePlayerChip } from "./TablePlayerChip.jsx";
import { StorageCards } from "./StorageCards.jsx";
import { TableDiscardPile } from "./TableDiscardPile.jsx";
import { DrawDeck } from "./DrawDeck.jsx";
import { ActiveTradePanel } from "../panels/ActiveTradePanel.jsx";
import { MobilePendingActionPanel } from "../mobile/MobilePendingActionPanel.jsx";
import { MobileResolvedActionPanel } from "../mobile/MobileResolvedActionPanel.jsx";
import { MobileTableDashboard } from "../mobile/MobileTableDashboard.jsx";

export const TableTopView = () => {
  const {
    gameState, me, name,
    sortedHand, canStoreResourceCard, canPlayActionCard,
    handleResourceDrop, handleActionDrop, openModal,
    resolvedMobileAction,
  } = useGame();

  const [isPlaySpaceDragOver, setIsPlaySpaceDragOver] = useState(false);
  const [isStorageDragOver, setIsStorageDragOver] = useState(false);

  const { players, currentPlayerName, pendingAction } = gameState;
  const canStoreDraggedResource = sortedHand.some(canStoreResourceCard);
  const canPlayDraggedAction = sortedHand.some(canPlayActionCard);
  const opponents = players.filter((p) => p.name !== name);
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
                onClick={() => openModal("storage", { player })}
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

        {/* Table centre — trade panel or draw deck + discard piles */}
        {gameState.activeTrade ? (
          <div className="trade-panel-centering-wrapper">
            <ActiveTradePanel />
          </div>
        ) : (
          <div className="tabletop-center">
            <TableDiscardPile
              cards={gameState.discardPile?.goals}
              label="Goal Discard"
              onOpen={() => openModal("goalDiscard")}
            />
            <DrawDeck />
            <TableDiscardPile
              cards={gameState.discardPile?.playing}
              label="Card Discard"
              onOpen={() => openModal("discardPile")}
            />
          </div>
        )}

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
            if (cardId) handleActionDrop(cardId);
          }}
        >
          {pendingAction ? (
            <MobilePendingActionPanel />
          ) : resolvedMobileAction ? (
            <MobileResolvedActionPanel />
          ) : (
            <>
              <strong>Play Space</strong>
              <span>{isPlaySpaceDragOver ? "Release to play this action" : "Drag action cards here"}</span>
            </>
          )}
        </div>

        <div className="mobile-table-dashboard-shell">
          <MobileTableDashboard />
        </div>

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
            if (cardId) handleResourceDrop(cardId);
          }}
        >
          <p className="tabletop-zone-label">Your Storage</p>
          {canStoreDraggedResource && <p className="storage-drop-hint">Drag resources here to store them.</p>}
          <StorageCards cards={me?.storage} paginate={false} />
        </div>
      </div>
    </div>
  );
};
