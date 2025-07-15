import { Menu, MenuItem, Modal } from "@mui/material";
import { useEffect, useRef } from "react";

export const WinningModal = ({ end, setEnd, winner }) => {
  return (
    <Modal open={end} onClose={() => setEnd(false)}>
      <div className="modal center">
        {winner ? (
          <div className="center">
            <h2>We have a winner!</h2>
            <p>The winner is {winner}. Well played everyone!</p>
          </div>
        ) : (
          <div className="center">
            <h2>It's a draw!</h2>
            <p>The game is over and everyone is eliminated.</p>
          </div>
        )}
        <div className="horizontal-box">
          <button onClick={() => setEnd(false)}>Done</button>
        </div>
      </div>
    </Modal>
  );
};

export const LogModal = ({
  openLog,
  setOpenLog,
  room,
  name,
  turnLogs,
  turnCount,
  stage,
  winner,
}) => {
  const logEndRef = useRef(null);

  // Scroll to bottom on new log
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollTop = logEndRef.current.scrollHeight;
    }
  }, [turnLogs, openLog]);

  return (
    <Modal open={openLog} onClose={() => setOpenLog(false)}>
      <div className="modal center">
        <h3>Game Room: {room}</h3>
        <strong>
          Turn: {turnCount}, Stage: {stage}
        </strong>
        <strong>You: {name}</strong>
        <div className="mobile-log" ref={logEndRef}>
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
    </Modal>
  );
};

export const TargetMenu = ({
  anchorEl,
  open,
  closeTargetMenu,
  players,
  name,
}) => {
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={() => closeTargetMenu()}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{
        paper: {
          sx: {
            backgroundColor: "black",
            color: "white",
          },
        },
      }}
    >
      {players
        .filter((player) => player.name !== name)
        .map((player) => (
          <MenuItem
            key={player.name}
            onClick={() => closeTargetMenu(player.name)}
            sx={{
              "&:hover": {
                opacity: 0.7,
                transform: "scale(0.95)",
              },
              transition: "all 0.2s ease",
            }}
          >
            {player.name}
          </MenuItem>
        ))}
    </Menu>
  );
};

export const ActionButtons = ({ you, selectAction }) => {
  const numSpecial = you?.powerUps.special;
  const numCruelty = you?.powerUps.cruelty;
  const numProwess = you?.powerUps.prowess;
  const numHeal = you?.powerUps.heal;

  return (
    <>
      <div className="action-buttons">
        <div className="tooltip-wrapper">
          <button className="action-button" onClick={(e) => selectAction(e, "attack")}>
            Attack
          </button>
          <div className="tooltip">
            A physical attack. Deals 1 damage. Blockable by defend.
          </div>
        </div>

        <div className="tooltip-wrapper">
          <button className="action-button" onClick={(e) => selectAction(e, "defend")}>
            Defend
          </button>
          <div className="tooltip">
            Blocks a physical attack. Useless against energy-based power-ups.
          </div>
        </div>

        <div className="tooltip-wrapper">
          <button className="action-button" onClick={(e) => selectAction(e, "energy-shield")}>
            Energy Shield
          </button>
          <div className="tooltip">
            Blocks any damaging power-ups such as Special Attack or Cruelty.
          </div>
        </div>
      </div>

      <hr style={{ width: "100%" }} />

      <div className="powerup-buttons">
        <div className="power-up-wrapper tooltip-wrapper">
          <button
            className={numSpecial >= 0 ? "action-button" : "action-button bluff"}
            onClick={(e) => selectAction(e, "special")}
          >
            Special Attack
          </button>
          {numSpecial >= 0 && <div className="power-up-badge">{numSpecial}</div>}
          <div className="tooltip">
            An energy-based attack that deals 2 damage to its target. Blockable by Energy Shield. May be reflected by Prowess.
          </div>
        </div>

        <div className="power-up-wrapper tooltip-wrapper">
          <button
            className={numCruelty >= 0 ? "action-button" : "action-button bluff"}
            onClick={(e) => selectAction(e, "cruelty")}
          >
            Cruelty
          </button>
          {numCruelty >= 0 && <div className="power-up-badge">{numCruelty}</div>}
          <div className="tooltip">
            Instantly reduces target's HP to 0. Blockable by Energy Shield only.
          </div>
        </div>

        <div className="power-up-wrapper tooltip-wrapper">
          <button
            className={numProwess >= 0 ? "action-button" : "action-button bluff"}
            onClick={(e) => selectAction(e, "prowess")}
          >
            Prowess
          </button>
          {numProwess >= 0 && <div className="power-up-badge">{numProwess}</div>}
          <div className="tooltip">
            If the target attacks the user, reflects all attacks back to the attacker.
          </div>
        </div>

        <div className="power-up-wrapper tooltip-wrapper">
          <button
            className={numHeal >= 0 ? "action-button" : "action-button bluff"}
            onClick={(e) => selectAction(e, "heal")}
          >
            Heal
          </button>
          {numHeal >= 0 && <div className="power-up-badge">{numHeal}</div>}
          <div className="tooltip">
            Restore 2 HP. Cannot exceed max HP.
          </div>
        </div>
      </div>
    </>
  );
};

export const ChooseDeclarations = ({
  confirmed,
  declaredActions,
  declareAction,
  deleteAction,
  name,
}) => {
  return (
    <div
      className={`declared-actions ${confirmed ? "confirmed" : "unconfirmed"}`}
    >
      <h3>Declared Actions:</h3>
      <div className="horizontal-box">
        {declaredActions.map((act, idx) => (
          <button
            className={`declared-action ${act.bluff ? "bluff" : ""}`}
            key={idx}
            onClick={() => deleteAction(idx)}
          >
            {act.actionType} {act.target !== name && `→ ${act.target}`}
          </button>
        ))}
      </div>
      <br />
      {!confirmed && declaredActions.length === 3 && (
        <button className="declared-action" onClick={declareAction}>
          Confirm
        </button>
      )}
      {confirmed && (
        <>
          <p>You will declare the following actions:</p>
          {declaredActions.map((act, idx) => (
            <div
              key={idx}
              className={act.bluff ? "bluff" : ""}
              onClick={() => deleteAction(idx)}
            >
              {act.actionType} {act.target !== name && `→ ${act.target}`}
            </div>
          ))}
        </>
      )}
      <br />
    </div>
  );
};

export const ChooseExecutions = ({
  confirmed,
  declaredActions,
  selectedExecutions,
  confirmExecution,
  executeAction,
}) => {
  return (
    <div
      className="choose-execution"
      style={{
        border: confirmed ? "2px solid darkgreen" : "2px solid crimson",
      }}
    >
      {!confirmed ? (
        <>
          <h3>Choose 2 actions to execute.</h3>
          <div className="horizontal-box">
            {declaredActions.map((act, idx) => {
              const isSelected = selectedExecutions.includes(idx);
              return (
                <button
                  className={`declared-action ${isSelected ? "selected" : "declared-action-choose"} ${
                    act.bluff ? "bluff" : ""
                  }`}
                  key={idx}
                  onClick={() => executeAction(idx)}
                  disabled={act.bluff}
                >
                  {act.actionType} → {act.target}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <h3>The following actions will be executed this turn:</h3>
          <div className="horizontal-box">
            {declaredActions
              .map((act, idx) => ({ act, idx })) // Pair each action with its original index
              .filter(({ idx }) => selectedExecutions.includes(idx)) // Keep only selected ones
              .map(({ act, idx }) => {
                return (
                  <button
                    className="declared-action selected"
                    key={idx}
                    onClick={() => executeAction(idx)}
                  >
                    {act.actionType} → {act.target}
                  </button>
                );
              })}
          </div>
        </>
      )}
      {!confirmed && (
        <button
          className="menu-button"
          style={{ marginTop: "15px" }}
          onClick={confirmExecution}
        >
          Confirm Execution
        </button>
      )}
    </div>
  );
};
