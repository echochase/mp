function rollPowerUp() {
  const roll = Math.random();
  if (roll < 0.4) return "special";
  if (roll < 0.7) return "heal";
  if (roll < 0.85) return "cruelty";
  return "prowess";
}

function tryUsePowerUp(player, actionType, targetName = null) {
  if (!player || player.hp <= 0) return { success: false, result: "invalid player" };

  const powerUps = player.powerUps || {};
  if (["prowess", "heal", "special", "cruelty"].includes(actionType)) {
    if ((powerUps[actionType] || 0) > 0) {
      powerUps[actionType] -= 1;
      const result = actionType === "heal" ? "healed" :
                     actionType === "prowess" ? "ready" : `${actionType} used`;
      return { success: true, result, targetName };
    } else {
      return { success: false, result: `no ${actionType}` };
    }
  }

  return { success: true, result: actionType };
}

module.exports = { rollPowerUp, tryUsePowerUp };
