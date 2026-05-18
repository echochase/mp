const playingCardModules = import.meta.glob("/src/assets/cards/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});

const goalCardModules = import.meta.glob("/src/assets/goal-cards/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});

const buildImageMap = (modules) =>
  Object.entries(modules).reduce((acc, [path, src]) => {
    const key = path.split("/").pop().replace(/\.[^/.]+$/, "");
    acc[key] = src;
    return acc;
  }, {});

const normalizeKey = (value = "") =>
  String(value).replace(/\.[^/.]+$/, "").replace(/[^a-z0-9]/gi, "").toLowerCase();

const buildNormalizedMap = (map) =>
  Object.entries(map).reduce((acc, [key, src]) => {
    acc[normalizeKey(key)] = src;
    return acc;
  }, {});

export const playingImageMap = buildImageMap(playingCardModules);
export const goalImageMap = buildImageMap(goalCardModules);
const imageMap = { ...goalImageMap, ...playingImageMap };

const normalizedPlayingMap = buildNormalizedMap(playingImageMap);
const normalizedGoalMap = buildNormalizedMap(goalImageMap);
const normalizedImageMap = buildNormalizedMap(imageMap);

export { imageMap };

export const getCardImage = (card) => {
  const directKey = card?.key || card?.imageKey;
  const directName = card?.name || card?.title;
  const isGoal =
    card?.type === "goal" ||
    card?.points !== undefined ||
    card?.requirement ||
    card?.anyRequirement ||
    card?.specialCompletion;
  const primaryMap = isGoal ? goalImageMap : playingImageMap;
  const primaryNorm = isGoal ? normalizedGoalMap : normalizedPlayingMap;

  return (
    primaryMap[directKey] ||
    primaryMap[directName] ||
    primaryNorm[normalizeKey(directKey)] ||
    primaryNorm[normalizeKey(directName)] ||
    imageMap[directKey] ||
    imageMap[directName] ||
    normalizedImageMap[normalizeKey(directKey)] ||
    normalizedImageMap[normalizeKey(directName)] ||
    null
  );
};
