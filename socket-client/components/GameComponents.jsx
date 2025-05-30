import { Menu, MenuItem, Modal } from "@mui/material";

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
  )
}

export const LogModal = ({ openLog, setOpenLog, room, name, turnLogs, turnCount, stage, winner }) => {
  return (
    <Modal open={openLog} onClose={() => setOpenLog(false)}>
      <div className="modal center">
        <h3>Game Room: {room}</h3>
        <strong>Turn: {turnCount}, Stage: {stage}</strong>
        <strong>You: {name}</strong>
        <div className="mobile-log">
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
  )
}

export const TargetMenu = ({ anchorEl, open, closeTargetMenu, players, name }) => {
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
}

export const ActionButtons = ({ you, selectAction }) => {
  return (
    <div className="action-buttons">
      <button className="menu-button" onClick={(e) => selectAction(e, "attack")}>
        Attack
      </button>
      <button className="menu-button" onClick={(e) => selectAction(e, "defend")}>
        Defend
      </button>
      <button className="menu-button" onClick={(e) => selectAction(e, "energy-shield")}>
        Energy Shield
      </button>
      {you?.powerUps?.special > 0 && (
        <div className="power-up-wrapper">
          <button className="menu-button" onClick={(e) => selectAction(e, "special")}>
            Special Attack
          </button>
          <div className="power-up-badge">{you.powerUps.special}</div>
        </div>
      )}
      {you?.powerUps?.cruelty > 0 && (
        <div className="power-up-wrapper">
          <button className="menu-button" onClick={(e) => selectAction(e, "cruelty")}>
            Cruelty
          </button>
          <div className="power-up-badge">{you.powerUps.cruelty}</div>
        </div>
      )}
      {you?.powerUps?.prowess > 0 && (
        <div className="power-up-wrapper">
          <button className="menu-button" onClick={(e) => selectAction(e, "prowess")}>
            Prowess
          </button>
          <div className="power-up-badge">{you.powerUps.prowess}</div>
        </div>
      )}
      {you?.powerUps?.heal > 0 && (
        <div className="power-up-wrapper">
          <button className="menu-button" onClick={(e) => selectAction(e, "heal")}>
            Heal
          </button>
          <div className="power-up-badge">{you.powerUps.heal}</div>
        </div>
      )}
    </div>
  );
}

export const ChooseDeclarations = ({ confirmed, declaredActions, declareAction, deleteAction, name }) => {
  return (
    <div
      className="declared-actions"
      style={{ border: confirmed ? "2px solid yellow" : "2px solid white" }}
    >
      <h3>Declared Actions:</h3>
      <div className="horizontal-box">
        {declaredActions.map((act, idx) => (
          <button
            className="declared-action"
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
      <br />
    </div>
  );
}

export const ChooseExecutions = ({ confirmed, declaredActions, selectedExecutions, confirmExecution, executeAction }) => {
  return (
    <div
      className="choose-execution"
      style={{
        border: confirmed ? "2px solid darkgreen" : "2px solid crimson",
      }}
    >
      {!confirmed ? (
        <h3>Choose 2 actions to execute.</h3>
      ) : (
        <h3>The following actions will be executed this turn:</h3>
      )}
      <div className="horizontal-box">
        {declaredActions.map((act, idx) => {
          const isSelected = selectedExecutions.includes(idx);
          return (
            <button
              className={`declared-action ${isSelected ? "selected" : ""}`}
              key={idx}
              onClick={() => executeAction(idx)}
            >
              {act.actionType} → {act.target}
            </button>
          );
        })}
      </div>
      {!confirmed && selectedExecutions.length === 2 && (
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
}