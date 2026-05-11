import {
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const EnterDetails = ({ socket, name, setName, room, setRoom, creating }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const connectSocket = (e) => {
    e.preventDefault();
    if (!socket || !name.trim()) return;
    if (name.length > 16) {
      alert("Keep your name to 16 characters or fewer 🌱");
      return;
    }

    if (creating) {
      socket.emit("create-room", name);
    } else {
      socket.emit("check-room", room);
    }

    setLoading(true);
  };

  useEffect(() => {
    if (!socket) return;

    const handleRoomExists = () => socket.emit("join-room", room, name);
    const handleJoinSuccess = (payload) => {
      const roomJoined = typeof payload === "string" ? payload : payload.room;
      const started = typeof payload === "object" ? payload.started : false;
      setRoom(roomJoined);
      navigate(started ? `/play/${roomJoined}` : `/lobby/${roomJoined}`, { state: { creating: false } });
      setLoading(false);
    };
    const handleRoomCreated = (roomCode) => {
      setRoom(roomCode);
      navigate(`/lobby/${roomCode}`, { state: { creating: true } });
      setLoading(false);
    };
    const handleRoomNotFound = () => {
      alert("Hmm... couldn't find that room 🕵️‍♂️");
      setRoom("");
      setLoading(false);
    };
    const handleDuplicateNameError = () => {
      alert("Looks like someone already grabbed that name.");
      navigate("/join");
      setName("");
      setLoading(false);
    };
    const handleFullError = () => {
      alert("That room is full! Try another one.");
      setRoom("");
      setLoading(false);
    };
    const handleAlreadyStarted = () => {
      alert("That game has already started. Rejoin with the same name if you were already in it.");
      setLoading(false);
    };

    socket.on("room-exists", handleRoomExists);
    socket.on("join-success", handleJoinSuccess);
    socket.on("room-created", handleRoomCreated);
    socket.on("room-not-found", handleRoomNotFound);
    socket.on("duplicate-name-error", handleDuplicateNameError);
    socket.on("full-error", handleFullError);
    socket.on("game-already-started-error", handleAlreadyStarted);

    return () => {
      socket.off("room-exists", handleRoomExists);
      socket.off("join-success", handleJoinSuccess);
      socket.off("room-created", handleRoomCreated);
      socket.off("room-not-found", handleRoomNotFound);
      socket.off("duplicate-name-error", handleDuplicateNameError);
      socket.off("full-error", handleFullError);
      socket.off("game-already-started-error", handleAlreadyStarted);
    };
  }, [socket, room, name, navigate, setRoom, setName]);

  const fieldSx = {
    "& .MuiInput-root": { color: "#e8e4dc", fontFamily: "'Crimson Pro', serif", fontSize: "1.1rem" },
    "& .MuiInput-underline:before": { borderBottomColor: "rgba(255,255,255,0.15)" },
    "& .MuiInput-underline:hover:before": { borderBottomColor: "rgba(201,168,76,0.5)" },
    "& .MuiInput-underline:after": { borderBottomColor: "#c9a84c" },
    "& .MuiInputLabel-root": { color: "#8a8f9e", fontFamily: "'Crimson Pro', serif" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#c9a84c" },
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      px={2}
      sx={{ background: "var(--bg)" }}
    >
      <Typography
        variant="h4"
        mb={4}
        sx={{
          fontFamily: "'Cinzel', serif",
          fontWeight: 700,
          letterSpacing: "0.06em",
          background: "linear-gradient(135deg, #e8c97a, #c9a84c)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {creating ? "Create a Room" : "Join a Room"}
      </Typography>

      {loading && (
        <Stack alignItems="center" spacing={2} mb={3}>
          <CircularProgress sx={{ color: "#c9a84c" }} />
          <Typography
            variant="body2"
            textAlign="center"
            sx={{ fontFamily: "'Crimson Pro', serif", color: "var(--text-muted)", fontSize: "1rem" }}
          >
            Just warming things up...
            <br />
            Might take ~30 seconds ☕
          </Typography>
        </Stack>
      )}

      <Box
        component="form"
        onSubmit={connectSocket}
        maxWidth="360px"
        width="100%"
        borderRadius={3}
        p={4}
        sx={{
          background: "var(--surface)",
          border: "1px solid rgba(201,168,76,0.2)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
        }}
      >
        <Stack spacing={3}>
          {!creating && (
            <TextField
              variant="standard"
              label="Room Code"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              fullWidth
              inputProps={{ maxLength: 6 }}
              sx={fieldSx}
            />
          )}

          <TextField
            variant="standard"
            label="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            inputProps={{ maxLength: 10 }}
            sx={fieldSx}
          />

          <Stack direction="row" spacing={2} justifyContent="center" pt={2}>
            <Button
              variant="outlined"
              onClick={() => navigate("/")}
              sx={{
                fontFamily: "'Cinzel', serif",
                letterSpacing: "0.06em",
                textTransform: "none",
                borderRadius: "8px",
                px: 3,
                borderColor: "rgba(199,63,63,0.5)",
                color: "#e57373",
                "&:hover": { borderColor: "#e57373", backgroundColor: "rgba(199,63,63,0.08)" },
              }}
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                fontFamily: "'Cinzel', serif",
                letterSpacing: "0.06em",
                textTransform: "none",
                borderRadius: "8px",
                px: 3,
                background: "linear-gradient(135deg, #c9a84c, #a07830)",
                color: "#080a0f",
                fontWeight: 700,
                "&:hover": { background: "linear-gradient(135deg, #e8c97a, #c9a84c)" },
              }}
            >
              {creating ? "Create" : "Join"}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};