import { useGame } from "../../../contexts/GameContext.jsx";
import { hyphenateLongWords } from "../../../utils/cards.js";
import { CardFace } from "./CardFace.jsx";

export const GoalCard = ({ goal, index }) => {
  const { me, gameState, tableLocked, rerollGoal, openModal } = useGame();

  const { isYourTurn, goalRerolled } = me;
  const disabled = Boolean(gameState.winner) || tableLocked;
  const actionCardsAvailable = (me.hand || []).filter((c) => c.type === "action").length;

  const isInvestor = goal.key === "investor";
  const isActionReady = goal.key === "action-ready";
  const isMeditator = goal.key === "meditator";
  const canOpenInvestor = isInvestor && isYourTurn && (goal.investorMoneyAvailable || 0) >= 2;
  const canOpenActionReady = isActionReady && isYourTurn && actionCardsAvailable >= 7;
  const canOpenMeditator = isMeditator && isYourTurn && actionCardsAvailable >= 4;

  return (
    <article
      className={`goal-card-box compact-goal-card ${isInvestor ? "investor-goal-card" : ""}`}
    >
      <CardFace
        card={goal}
        compact
        hoverMode="none"
        onClickExpand
      />
      <div className="goal-meta compact-goal-meta">
        <strong>
          {isInvestor ? "Variable" : `${goal.points || 1} pt${(goal.points || 1) === 1 ? "" : "s"}`}
        </strong>
        <p>{hyphenateLongWords(goal.name)}</p>
      </div>
      <div className="goal-actions compact-goal-actions">
        {isInvestor && (
          <button disabled={disabled || !canOpenInvestor} onClick={() => openModal("investor", { goal, goalIndex: index })}>
            Invest
          </button>
        )}
        {isActionReady && (
          <button disabled={disabled || !canOpenActionReady} onClick={() => openModal("actionReady", { goal, goalIndex: index })}>
            Reveal Actions
          </button>
        )}
        {isMeditator && (
          <button disabled={disabled || !canOpenMeditator} onClick={() => openModal("meditator", { goal, goalIndex: index })}>
            Discard Actions
          </button>
        )}
        <button
          className={`reroll-goal-button ${isYourTurn && !goalRerolled && !disabled ? "active" : ""}`}
          disabled={disabled || !isYourTurn || goalRerolled}
          onClick={() => rerollGoal(index)}
        >
          Reroll {index + 1}
        </button>
      </div>
    </article>
  );
};
