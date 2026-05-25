import { GoalCard } from "../cards/GoalCard.jsx";
import { MyProgressPanel } from "../panels/MyProgressPanel.jsx";
import { MobileDeckSummary } from "./MobileDeckSummary.jsx";

export const MobileTableDashboard = ({
  me,
  isCurrent,
  disabled,
  onReroll,
  onInvestor,
  onActionReady,
  onMeditator,
  actionCardsAvailable = 0,
  onExpandGoal,
  deckCounts,
  onOpenSeating,
  onOpenCompleted,
  onOpenLog,
  onOpenDiscarded,
}) => (
  <div className="mobile-table-dashboard">
    <div className="mobile-table-info-row">
      <MyProgressPanel me={me} isCurrent={isCurrent} />
      <MobileDeckSummary deckCounts={deckCounts} />
      <section className="game-panel compact-panel compact-goals-panel mobile-table-goals-panel">
        <div className="panel-heading small-heading goals-panel-heading">
          <p className="eyebrow">Private</p>
          <h2>Your Goals</h2>
        </div>
        <div className="goals-grid compact-goals-grid mobile-table-goals-grid">
          {(me.goals || []).map((goal, index) => (
            <GoalCard
              key={goal.id || `${goal.key}-${index}`}
              goal={goal}
              index={index}
              disabled={disabled}
              isYourTurn={me.isYourTurn}
              goalRerolled={me.goalRerolled}
              onReroll={() => onReroll(index)}
              onInvestor={() => onInvestor(goal, index)}
              onActionReady={() => onActionReady(goal, index)}
              onMeditator={() => onMeditator(goal, index)}
              actionCardsAvailable={actionCardsAvailable}
              onExpand={() => onExpandGoal(goal)}
            />
          ))}
        </div>
      </section>
    </div>
    <div className="mobile-table-control-row">
      <button type="button" onClick={onOpenSeating}>View seating order</button>
      <button type="button" onClick={onOpenDiscarded}>View discarded</button>
      <button type="button" onClick={onOpenLog}>View table log</button>
      <button type="button" onClick={onOpenCompleted}>View completed goals</button>
    </div>
  </div>
);
