import { useGame } from "../../../contexts/GameContext.jsx";
import { GoalCard } from "../cards/GoalCard.jsx";
import { MyProgressPanel } from "../panels/MyProgressPanel.jsx";
import { MobileDeckSummary } from "./MobileDeckSummary.jsx";

export const MobileTableDashboard = () => {
  const { me, gameState, openModal } = useGame();

  return (
    <div className="mobile-table-dashboard">
      <div className="mobile-table-info-row">
        <MyProgressPanel />
        <MobileDeckSummary deckCounts={gameState.deckCounts} />
        <section className="game-panel compact-panel compact-goals-panel mobile-table-goals-panel">
          <div className="panel-heading small-heading goals-panel-heading">
            <p className="eyebrow">Private</p>
            <h2>Your Goals</h2>
          </div>
          <div className="goals-grid compact-goals-grid mobile-table-goals-grid">
            {(me.goals || []).map((goal, index) => (
              <GoalCard key={goal.id || `${goal.key}-${index}`} goal={goal} index={index} />
            ))}
          </div>
        </section>
      </div>
      <div className="mobile-table-control-row">
        <button type="button" onClick={() => openModal("seatingOrder")}>View seating order</button>
        <button type="button" onClick={() => openModal("combinedDiscard")}>View discarded</button>
        <button type="button" onClick={() => openModal("tableLog")}>View table log</button>
        <button type="button" onClick={() => openModal("completedGoals")}>View completed goals</button>
      </div>
    </div>
  );
};
