import { useEffect, useMemo, useState } from "react";
import { useGame } from "../../../contexts/GameContext.jsx";
import { canSabotageDiscard } from "../../../utils/cards.js";
import { CardFace } from "../cards/CardFace.jsx";

export const ActionTargetModal = () => {
  const { activeModal, gameState, me, opponents, defaultTargetName, closeModal, playCard } = useGame();
  
  const card = activeModal?.card;
  const requiresSingleTarget = card.key !== "absoluteCalamity";
  const [selectedTarget, setSelectedTarget] = useState(
    opponents.some((p) => p.name === defaultTargetName) ? defaultTargetName : opponents[0]?.name || ""
  );

  const [selectedStorageCardId, setSelectedStorageCardId] = useState("");
  const [sabotageStorageCardIds, setSabotageStorageCardIds] = useState([]);
  const [selectedHandIndex, setSelectedHandIndex] = useState(0);
  const [targetGoalIndex, setTargetGoalIndex] = useState(0);
  const [myGoalIndex, setMyGoalIndex] = useState(0);

  const calamityTargets = useMemo(
    () =>
      card.key === "absoluteCalamity"
        ? (gameState.players || [])
            .map((player) => ({
              ...player,
              storage: (player.storage || []).filter((storedCard) => storedCard.type === "resource"),
            }))
            .filter((player) => player.storage.length > 0)
        : [],
    [card.key, gameState.players]
  );
  const [calamitySelections, setCalamitySelections] = useState(() =>
    Object.fromEntries(calamityTargets.map((player) => [player.name, player.storage[0]?.id || ""]))
  );

  const targetPlayer = gameState.players.find((player) => player.name === selectedTarget);
  const sabotageCards = (targetPlayer?.storage || []).filter(canSabotageDiscard);

  useEffect(() => {
    setSelectedStorageCardId(targetPlayer?.storage?.[0]?.id || "");
    setSabotageStorageCardIds([]);
    setSelectedHandIndex(0);
    setTargetGoalIndex(0);
  }, [selectedTarget, targetPlayer?.storage]);

  useEffect(() => {
    if (card.key !== "absoluteCalamity") return;
    setCalamitySelections((current) => {
      const next = {};
      calamityTargets.forEach((player) => {
        next[player.name] = player.storage.some((storedCard) => storedCard.id === current[player.name])
          ? current[player.name]
          : player.storage[0]?.id || "";
      });
      return next;
    });
  }, [card.key, calamityTargets]);

  const toggleSabotageCard = (cardId) => {
    setSabotageStorageCardIds((ids) => {
      if (ids.includes(cardId)) return ids.filter((id) => id !== cardId);
      if (ids.length >= 2) return ids;
      return [...ids, cardId];
    });
  };

  const confirm = () => {
    const payload = requiresSingleTarget ? { targetName: selectedTarget } : {};
    if (card.key === "theft") payload.storageCardId = selectedStorageCardId;
    if (card.key === "sabotage") payload.sabotageCardIds = sabotageStorageCardIds;
    if (card.key === "robbery") payload.handIndex = selectedHandIndex;
    if (card.key === "absoluteCalamity") {
      payload.calamityDiscards = calamityTargets.map((player) => ({
        playerName: player.name,
        cardId: calamitySelections[player.name],
      }));
    }
    if (card.key === "goalRemoval") payload.goalIndex = targetGoalIndex;
    if (card.key === "goalSwap") {
      payload.goalIndex = targetGoalIndex;
      payload.myGoalIndex = myGoalIndex;
    }
    playCard(card, payload);
    closeModal();
  };

  const canConfirm = Boolean(
    (requiresSingleTarget ? selectedTarget : true) &&
      (card.key !== "theft" || selectedStorageCardId) &&
      (card.key !== "sabotage" || (sabotageStorageCardIds.length > 0 && sabotageStorageCardIds.length <= 2)) &&
      (card.key !== "robbery" || (targetPlayer?.handCount || 0) > 0) &&
      (card.key !== "absoluteCalamity" ||
        (calamityTargets.length > 0 && calamityTargets.every((player) => calamitySelections[player.name])))
  );

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <section className="action-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Configure action</p>
            <h2>{card.name}</h2>
          </div>
          <button className="ghost-button close-modal-button desktop-modal-close-button" onClick={closeModal}>✕</button>
        </div>
        <p className="modal-description">{card.description}</p>

        {requiresSingleTarget && (
          <>
            <label className="modal-label" htmlFor="action-target">Target player</label>
            <select
              id="action-target"
              className="modal-select"
              value={selectedTarget}
              onChange={(event) => setSelectedTarget(event.target.value)}
            >
              {opponents.map((player) => (
                <option key={player.name} value={player.name}>{player.name}</option>
              ))}
            </select>
          </>
        )}

        {card.key === "theft" && (
          <div className="modal-picker-section">
            <h3>Choose a stored resource to steal</h3>
            <div className="selectable-card-grid">
              {(targetPlayer?.storage || []).map((storedCard) => (
                <button
                  key={storedCard.id}
                  type="button"
                  className={`selectable-card ${selectedStorageCardId === storedCard.id ? "selected" : ""}`}
                  onClick={() => setSelectedStorageCardId(storedCard.id)}
                >
                  <CardFace card={storedCard} compact />
                </button>
              ))}
              {(targetPlayer?.storage || []).length === 0 && (
                <p className="empty-storage">No storage cards to steal.</p>
              )}
            </div>
          </div>
        )}

        {card.key === "sabotage" && (
          <div className="modal-picker-section sabotage-picker-section">
            <h3>Choose 1 or 2 stored cards to discard</h3>
            <p className="modal-description">Pick them in discard order. Gold and Diamond are protected.</p>
            <div className="selectable-card-grid">
              {sabotageCards.map((storedCard) => {
                const selectedOrder = sabotageStorageCardIds.indexOf(storedCard.id);
                return (
                  <button
                    key={storedCard.id}
                    type="button"
                    className={`selectable-card ${selectedOrder >= 0 ? "selected" : ""}`}
                    onClick={() => toggleSabotageCard(storedCard.id)}
                  >
                    <CardFace card={storedCard} compact hoverMode="title" />
                    <span>{selectedOrder >= 0 ? `Discard ${selectedOrder + 1}` : storedCard.name}</span>
                  </button>
                );
              })}
              {sabotageCards.length === 0 && (
                <p className="empty-storage">No discardable storage cards. Gold and Diamond cannot be discarded.</p>
              )}
            </div>
          </div>
        )}

        {card.key === "absoluteCalamity" && (
          <div className="modal-picker-section calamity-picker-section">
            <h3>Choose one stored resource to discard from each player</h3>
            {calamityTargets.length === 0 ? (
              <p className="empty-storage">No one has resources in storage.</p>
            ) : (
              calamityTargets.map((player) => (
                <div className="calamity-player-picker" key={player.name}>
                  <h4>{player.name}</h4>
                  <div className="selectable-card-grid">
                    {player.storage.map((storedCard) => (
                      <button
                        key={storedCard.id}
                        type="button"
                        className={`selectable-card ${calamitySelections[player.name] === storedCard.id ? "selected" : ""}`}
                        onClick={() =>
                          setCalamitySelections((current) => ({ ...current, [player.name]: storedCard.id }))
                        }
                      >
                        <CardFace card={storedCard} compact hoverMode="title" />
                        <span>{storedCard.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {card.key === "robbery" && (
          <div className="modal-picker-section">
            <h3>Choose a hidden hand slot</h3>
            <div className="hidden-hand-grid">
              {Array.from({ length: targetPlayer?.handCount || 0 }).map((_, index) => (
                <button
                  key={index}
                  className={`hidden-hand-slot ${selectedHandIndex === index ? "selected" : ""}`}
                  onClick={() => setSelectedHandIndex(index)}
                  type="button"
                >
                  Card {index + 1}
                </button>
              ))}
              {(targetPlayer?.handCount || 0) === 0 && (
                <p className="empty-storage">No hand cards to rob.</p>
              )}
            </div>
          </div>
        )}

        {(card.key === "goalRemoval" || card.key === "goalSwap") && (
          <div className="modal-picker-section goal-index-picker">
            {card.key === "goalSwap" && (
              <div>
                <h3>Your goal</h3>
                <div className="hidden-hand-grid">
                  {me.goals.map((goal, index) => (
                    <button
                      type="button"
                      key={goal.id}
                      className={`hidden-hand-slot ${myGoalIndex === index ? "selected" : ""}`}
                      onClick={() => setMyGoalIndex(index)}
                    >
                      {goal.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <h3>{targetPlayer?.name || "Target"}'s goal slot</h3>
              <div className="hidden-hand-grid">
                {Array.from({ length: targetPlayer?.goalCount || 0 }).map((_, index) => (
                  <button
                    type="button"
                    key={index}
                    className={`hidden-hand-slot ${targetGoalIndex === index ? "selected" : ""}`}
                    onClick={() => setTargetGoalIndex(index)}
                  >
                    Goal {index + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <button className="gold-button modal-confirm-button" disabled={!canConfirm} onClick={confirm}>
          Play {card.name}
        </button>
        <button type="button" className="ghost-button modal-secondary-close" onClick={closeModal}>
          Close
        </button>
      </section>
    </div>
  );
};
