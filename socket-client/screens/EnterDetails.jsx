import {
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const EnterDetails = ({ socket, name, setName, room, setRoom, creating }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [loading, setLoading] = useState(false);

  const connectSocket = (e) => {
    e.preventDefault();
    if (!socket || !name.trim()) return;
    if (name.length > 10) {
      alert("Keep your name to 10 characters or fewer 🌱");
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

    const handleRoomExists = () => socket.emit("join-room", room, name);
    const handleJoinSuccess = (roomJoined, isSpectator = false) =>
      navigate(`/${isSpectator ? "play" : "lobby"}/${roomJoined}`, {
        state: {
          creating: false,
          spectator: isSpectator,
        },
      });

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

    socket.on("room-exists", handleRoomExists);
    socket.on("join-success", handleJoinSuccess);
    socket.on("room-created", handleRoomCreated);
    socket.on("room-not-found", handleRoomNotFound);
    socket.on("duplicate-name-error", handleDuplicateNameError);
    socket.on("full-error", handleFullError);

    return () => {
      socket.off("room-exists", handleRoomExists);
      socket.off("join-success", handleJoinSuccess);
      socket.off("room-created", handleRoomCreated);
      socket.off("room-not-found", handleRoomNotFound);
      socket.off("duplicate-name-error", handleDuplicateNameError);
      socket.off("full-error", handleFullError);
    };
  }, [socket, room, name, navigate, setRoom, setName]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      px={2}
    >
      <Typography variant="h4" fontWeight={600} mb={3}>
        {creating ? "Create a Room" : "Join a Room"}
      </Typography>

      {loading && (
        <Stack alignItems="center" spacing={2} mb={3}>
          <CircularProgress />
          <Typography variant="body2" textAlign="center" color="text.secondary">
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
        borderRadius={2}
        p={3}
        boxShadow={3}
        bgcolor={isDark ? "grey.900" : "grey.100"}
      >
        <Stack spacing={3}>
          {!creating && (
            <TextField
              variant="standard"
              placeholder="Room Code"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              fullWidth
              inputProps={{ maxLength: 6 }}
              InputProps={{
                sx: {
                  color: isDark ? "white" : "#242424",
                },
              }}
            />
          )}

          <TextField
            variant="standard"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            inputProps={{ maxLength: 10 }}
            InputProps={{
              sx: {
                color: isDark ? "white" : "#242424",
              },
            }}
          />

          <Stack direction="row" spacing={2} justifyContent="center" pt={2}>
            <Button
              variant="outlined"
              color="error"
              onClick={() => navigate("/")}
              sx={{
                borderRadius: "20px",
                px: 4,
                textTransform: "none",
                boxShadow: 1,
                '&:hover': {
                  backgroundColor: "rgba(255, 0, 0, 0.08)",
                },
              }}
            >
              Go Back
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                borderRadius: "20px",
                px: 4,
                textTransform: "none",
                boxShadow: 1,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
              }}
            >
              {creating ? "Create Room" : "Join Room"}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};
