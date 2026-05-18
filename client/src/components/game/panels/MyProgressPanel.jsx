import { PlayerAvatar } from "../PlayerAvatar.jsx";

export const MyProgressPanel = ({ me, isCurrent }) => {
  const score = me?.score || 0;
  const pct = Math.min(100, (score / 10) * 100);

  return (
    <section className={`game-panel compact-panel my-progress-panel${isCurrent ? " my-progress-current" : ""}`}>
      <div className="panel-heading small-heading">
        <p className="eyebrow">Your Progress</p>
        <div className="progress-name-row">
          <PlayerAvatar player={me} />
          <h2>{me.name}</h2>
        </div>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="progress-stats">
        <span className="progress-score">{score} / 10 pts</span>
        <span>{me.hand?.length || 0} in hand · {me.storage?.length || 0} stored</span>
      </div>
    </section>
  );
};
