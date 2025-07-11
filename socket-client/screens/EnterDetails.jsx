import { TextField, CircularProgress } from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const EnterDetails = ({ socket, name, setName, room, setRoom, creating }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const isDark = document.body.classList.contains("dark");

  const muiStyles = {
    input: {
      color: isDark ? "white" : "#242424"
    },
    "& .MuiInputBase-input::placeholder": {
      color: "lightgray",
      opacity: 1,
      fontSize: "17px",
    },
    '& .MuiInput-underline:before': {
      borderBottomColor: isDark ? "white" : "#646cff",
    },
    "& .MuiInput-underline:hover:before": {
      borderBottomColor: isDark ? "white" : "#646cff",
    },
    '& .MuiInput-underline:after': {
      borderBottomColor: isDark ? "white" : "#646cff",
    },
    width: "370px",
    padding: "5px",
  };

  const connectSocket = (e) => {
    e.preventDefault();
    if (!socket || !name.trim()) return;
    console.log(name);
    if (name.length > 10) {
      alert("Please enter 10 characters or less!");
      return;
    }
    if (creating) {
      const newRoom = socket.id;
      setRoom(newRoom);
      socket.emit("create-room", name);
    } else {
      socket.emit("check-room", room);
    }

    setLoading(true);
  };

  useEffect(() => {
    if (!socket) return;
  
    const handleRoomExists = () => {
      socket.emit("join-room", room, name);
    };
  
    const handleJoinSuccess = (roomJoined) => {
      navigate(`/lobby/${roomJoined}`, { state: { creating: false } });
    };
  
    const handleRoomNotFound = () => {
      alert("Sorry, this room doesn't exist.");
      setRoom("");
      setLoading(false);
    };
  
    const handleDuplicateNameError = () => {
      alert("This name is already taken in this room!");
      navigate("/join");
      setName("");
      setLoading(false);
    };
  
    const handleRoomCreated = (roomCode) => {
      setRoom(roomCode);
      navigate(`/lobby/${roomCode}`, { state: { creating: true } });
      setLoading(false);
    }

    const handleStartedError = () => {
      alert("Sorry, that game has started!");
      setRoom("");
      setLoading(false);
    };
  
    socket.on("room-exists", handleRoomExists);
    socket.on("join-success", handleJoinSuccess);
    socket.on("room-created", handleRoomCreated);
    socket.on("room-not-found", handleRoomNotFound);
    socket.on("started-error", handleStartedError);
    socket.on("duplicate-name-error", handleDuplicateNameError);
  
    return () => {
      socket.off("room-exists", handleRoomExists);
      socket.off("join-success", handleJoinSuccess);
      socket.off("room-not-found", handleRoomNotFound);
      socket.off("started-error", handleStartedError);
      socket.off("duplicate-name-error", handleDuplicateNameError);
    };
  }, [socket, room, name, navigate]);
  

  return (
    <div className="center">
      <h1>{creating ? "Create a Room" : "Join a Room"}</h1>
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "20px" }}>
          <CircularProgress />
          <p style={{ marginTop: "15px", color: isDark ? "white" : "#242424", fontSize: "16px" }}>
            Server is starting, please wait a while...
            <br />
            [Estimated time: 30 seconds]
          </p>
        </div>
      )}
      <form onSubmit={connectSocket} className="center">
        {!creating && (
          <TextField
            placeholder="Enter Room Code"
            variant="standard"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            fullWidth
            sx={muiStyles}
          />
        )}
        <TextField
          placeholder="Enter Username"
          variant="standard"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          sx={muiStyles}
        />
        <div className="horizontal-box" style={{ marginTop: "30px" }}>
          <button type="button" className="menu-button" onClick={() => navigate("/")}>
            Back
          </button>
          <button type="submit" className="menu-button">
            {creating ? "Create Room" : "Join Room"}
          </button>
        </div>
      </form>
    </div>
  );
};
