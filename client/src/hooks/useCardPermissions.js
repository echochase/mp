import { useCallback } from "react";
import { CANCEL_REACTION_KEYS, TRADE_TOOL_KEYS } from "../utils/cards.js";

export const useCardPermissions = (gameState, me) => {
  const tableLocked = Boolean(
    gameState?.pendingAction || gameState?.activeTrade || gameState?.pendingChoice || me?.pendingChoice
  );

  const canStoreResourceCard = useCallback(
    (card) =>
      Boolean(
        card?.type === "resource" &&
          me?.isYourTurn &&
          !me?.mustDiscard &&
          !tableLocked &&
          !gameState?.winner &&
          !gameState?.pendingChoice &&
          !me?.pendingChoice
      ),
    [me, tableLocked, gameState?.winner, gameState?.pendingChoice]
  );

  const canPlayActionCard = useCallback(
    (card) => {
      if (!card || card.type !== "action" || gameState?.winner || gameState?.pendingChoice || me?.pendingChoice)
        return false;
      const isCancelReaction = CANCEL_REACTION_KEYS.includes(card.key);
      const isTradeTool = TRADE_TOOL_KEYS.includes(card.key);
      const actionBlockedByTable = Boolean(gameState?.activeTrade || (gameState?.pendingAction && !isCancelReaction));
      const canReact = isCancelReaction && me?.canReactToAction && gameState?.pendingAction;
      const canPlayNormalAction =
        !isCancelReaction &&
        !isTradeTool &&
        !me?.mustDiscard &&
        !actionBlockedByTable &&
        me?.isYourTurn &&
        !me?.actionPlayed;
      return Boolean(canReact || canPlayNormalAction);
    },
    [me, gameState?.winner, gameState?.pendingChoice, gameState?.activeTrade, gameState?.pendingAction]
  );

  return { canStoreResourceCard, canPlayActionCard, tableLocked };
};
