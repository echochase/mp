import { getAvatarStyle, getInitial } from "../../utils/avatar.js";

export const PlayerAvatar = ({ player, size = "normal" }) => (
  <span className={`player-avatar player-avatar-${size}`} style={getAvatarStyle(player)}>
    {getInitial(player)}
  </span>
);
