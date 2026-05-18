export const AVATAR_COLORS = [
  "#7c3aed", "#2563eb", "#0891b2", "#059669", "#65a30d", "#ca8a04",
  "#ea580c", "#dc2626", "#db2777", "#9333ea", "#0f766e", "#b45309",
];

export const getInitial = (player = {}) =>
  (player.avatarInitial || player.name || "?").trim().slice(0, 1).toUpperCase() || "?";

export const fallbackAvatarColor = (name = "Player") => {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

export const getAvatarStyle = (player = {}) => ({
  background: player.avatarColor || fallbackAvatarColor(player.name || "Player"),
});
