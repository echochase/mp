import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameSocket } from "../hooks/useGameSocket.js";
import { useGameEffects } from "../hooks/useGameEffects.js";
import { useCardPermissions } from "../hooks/useCardPermissions.js";
import { CANCEL_REACTION_KEYS, TARGETED_ACTION_KEYS, sortCards } from "../utils/cards.js";

const GameContext = createContext(null);

export const GameProvider = ({ socket, name, room, setRoom, roomCode, children }) => {
  const navigate = useNavigate();
  const { gameState, error } = useGameSocket(socket, name, roomCode, room, setRoom);
  const { newCardIds, turnPulse, noticeToast, resolvedMobileAction, now } = useGameEffects(gameState);
  const [activeModal, setActiveModal] = useState(null);
  const [dismissedRevealIds, setDismissedRevealIds] = useState(new Set());

  const me = gameState?.me;

  const opponents = useMemo(
    () => gameState?.players?.filter((player) => player.name !== name) || [],
    [gameState, name]
  );

  const defaultTargetName = opponents[0]?.name || "";

  const sortedHand = useMemo(
    () =>
      (me?.hand || [])
        .map((card, originalIndex) => ({ ...card, originalIndex }))
        .sort(sortCards),
    [me?.hand]
  );

  const { canStoreResourceCard, canPlayActionCard, tableLocked } = useCardPermissions(gameState, me);

  const activeReveal = me?.privateReveal && !dismissedRevealIds.has(me.privateReveal.id)
    ? me.privateReveal
    : null;
  const magicHandChoice = me?.pendingChoice?.type === "magicHandDiscard" ? me.pendingChoice : null;

  const closeModal = () => setActiveModal(null);
  const openModal = (type, data = {}) => setActiveModal({ type, ...data });
  const dismissReveal = () => {
    if (activeReveal) setDismissedRevealIds((ids) => new Set([...ids, activeReveal.id]));
  };

  useEffect(() => {
    if (!gameState?.activeTrade)
      setActiveModal((m) => (m?.type === "tradeResponse" ? null : m));
  }, [gameState?.activeTrade]);

  // ── Socket actions ────────────────────────────────────────────────────────

  const playCard = (card, extraPayload = {}) =>
    socket.emit("play-card", roomCode, { cardIndex: card.originalIndex, ...extraPayload });

  const beginPlayCard = (card) => {
    const needsModal = TARGETED_ACTION_KEYS.includes(card.key) || card.needsTarget;
    if (needsModal && card.type === "action" && !CANCEL_REACTION_KEYS.includes(card.key)) {
      openModal("actionTarget", { card });
      return;
    }
    playCard(card, {});
  };

  const discardCard = (card) =>
    socket.emit("discard-card", roomCode, { cardIndex: card.originalIndex });

  const rerollGoal = (goalIndex) => socket.emit("reroll-goal", roomCode, { goalIndex });
  const endTurn = () => socket.emit("end-turn", roomCode);
  const acceptTrade = () => socket.emit("accept-trade", roomCode);
  const declineTrade = () => socket.emit("decline-trade", roomCode);
  const playScam = () => socket.emit("play-scam", roomCode);
  const chooseDiscardCard = (cardId) => socket.emit("choose-discard-card", roomCode, { cardId });

  const completeInvestor = ({ goalIndex, targetName: investorTargetName, moneyCardIds }) => {
    socket.emit("complete-investor", roomCode, { goalIndex, targetName: investorTargetName, moneyCardIds });
    closeModal();
  };

  const completeActionReady = ({ goalIndex, actionCardIds }) => {
    socket.emit("complete-action-ready", roomCode, { goalIndex, actionCardIds });
    closeModal();
  };

  const completeMeditator = ({ goalIndex, actionCardIds }) => {
    socket.emit("complete-meditator", roomCode, { goalIndex, actionCardIds });
    closeModal();
  };

  const createTrade = (payload) => {
    socket.emit("create-trade", roomCode, payload);
    closeModal();
  };

  const respondTrade = (payload) => {
    socket.emit("respond-trade", roomCode, payload);
    closeModal();
  };

  const storeResourceCard = (card) => { if (canStoreResourceCard(card)) playCard(card); };

  const handleResourceDrop = (cardId) => {
    const card = sortedHand.find((c) => String(c.id) === String(cardId));
    storeResourceCard(card);
  };

  const handleActionDrop = (cardId) => {
    const card = sortedHand.find((c) => String(c.id) === String(cardId));
    if (canPlayActionCard(card)) beginPlayCard(card);
  };

  const leaveTable = () => {
    socket.emit("leave-room", roomCode, name);
    navigate("/");
  };

  const value = {
    // Game state
    gameState, error, me, name, roomCode, opponents, defaultTargetName,
    // Derived
    sortedHand, tableLocked, canStoreResourceCard, canPlayActionCard,
    magicHandChoice,
    // Effects
    newCardIds, turnPulse, noticeToast, resolvedMobileAction, now,
    // Modal state
    activeModal, openModal, closeModal, activeReveal, dismissReveal,
    // Actions
    playCard, beginPlayCard, discardCard, rerollGoal, endTurn,
    acceptTrade, declineTrade, playScam, chooseDiscardCard,
    completeInvestor, completeActionReady, completeMeditator,
    createTrade, respondTrade,
    handleResourceDrop, handleActionDrop, leaveTable,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => useContext(GameContext);
