function rollPowerUp() {
  const roll = Math.random();
  if (roll < 0.45) return "special";
  if (roll < 0.68) return "heal";
  if (roll < 0.85) return "cruelty";
  return "prowess";
}

function tryUsePowerUp(player, actionType, targetName = null) {
  if (!player || player.hp <= 0) return { success: false, result: "invalid player" };

  const powerUps = player.powerUps || {};
  console.log(player.name, powerUps, actionType, powerUps[actionType])
  if (["prowess", "heal", "special", "cruelty"].includes(actionType)) {
    if ((powerUps[actionType]) > 0) {
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

const ACTION_NAME_MAP = {
  "defend": "Defend",
  "attack": "Attack",
  "special": "Special Attack",
  "cruelty": "Cruelty",
  "heal": "Heal",
  "prowess": "Prowess",
  "energy-shield": "Energy Shield",
};

module.exports = { rollPowerUp, tryUsePowerUp, ACTION_NAME_MAP };
