import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Players } from "../components/Players";
import "../styles/game.css";
import "../styles/common.css";
import {
  ActionButtons,
  ChooseDeclarations,
  ChooseExecutions,
  TargetMenu,
  WinningModal,
} from "../components/GameComponents";

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

  const queueAnimation = (playerName, animationType) => {
    setPlayerAnimationQueues(prev => {
      const existing = prev[playerName] || [];
      return {
        ...prev,
        [playerName]: [...existing, animationType]
      };
    });
  };  
  
  // Define power-up names
  const powerUps = ["special", "cruelty", "prowess", "heal"];

  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const you = players.find((p) => p.name === name);
  const isEliminated = you?.hp === 0;
  
  useEffect(() => {
    Object.entries(playerAnimationQueues).forEach(([player, queue]) => {
      if (queue.length === 0 || activeAnimations[player]) return;
  
      const [nextAnimation, ...rest] = queue;
  
      setActiveAnimations(prev => ({
        ...prev,
        [player]: nextAnimation
      }));
  
      setPlayerAnimationQueues(prev => ({
        ...prev,
        [player]: rest
      }));
  
      setTimeout(() => {
        setActiveAnimations(prev => {
          const updated = { ...prev };
          delete updated[player];
          return updated;
        });
      }, 1000); // match with your animation duration
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
      console.log(declarations);
      setTotalDeclarations(Object.entries(declarations));
    };

    const handleRejoin = (gameState) => {
      setTurnCount(gameState.turnCount);
    };

    const handlePlayerEliminated = (name) => {
      console.log(`${name} was eliminated`);
    }

    const handleGameOver = ({type, winner}) => {
      if (type === "win") {
        setTurnLogs((prev) => [...prev, `🏆 ${winner} wins the game!`]);
        setWinner(winner);
        setEnd(true);
      } else if (type === "draw") {
        setTurnLogs((prev) => [...prev, `🤝 It's a draw! No players remain.`]);
        setWinner(null);
      }
    }

    const handlePowerUp = (name, power) => {
      setPlayers((prevPlayers) =>
        prevPlayers.map((p) => {
          if (p.name === name) {
            const updatedPowerUps = {
              ...p.powerUps,
              [power]: (p.powerUps?.[power] || 0) + 1,
            };
            console.log(updatedPowerUps);
            return { ...p, powerUps: updatedPowerUps };
          }
          return p;
        })
      );
    };

    const updatePlayers = (playersList) => {
      setPlayers(
        playersList.map((p) => ({
          ...p,
          powerUps: p.powerUps ?? {},
        }))
      );
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
    
    socket.on("block-occurred", blocker => {
      queueAnimation(blocker, "defend");
    });
    
    socket.on("shield-occurred", blocker => {
      queueAnimation(blocker, "shield");
    });
    
    socket.on("prowess-occurred", user => {
      queueAnimation(user, "prowess");
    });
    
    socket.on("heal-occurred", user => {
      queueAnimation(user, "heal");
    });    

    socket.emit("get-current-turn", room, name);
    socket.emit("get-players", room);

    return () => {
      socket.off("next-turn", handleNextTurn);
      socket.off("rejoin-game", handleRejoin);
      socket.off("players-update", updatePlayers);
      socket.off("turn-log", handleTurnLog);
      socket.off("stage-update", handleStageChange);
      socket.off("all-declared", handleDeclarations);
      socket.off("power-up-received", handlePowerUp);
      socket.off("player-eliminated", handlePlayerEliminated);
      socket.off("game-over", handleGameOver);
      socket.off("block-occurred");
      socket.off("shield-occurred");
      socket.off("prowess-occurred");
      socket.off("heal-occurred");
    };
  }, [socket, room, name, navigate]);

  const declareAction = () => {
    if (declaredActions.length > 3) return;
    setActionsError(false);
    socket.emit("declare-action", room, name, declaredActions);
    setConfirmed(true);
  };

  const closeTargetMenu = (targetName) => {
    setAnchorEl(null);
  
    if (!targetName) return; // User clicked outside or dismissed menu
  
    const player = players.find(p => p.name === name);
  
    setDeclaredActions((prev) => [
      ...prev,
      {
        index: prev.length,
        actionType: pendingAttackType,
        target: targetName,
      },
    ]);
  
    if (powerUps.includes(pendingAttackType)) {
      player.powerUps[pendingAttackType] -= 1;
      console.log(player.powerUps);
    }
  
    setPendingAttackType(null);
  };  

  const deleteAction = (index) => {
    if (confirmed) return;
    setActionsError(false);
    setDeclaredActions((prev) => prev.filter((_, i) => i !== index));
    const player = players.find(p => p.name === name);
    const actionType = declaredActions[index].actionType;
    if (powerUps.includes(actionType)) {
      player.powerUps[actionType]++;
      console.log(player.powerUps);
    }
  }

  const selectAction = (event, actionType) => {
    if (declaredActions.length === 3) {
      setActionsError(true);
      return;
    }

    const selfTargeted = ["defend", "heal", "energy-shield"];
    const player = players.find(p => p.name === name);

    if (selfTargeted.includes(actionType)) {
      setDeclaredActions((prev) => [
        ...prev,
        {
          index: prev.length,
          actionType,
          target: name,
        },
      ]);

      if (powerUps.includes(actionType)) {
        player.powerUps[actionType] -= 1;
        console.log(player.powerUps);
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
    if (confirmed) return;
    setActionsError(false);
    setSelectedExecutions((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      } else {
        if (prev.length === 2) {
          setActionsError(true);
          return prev;
        }
        return [...prev, index];
      }
    });
  };

  const confirmExecution = () => {
    const actionsToExecute = selectedExecutions.map((i) => declaredActions[i]);
    console.log(actionsToExecute);
    socket.emit("execute-actions", room, name, actionsToExecute);
    setConfirmed(true);
  };

  return (
    <div className="center">
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
      {actionsError && (
        <div style={{ color: "red" }}>Please declare exactly 3 actions!</div>
      )}
      {isEliminated ? (
        <p style={{ color: "red", marginBottom: "10px" }}>
          You have been eliminated and cannot take actions.
        </p>
      ) : (
        stage === "declaration" && <ActionButtons {...{ you, selectAction }} />
      )}

      <button className="menu-button" onClick={leaveGame}>
        Leave Game
      </button>

      <TargetMenu {...{ anchorEl, open, closeTargetMenu, players, name }} />
      <WinningModal {...{ end, setEnd, winner }} />
    </div>
  );
};
