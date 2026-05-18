import { hyphenateLongWords } from "../../../utils/cards.js";
import { CardFace } from "../cards/CardFace.jsx";

export const CompletedGoalsPanel = ({ completedGoals = [], onOpen, onExpandGoal }) => {
  const topGoal = completedGoals[completedGoals.length - 1];

  return (
    <section className="game-panel compact-panel completed-goals-panel">
      <div className="panel-heading small-heading">
        <p className="eyebrow">Achievements</p>
        <h2>Completed Goals</h2>
      </div>
      <div className="completed-goals-body">
        <button className="table-discard-pile completed-goals-pile-wrap" type="button" onClick={onOpen}>
          <div className="table-discard-stack">
            <span className="discard-card-layer discard-layer-one" />
            {completedGoals.length > 1 && <span className="discard-card-layer discard-layer-two" />}
            <span className="discard-card-layer discard-layer-three">
              {topGoal
                ? <CardFace card={topGoal} compact hoverMode="none" noHoverScale />
                : <span className="empty-discard-face">Empty</span>}
            </span>
            <strong>{completedGoals.length}</strong>
          </div>
        </button>
        {completedGoals.length === 0 ? (
          <p className="empty-storage" style={{ fontSize: "0.78rem" }}>No goals completed yet.</p>
        ) : (
          <div className="completed-goals-list">
            {completedGoals.map((goal, idx) => (
              <button
                key={idx}
                type="button"
                className="completed-goal-entry completed-goal-button"
                onClick={() => onExpandGoal(goal)}
              >
                <span className="completed-goal-name">{hyphenateLongWords(goal.name)}</span>
                <span className="completed-goal-pts">+{goal.pointsAwarded ?? goal.points ?? 1} pt</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
