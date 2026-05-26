import { useGame } from "../../../contexts/GameContext.jsx";
import { PlayerAvatar } from "../PlayerAvatar.jsx";

export const SeatingOrder = ({ showScore = true }) => {
  const { gameState, name: meName } = useGame();
  const { players = [], currentPlayerName } = gameState;

  const radius = 40;
  const points = players.map((player, index) => {
    const angle = -90 + (360 / Math.max(players.length, 1)) * index;
    const radians = (Math.PI / 180) * angle;
    return {
      player,
      x: 50 + radius * Math.cos(radians),
      y: 50 + radius * Math.sin(radians),
    };
  });

  return (
    <div className="seating-widget" aria-label="Seating order">
      <svg className="seat-arrows" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <marker id="seat-arrow-head" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" />
          </marker>
        </defs>
        {points.length > 2 &&
          points.map((point, index) => {
            const next = points[(index + 1) % points.length];
            const dx = next.x - point.x;
            const dy = next.y - point.y;
            const length = Math.hypot(dx, dy) || 1;
            const trim = 11;
            const x1 = point.x + (dx / length) * trim;
            const y1 = point.y + (dy / length) * trim;
            const x2 = next.x - (dx / length) * trim;
            const y2 = next.y - (dy / length) * trim;
            return <line key={point.player.name} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
      </svg>
      {points.map(({ player, x, y }) => (
        <div
          className={`seat-node ${player.name === currentPlayerName ? "seat-node-current" : ""} ${
            player.name === meName ? "seat-node-me" : ""
          } ${!player.connected ? "seat-node-offline" : ""}`}
          key={player.name}
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <PlayerAvatar player={player} />
          <strong>{player.name.slice(0, 10)}</strong>
          {showScore && <span>{player.score || 0}</span>}
        </div>
      ))}
      <div className="seat-center-label">{players.length > 2 ? "Turn flow" : "Seats"}</div>
    </div>
  );
};
