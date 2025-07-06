import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, useMediaQuery } from "@mui/material";
import ListIcon from "@mui/icons-material/List";
import { Players } from "../components/Players";
import {
  ActionButtons,
  ChooseDeclarations,
  ChooseExecutions,
  LogModal,
  TargetMenu,
  WinningModal,
} from "../components/GameComponents";
import "../styles/game.css";
import "../styles/common.css";

export const Game = ({ socket, name, room }) => {
  const [turnCount, setTurnCount] = useState(0);
  const [players, setPlayers] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [turnLogs, setTurnLogs] = useState([]);
  const [winner, setWinner] = useState("");
  const [end, setEnd] = useState(false);
  const [pendingAttackType, setPendingAttackType] = useState(null);
  const [declaredActions, setDeclaredActions] = useState([]);
  const [confirmed, setConfirmed] = useState(false);
  const [actionsError, setActionsError] = useState(false);
  const [stage, setStage] = useState("declaration");
  const [totalDeclarations, setTotalDeclarations] = useState([]);
  const [selectedExecutions, setSelectedExecutions] = useState([]);
  const [playerAnimationQueues, setPlayerAnimationQueues] = useState({});
  const [activeAnimations, setActiveAnimations] = useState({});
  const [openLog, setOpenLog] = useState(false);
  const [defenceWarning, setDefenceWarning] = useState(false);
  const [defenceError, setDefenceError] = useState(false);
  const [bluffWarning, setBluffWarning] = useState(false);
  const [fewActionsWarning, setFewActionsWarning] = useState(false);

  const isMobile = useMediaQuery('(max-width:600px)');
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const you = players.find((p) => p.name === name);
  const isEliminated = you?.hp === 0;

  const powerUps = ["special", "cruelty", "prowess", "heal"];

  const queueAnimation = (playerName, animationType) => {
    setPlayerAnimationQueues((prev) => {
      const existing = prev[playerName] || [];
      return {
        ...prev,
        [playerName]: [...existing, animationType],
      };
    });
  };

  useEffect(() => {
    Object.entries(playerAnimationQueues).forEach(([player, queue]) => {
      if (queue.length === 0 || activeAnimations[player]) return;

      const [nextAnimation, ...rest] = queue;

      setActiveAnimations((prev) => ({
        ...prev,
        [player]: nextAnimation,
      }));

      setPlayerAnimationQueues((prev) => ({
        ...prev,
        [player]: rest,
      }));

      setTimeout(() => {
        setActiveAnimations((prev) => {
          const updated = { ...prev };
          delete updated[player];
          return updated;
        });
      }, 1000);
    });
  }, [playerAnimationQueues, activeAnimations]);

  useEffect(() => {
    if (!socket || !room || !name) {
      navigate("/");
      return;
    }

    const handleStageChange = (newStage) => {
      setConfirmed(false);
      setStage(newStage);
      setSelectedExecutions([]);
    };

    const handleNextTurn = ({ turnCount }) => {
      setTurnCount(turnCount);
      setDeclaredActions([]);
      setSelectedExecutions([]);
      setConfirmed(false);
    };

    const handleDeclarations = (declarations) => {
      setTotalDeclarations(Object.entries(declarations));
    };

    const handleRejoin = (gameState) => {
      setTurnCount(gameState.turnCount);
    };

    const handlePlayerEliminated = (name) => {
      console.log(`${name} was eliminated`);
    };

    const handleGameOver = ({ type, winner }) => {
      if (type === "win") {
        setTurnLogs((prev) => [...prev, `🏆 ${winner} wins the game!`]);
        setWinner(winner);
        setEnd(true);
      } else if (type === "draw") {
        setTurnLogs((prev) => [...prev, `🤝 It's a draw! No players remain.`]);
        setWinner(null);
      }
    };

    const handlePowerUp = (name, power) => {
      setPlayers((prevPlayers) =>
        prevPlayers.map((p) => {
          if (p.name === name) {
            const updatedPowerUps = {
              ...p.powerUps,
              [power]: (p.powerUps?.[power] || 0) + 1,
            };
            return { ...p, powerUps: updatedPowerUps };
          }
          return p;
        })
      );
    };

    const updatePlayers = (playersList) => {
      setPlayers(playersList.map((p) => ({
        ...p,
        powerUps: p.powerUps ?? {},
      })));
    };

    const handleTurnLog = (message) => {
      setTurnLogs((prevLogs) => [...prevLogs, message]);
    };

    socket.on("power-up-received", handlePowerUp);
    socket.on("next-turn", handleNextTurn);
    socket.on("rejoin-game", handleRejoin);
    socket.on("players-update", updatePlayers);
    socket.on("turn-log", handleTurnLog);
    socket.on("stage-update", handleStageChange);
    socket.on("all-declared", handleDeclarations);
    socket.on("player-eliminated", handlePlayerEliminated);
    socket.on("game-over", handleGameOver);

    socket.on("attack-occurred", (user) => queueAnimation(user, "attack"));
    socket.on("special-occurred", (user) => queueAnimation(user, "special"));
    socket.on("block-occurred", (blocker) => queueAnimation(blocker, "defend"));
    socket.on("shield-occurred", (blocker) => queueAnimation(blocker, "shield"));
    socket.on("prowess-occurred", (user) => queueAnimation(user, "prowess"));
    socket.on("cruelty-occurred", (user) => queueAnimation(user, "cruelty"));
    socket.on("heal-occurred", (user) => queueAnimation(user, "heal"));

    socket.emit("get-current-turn", room, name);
    socket.emit("get-players", room);

    return () => {
      socket.off("power-up-received", handlePowerUp);
      socket.off("next-turn", handleNextTurn);
      socket.off("rejoin-game", handleRejoin);
      socket.off("players-update", updatePlayers);
      socket.off("turn-log", handleTurnLog);
      socket.off("stage-update", handleStageChange);
      socket.off("all-declared", handleDeclarations);
      socket.off("player-eliminated", handlePlayerEliminated);
      socket.off("game-over", handleGameOver);
      socket.off("attack-occurred");
      socket.off("special-occurred");
      socket.off("block-occurred");
      socket.off("shield-occurred");
      socket.off("prowess-occurred");
      socket.off("cruelty-occurred");
      socket.off("heal-occurred");
    };
  }, [socket, room, name, navigate]);

  const getRemainingPowerUps = (player, declared) => {
    const usage = {};
    declared.forEach((a) => {
      if (powerUps.includes(a.actionType)) {
        usage[a.actionType] = (usage[a.actionType] || 0) + 1;
      }
    });
    const remaining = {};
    powerUps.forEach((type) => {
      const owned = player.powerUps?.[type] || 0;
      remaining[type] = owned - (usage[type] || 0);
    });
    return remaining;
  };

  const declareAction = () => {
    if (declaredActions.length > 3) return;
    setActionsError(false);
    socket.emit("declare-action", room, name, declaredActions);
    setConfirmed(true);
    setDefenceWarning(false);
  };

  const closeTargetMenu = (targetName) => {
    setAnchorEl(null);
    if (!targetName) return;

    const player = players.find((p) => p.name === name);
    const remaining = getRemainingPowerUps(player, declaredActions);
    const isBluff = powerUps.includes(pendingAttackType) && remaining[pendingAttackType] <= 0;

    const newAction = {
      index: declaredActions.length,
      actionType: pendingAttackType,
      target: targetName,
      bluff: isBluff,
    };

    const updatedDeclared = [...declaredActions, newAction];
    setDeclaredActions(updatedDeclared);

    const hasBluff = updatedDeclared.some(
      (a) => powerUps.includes(a.actionType) && player.powerUps?.[a.actionType] <= 0
    );
    setBluffWarning(hasBluff);

    if (powerUps.includes(pendingAttackType)) {
      player.powerUps[pendingAttackType] -= 1;
    }

    setPendingAttackType(null);
  };

  const deleteAction = (index) => {
    if (confirmed) return;

    setActionsError(false);

    const updatedDeclared = declaredActions.filter((_, i) => i !== index);
    setDeclaredActions(updatedDeclared);

    const player = players.find((p) => p.name === name);
    const actionType = declaredActions[index].actionType;

    if (powerUps.includes(actionType)) {
      player.powerUps[actionType] += 1;
    }

    const hasDefend = updatedDeclared.some((a) => a.actionType === "defend");
    const hasShield = updatedDeclared.some((a) => a.actionType === "energy-shield");
    setDefenceWarning(hasDefend && hasShield);
    setDefenceError(hasDefend && hasShield);

    const hasBluff = updatedDeclared.some(
      (a) => powerUps.includes(a.actionType) && player.powerUps?.[a.actionType] === 0
    );
    setBluffWarning(hasBluff);
  };

  const selectAction = (event, actionType) => {
    setDefenceWarning(false);
    setActionsError(false);

    if (declaredActions.length === 3) {
      setActionsError(true);
      return;
    }

    const selfTargeted = ["defend", "heal", "energy-shield"];
    const player = players.find((p) => p.name === name);

    if (selfTargeted.includes(actionType)) {
      const remaining = getRemainingPowerUps(player, declaredActions);
      const isBluff = powerUps.includes(actionType) && remaining[actionType] <= 0;

      const newDeclaredActions = [
        ...declaredActions,
        { index: declaredActions.length, actionType, target: name, bluff: isBluff },
      ];

      setDeclaredActions(newDeclaredActions);

      const hasDefend = newDeclaredActions.some((a) => a.actionType === "defend");
      const hasShield = newDeclaredActions.some((a) => a.actionType === "energy-shield");
      setDefenceWarning(hasDefend && hasShield);

      const hasBluff = newDeclaredActions.some(
        (a) => powerUps.includes(a.actionType) && player.powerUps?.[a.actionType] === 0
      );
      setBluffWarning(hasBluff);

      if (powerUps.includes(actionType)) {
        player.powerUps[actionType] -= 1;
      }
    } else {
      setPendingAttackType(actionType);
      setAnchorEl(event.currentTarget);
    }
  };

  const leaveGame = () => {
    socket.emit("leave-room", room, name);
    navigate("/");
  };

  const executeAction = (index) => {
    setDefenceError(false);
    if (confirmed) return;

    const newSelection = selectedExecutions.includes(index)
      ? selectedExecutions.filter((i) => i !== index)
      : selectedExecutions.length < 2
        ? [...selectedExecutions, index]
        : selectedExecutions;

    const selected = newSelection.map((i) => declaredActions[i]);

    const hasDefend = selected.some((a) => a.actionType === "defend");
    const hasShield = selected.some((a) => a.actionType === "energy-shield");

    setDefenceError(hasDefend && hasShield);
    setActionsError(false);
    setSelectedExecutions(newSelection);
  };

  const confirmExecution = () => {
    if (defenceError) return;

    const actionsToExecute = selectedExecutions.map((i) => declaredActions[i]);
    if (actionsToExecute.length < 2) {
      setFewActionsWarning(true);
      return;
    }
    socket.emit("execute-actions", room, name, actionsToExecute);
    setConfirmed(true);
  };

  const confirmAnyway = () => {
    const actionsToExecute = selectedExecutions.map((i) => declaredActions[i]);
    socket.emit("execute-actions", room, name, actionsToExecute);
    setConfirmed(true);
    setFewActionsWarning(false);
  };

  return (
    <div className="center">
      {isMobile ? (
        <ListIcon
          sx={{
            position: "absolute",
            left: "30px",
            top: "30px",
            cursor: "pointer",
            color: "white",
            width: "50px",
            height: "50px",
          }}
          onClick={() => setOpenLog(true)}
        />
      ) : (
        <div className="corner-info">
          <p style={{ fontSize: "12.5px" }}>Game Room: {room}</p>
          <div className="game-info">
            <strong>Turn: {turnCount}</strong>
            <strong>You: {name}</strong>
            <strong>Stage: {stage}</strong>
          </div>
          <div style={{ fontSize: "14px", marginTop: "10px", color: "#ccc" }}>
            {turnLogs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
          {winner !== "" && (
            <div className="center">
              {winner ? <h3>Result: {winner} wins</h3> : <h3>Result: Draw</h3>}
            </div>
          )}
        </div>
      )}

      <div className={`center ${!isMobile ? "gameplay" : ""}`}>
        <Players
          players={players}
          you={name}
          totalDeclarations={totalDeclarations}
          stage={stage}
          blockAnimations={activeAnimations}
        />

        {stage === "declaration" ? (
          <ChooseDeclarations {...{ confirmed, declaredActions, declareAction, deleteAction, name }} />
        ) : (
          <ChooseExecutions {...{ confirmed, declaredActions, selectedExecutions, confirmExecution, executeAction }} />
        )}

        {actionsError && <div style={{ color: "red" }}>Please declare exactly 3 actions!</div>}

        {isEliminated ? (
          <p style={{ color: "red", marginBottom: "10px" }}>You have been eliminated and cannot take actions.</p>
        ) : (
          stage === "declaration" && <ActionButtons {...{ you, selectAction }} />
        )}

        {defenceWarning && (
          <p style={{ color: "yellow", marginBottom: "10px" }}>
            You have declared both Defend and Energy Shield. Are you sure?
            <br />
            You can only execute one of these.
          </p>
        )}

        {bluffWarning && (
          <p className="warning">
            One or more actions you plan to declare are power-ups you do not have.
            <br />
            It will be a bluff. You will not be able to execute this action.
          </p>
        )}

        {defenceError && (
          <p style={{ color: "red", marginBottom: "10px" }}>
            You cannot use Defend and Energy Shield in the same turn!
          </p>
        )}

        <button className="menu-button red" onClick={leaveGame}>
          Leave Game
        </button>

        <TargetMenu {...{ anchorEl, open, closeTargetMenu, players, name }} />
        <WinningModal {...{ end, setEnd, winner }} />
        <LogModal {...{ openLog, setOpenLog, room, name, turnLogs, turnCount, stage, winner }} />

        <Modal open={fewActionsWarning} onClose={() => setFewActionsWarning(false)}>
          <div className="modal center">
            <h3>Execute Fewer Than 2 Actions?</h3>
            <div>
              You’ve selected {selectedExecutions.length} action{selectedExecutions.length === 1 ? "" : "s"}.
            </div>
            <div>Are you sure you want to proceed?</div>
            <div className="horizontal-box" style={{ marginTop: "20px" }}>
              <button className="menu-button" onClick={() => setFewActionsWarning(false)}>
                Cancel
              </button>
              <button className="menu-button" onClick={confirmAnyway}>
                Confirm
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};
