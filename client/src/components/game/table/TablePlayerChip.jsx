import { PlayerAvatar } from "../PlayerAvatar.jsx";

export const TablePlayerChip = ({ player, isCurrent, isMe = false }) => (
  <div
    className={`table-player-chip${isCurrent ? " table-chip-current" : ""}${isMe ? " table-chip-me" : ""}${!player.connected ? " table-chip-offline" : ""}`}
  >
    <PlayerAvatar player={player} />
    <div className="table-chip-info">
      <strong>{player.name}</strong>
      <span>
        {isMe ? "You · " : ""}
        {player.handCount} hand · {player.storageCount} stored
        {!player.connected ? " · offline" : ""}
      </span>
    </div>
    <b className="table-chip-score">{player.score} / 10</b>
    {isCurrent && <span className="table-chip-turn-dot" aria-label="Current turn" />}
  </div>
);
