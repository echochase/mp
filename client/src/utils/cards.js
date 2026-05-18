// ── Card type constants ──────────────────────────────────────────────────────

export const STANDARD_RESOURCE_ORDER = ["workforce", "candy", "money", "wood", "land", "steel"];
export const SPECIAL_RESOURCE_ORDER = ["gold", "diamond"];
export const CANCEL_REACTION_KEYS = ["iThinkNot", "absolutelyNot"];
export const TRADE_TOOL_KEYS = ["itsAScam", "bindingContract"];
export const TARGETED_ACTION_KEYS = [
  "theft", "sabotage", "robbery", "goalRemoval", "goalSwap", "oraclesPower", "absoluteCalamity",
];
export const SABOTAGE_PROTECTED_KEYS = ["gold", "diamond"];

// ── String helpers ───────────────────────────────────────────────────────────

export const titleCase = (value = "") =>
  value
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const SOFT_HYPHEN = "­";

export const hyphenateLongWords = (value = "", chunkSize = 7) =>
  String(value)
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part) || part.length <= chunkSize) return part;
      return part.match(new RegExp(`.{1,${chunkSize}}`, "g"))?.join(SOFT_HYPHEN) || part;
    })
    .join("");

// ── Card sorting ─────────────────────────────────────────────────────────────

const getSortRank = (card) => {
  if (card?.type === "resource") {
    return SPECIAL_RESOURCE_ORDER.includes(card.key) ? 1 : 0;
  }
  return 2;
};

const getResourceOrder = (card) => {
  const standardIndex = STANDARD_RESOURCE_ORDER.indexOf(card?.key);
  if (standardIndex >= 0) return standardIndex;
  const specialIndex = SPECIAL_RESOURCE_ORDER.indexOf(card?.key);
  if (specialIndex >= 0) return 100 + specialIndex;
  return 999;
};

export const sortCards = (a, b) => {
  const rankDiff = getSortRank(a) - getSortRank(b);
  if (rankDiff !== 0) return rankDiff;
  if (a?.type === "resource" && b?.type === "resource") {
    const resourceDiff = getResourceOrder(a) - getResourceOrder(b);
    if (resourceDiff !== 0) return resourceDiff;
  }
  return (a?.name || "").localeCompare(b?.name || "");
};

export const canSabotageDiscard = (card) =>
  Boolean(card?.type === "resource" && !SABOTAGE_PROTECTED_KEYS.includes(card.key));

export const groupCardsByKey = (cards = []) => {
  const groups = new Map();
  cards.forEach((card) => {
    if (!groups.has(card.key)) groups.set(card.key, []);
    groups.get(card.key).push(card);
  });
  return Array.from(groups.values())
    .map((group) => ({ card: group[0], cards: group, count: group.length }))
    .sort((a, b) => sortCards(a.card, b.card));
};

// ── UI formatting ────────────────────────────────────────────────────────────

export const formatCountdown = (targetTime, now) => {
  if (!targetTime) return "0.0s";
  return `${Math.max(0, (targetTime - now) / 1000).toFixed(1)}s`;
};

export const getPendingActionContext = (pendingAction) => {
  if (pendingAction?.counterTargetName) {
    return ` while countering ${pendingAction.counterTargetName}${
      pendingAction.counterTargetActorName ? ` from ${pendingAction.counterTargetActorName}` : ""
    }`;
  }
  if (pendingAction?.targetName) return ` against ${pendingAction.targetName}`;
  return "";
};
