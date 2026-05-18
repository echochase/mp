import { useEffect, useRef, useState } from "react";

export const useGameEffects = (gameState) => {
  const previousStateRef = useRef(null);
  const newCardTimerRef = useRef(null);
  const noticeTimerRef = useRef(null);
  const resolvedActionTimerRef = useRef(null);

  const [newCardIds, setNewCardIds] = useState(new Set());
  const [turnPulse, setTurnPulse] = useState(0);
  const [noticeToast, setNoticeToast] = useState(null);
  const [resolvedMobileAction, setResolvedMobileAction] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!gameState?.me) return;

    const previous = previousStateRef.current;
    if (previous?.me) {
      const previousHandIds = new Set(previous.me.hand.map((card) => card.id));
      const addedIds = gameState.me.hand
        .filter((card) => !previousHandIds.has(card.id))
        .map((card) => card.id);

      if (addedIds.length > 0) {
        window.clearTimeout(newCardTimerRef.current);
        setNewCardIds(new Set(addedIds));
        newCardTimerRef.current = window.setTimeout(() => setNewCardIds(new Set()), 1800);
      }

      if (previous.currentPlayerName !== gameState.currentPlayerName) {
        setTurnPulse((v) => v + 1);
      }

      if (previous.pendingAction && !gameState.pendingAction) {
        window.clearTimeout(resolvedActionTimerRef.current);
        setResolvedMobileAction({
          id: `${previous.pendingAction.card?.id || previous.pendingAction.card?.key || "action"}-${Date.now()}`,
          card: previous.pendingAction.card,
        });
        resolvedActionTimerRef.current = window.setTimeout(() => setResolvedMobileAction(null), 900);
      }
    }

    previousStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    if (!gameState?.notice?.id) {
      setNoticeToast(null);
      return;
    }
    setNoticeToast(gameState.notice);
    window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setNoticeToast(null), 3200);
  }, [gameState?.notice?.id, gameState?.notice]);

  useEffect(() => {
    if (!gameState?.pendingAction && gameState?.activeTrade?.state !== "scamWindow") return undefined;
    const interval = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(interval);
  }, [gameState?.pendingAction, gameState?.activeTrade?.state]);

  useEffect(
    () => () => {
      window.clearTimeout(newCardTimerRef.current);
      window.clearTimeout(noticeTimerRef.current);
      window.clearTimeout(resolvedActionTimerRef.current);
    },
    []
  );

  return { newCardIds, turnPulse, noticeToast, resolvedMobileAction, now };
};
