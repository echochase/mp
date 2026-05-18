import { hyphenateLongWords } from "../../../utils/cards.js";
import { isMobileTableViewport } from "../../../utils/viewport.js";
import { CardFace } from "./CardFace.jsx";

export const GoalCard = ({
  goal,
  index,
  disabled,
  isYourTurn,
  goalRerolled,
  onReroll,
  onInvestor,
  onActionReady,
  onMeditator,
  actionCardsAvailable = 0,
  onExpand,
}) => {
  const isInvestor = goal.key === "investor";
  const isActionReady = goal.key === "action-ready";
  const isMeditator = goal.key === "meditator";
  const canOpenInvestor = isInvestor && isYourTurn && (goal.investorMoneyAvailable || 0) >= 2;
  const canOpenActionReady = isActionReady && isYourTurn && actionCardsAvailable >= 7;
  const canOpenMeditator = isMeditator && isYourTurn && actionCardsAvailable >= 4;

  const handleGoalTap = (event) => {
    if (event.target.closest("button")) return;
    if (isMobileTableViewport()) onExpand?.();
  };

  return (
    <article
      className={`goal-card-box compact-goal-card ${isInvestor ? "investor-goal-card" : ""}`}
      onClick={handleGoalTap}
    >
      <CardFace
        card={goal}
        compact
        hoverMode="expand"
        hoverButtonLabel="Expand"
        onHoverButtonClick={onExpand}
        onClick={handleGoalTap}
        noHoverScale
      />
      <div className="goal-meta compact-goal-meta">
        <strong>
          {isInvestor ? "Variable" : `${goal.points || 1} pt${(goal.points || 1) === 1 ? "" : "s"}`}
        </strong>
        <p>{hyphenateLongWords(goal.name)}</p>
      </div>
      <div className="goal-actions compact-goal-actions">
        {isInvestor && (
          <button disabled={disabled || !canOpenInvestor} onClick={onInvestor}>
            Invest
          </button>
        )}
        {isActionReady && (
          <button disabled={disabled || !canOpenActionReady} onClick={onActionReady}>
            Reveal Actions
          </button>
        )}
        {isMeditator && (
          <button disabled={disabled || !canOpenMeditator} onClick={onMeditator}>
            Discard Actions
          </button>
        )}
        <button
          className={`reroll-goal-button ${isYourTurn && !goalRerolled && !disabled ? "active" : ""}`}
          disabled={disabled || !isYourTurn || goalRerolled}
          onClick={onReroll}
        >
          Reroll {index + 1}
        </button>
      </div>
    </article>
  );
};
