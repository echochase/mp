import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Avatar,
  Box,
  Button,
  Stack,
  useTheme,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { Person, Close as KickIcon, CheckCircle } from "@mui/icons-material";

export const Lobby = ({ socket, name, room, setRoom }) => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [players, setPlayers] = useState([]);
  const [ready, setReady] = useState(false);
  const [kicked, setKicked] = useState(false);

  const theme = useTheme();
  const creating = location.state?.creating;

  const leaveLobby = () => {
    socket.emit("leave-room", roomCode, name);
    navigate("/");
  };

  const handleKick = (playerName) => {
    socket.emit("kick-player", roomCode, name, playerName);
  };

  const startGame = () => {
    if (players.length < 2) {
      alert("Not enough players!");
      return;
    }
    if (players.length > 6) {
      alert("Too many players!");
      return;
    }
    socket.emit("start-game", roomCode, name);
  };

  const signalReady = () => {
    socket.emit("player-ready", roomCode, name);
    setReady(true);
  };

  useEffect(() => {
    if (!socket || !name) {
      navigate("/");
      return;
    }

    if (!room) {
      setRoom(roomCode);
    }

    const updatePlayers = (playersList) => {
      setPlayers(playersList);
      const names = playersList.map((p) => p.name);
      if (!names.includes(name)) {
        setKicked(true);
      }
    };

    const handleStart = () => {
      navigate(`/play/${roomCode}`);
    };

    socket.emit("get-players", roomCode);

    socket.on("players-update", updatePlayers);
    socket.on("new-player", updatePlayers);
    socket.on("start-confirm", handleStart);

    return () => {
      socket.off("players-update", updatePlayers);
      socket.off("new-player", updatePlayers);
      socket.off("start-confirm", handleStart);
    };
  }, [socket, roomCode, name, navigate, room, setRoom]);

  const paperBg = theme.palette.mode === "dark" ? "#333333" : "#cccccc";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={6}
          sx={{
            padding: 4,
            borderRadius: 3,
            backgroundColor: paperBg,
          }}
        >
          <Typography variant="h4" align="center" gutterBottom>
            Welcome!
          </Typography>
          <Typography variant="subtitle1" align="center" gutterBottom>
            Room Code: <strong>{roomCode}</strong>
          </Typography>

          <Typography variant="h6" mt={3} mb={2}>
            Players:
          </Typography>

          <Stack spacing={1}>
            {players.map((player) => (
              <Card
                key={player.name}
                variant="outlined"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 2,
                  py: 1,
                  backgroundColor: paperBg,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", position: "relative" }}>
                  <Avatar sx={{ mr: 1 }}>
                    <Person />
                  </Avatar>
                  {player.ready && (
                    <CheckCircle
                      sx={{
                        position: "absolute",
                        top: -2,
                        left: -1,
                        color: "green",
                        backgroundColor: paperBg,
                        borderRadius: "50%",
                        fontSize: "20px",
                      }}
                    />
                  )}
                  <Typography variant="body1">{player.name}</Typography>
                </Box>

                {creating && player.name !== name && (
                  <Tooltip title="Kick this player">
                    <IconButton
                      color="error"
                      onClick={() => handleKick(player.name)}
                      aria-label={`Kick ${player.name}`}
                    >
                      <KickIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Card>
            ))}
          </Stack>

          <Stack direction="row" spacing={2} justifyContent="center" mt={4}>
            {ready ? (
              <Button variant="disabled">Ready</Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={creating ? startGame : signalReady}
              >
                {creating ? "Start Game" : "I'm Ready"}
              </Button>
            )}
            <Button variant="outlined" color="secondary" onClick={leaveLobby}>
              Leave Lobby
            </Button>
          </Stack>
        </Paper>
      </Container>

      <Dialog open={kicked} onClose={() => navigate("/")}>
        <DialogTitle>Removed from Lobby</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have been removed from the lobby, either due to a kick or disconnection.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate("/")} color="primary" autoFocus>
            Return Home
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
