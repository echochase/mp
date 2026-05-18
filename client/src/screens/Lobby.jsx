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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { Close as KickIcon, CheckCircle } from "@mui/icons-material";
import { fallbackAvatarColor, getInitial } from "../utils/avatar.js";

export const Lobby = ({ socket, name, room, setRoom }) => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [players, setPlayers] = useState([]);
  const [ready, setReady] = useState(false);
  const [kicked, setKicked] = useState(false);

  const creating = location.state?.creating;

  // The owner is whoever created the room. The server also marks this now,
  // so host controls survive route navigation better than the original stub.
  const ownerName = players.find((player) => player.isLeader)?.name || players[0]?.name;
  const isHost = ownerName === name || creating;

  const leaveLobby = () => {
    socket.emit("leave-room", roomCode, name);
    navigate("/");
  };

  const handleKick = (playerName) => {
    socket.emit("kick-player", roomCode, name, playerName);
  };

  const startGame = () => {
    if (players.length < 2) { alert("Not enough players!"); return; }
    if (players.length > 6) { alert("Too many players!"); return; }
    socket.emit("start-game", roomCode, name);
  };

  const signalReady = () => { socket.emit("player-ready", roomCode, name); setReady(true); };
  const signalUnready = () => { socket.emit("player-unready", roomCode, name); setReady(false); };

  useEffect(() => {
    if (!socket || !name) { navigate("/"); return; }
    if (!room) setRoom(roomCode);

    const updatePlayers = (playersList) => {
      setPlayers(playersList);
      const currentPlayer = playersList.find((p) => p.name === name);
      if (playersList.length > 0 && !currentPlayer) setKicked(true);
      if (currentPlayer) setReady(Boolean(currentPlayer.ready));
    };

    socket.emit("get-players", roomCode);
    socket.on("players-update", updatePlayers);
    socket.on("new-player", updatePlayers);
    socket.on("start-confirm", () => navigate(`/play/${roomCode}`));

    return () => {
      socket.off("players-update", updatePlayers);
      socket.off("new-player", updatePlayers);
      socket.off("start-confirm");
    };
  }, [socket, roomCode, name, navigate, room, setRoom]);

  const cinzel = { fontFamily: "'Cinzel', serif" };
  const crimson = { fontFamily: "'Crimson Pro', serif" };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 4,
        background: "var(--bg)",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            padding: 4,
            borderRadius: 3,
            background: "var(--surface)",
            border: "1px solid rgba(201,168,76,0.25)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.08)",
          }}
        >
          {/* Header */}
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{
              ...cinzel,
              fontWeight: 900,
              letterSpacing: "0.06em",
              background: "linear-gradient(135deg, #e8c97a, #c9a84c)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Lobby
          </Typography>

          <Box
            sx={{
              width: 60,
              height: 1,
              background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)",
              mx: "auto",
              mb: 2,
            }}
          />

          <Typography
            variant="body1"
            align="center"
            sx={{ ...crimson, color: "var(--text-muted)", fontSize: "1rem", mb: 3 }}
          >
            Room Code:{" "}
            <Box
              component="span"
              sx={{
                ...cinzel,
                color: "#e8c97a",
                fontSize: "1rem",
                letterSpacing: "0.2em",
                fontWeight: 700,
              }}
            >
              {roomCode}
            </Box>
          </Typography>

          {/* Players */}
          <Typography
            variant="overline"
            sx={{
              ...cinzel,
              fontSize: "0.6rem",
              letterSpacing: "0.25em",
              color: "var(--text-muted)",
              display: "block",
              mb: 1.5,
            }}
          >
            Players
          </Typography>

          <Stack spacing={1}>
            {players.map((player) => {
              const isOwner = player.name === ownerName;
              const isYou = player.name === name;

              return (
                <Box
                  key={player.name}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2,
                    py: 1.25,
                    borderRadius: 2,
                    background: isYou
                      ? "rgba(76,175,116,0.07)"
                      : "rgba(255,255,255,0.03)",
                    border: isYou
                      ? "1px solid rgba(76,175,116,0.25)"
                      : "1px solid rgba(255,255,255,0.06)",
                    transition: "all 0.2s",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, position: "relative" }}>
                    {/* Crown for room owner */}
                    {isOwner && (
                      <Box
                        component="span"
                        sx={{
                          position: "absolute",
                          top: -14,
                          left: 6,
                          fontSize: "14px",
                          lineHeight: 1,
                          filter: "drop-shadow(0 0 4px rgba(201,168,76,0.8))",
                          zIndex: 2,
                        }}
                      >
                        👑
                      </Box>
                    )}

                    <Avatar
                      sx={{
                        width: 34,
                        height: 34,
                        background: player.avatarColor || fallbackAvatarColor(player.name),
                        color: "#fff",
                        fontFamily: "'Cinzel', serif",
                        fontWeight: 900,
                        border: isOwner ? "1.5px solid rgba(201,168,76,0.6)" : "1px solid rgba(255,255,255,0.14)",
                        boxShadow: isYou ? "0 0 18px rgba(76,175,116,0.35)" : "0 8px 18px rgba(0,0,0,0.25)",
                      }}
                    >
                      {getInitial(player)}
                    </Avatar>

                    {/* Ready checkmark */}
                    {player.ready && (
                      <CheckCircle
                        sx={{
                          position: "absolute",
                          top: -2,
                          left: -1,
                          color: "#4caf74",
                          backgroundColor: "var(--surface)",
                          borderRadius: "50%",
                          fontSize: "16px",
                        }}
                      />
                    )}

                    <Typography
                      sx={{
                        ...cinzel,
                        fontSize: "0.85rem",
                        letterSpacing: "0.05em",
                        color: isOwner ? "#e8c97a" : "var(--text)",
                        fontWeight: isOwner ? 700 : 400,
                      }}
                    >
                      {player.name}
                      {isOwner && (
                        <Box
                          component="span"
                          sx={{
                            ...crimson,
                            fontSize: "0.7rem",
                            color: "var(--gold)",
                            ml: 1,
                            fontStyle: "italic",
                            fontWeight: 300,
                          }}
                        >
                          Host
                        </Box>
                      )}
                    </Typography>
                  </Box>

                  {isHost && player.name !== name && (
                    <Tooltip title={`Kick ${player.name}`}>
                      <IconButton
                        size="small"
                        onClick={() => handleKick(player.name)}
                        sx={{
                          color: "var(--text-dim)",
                          "&:hover": { color: "#e57373", background: "rgba(199,63,63,0.1)" },
                        }}
                      >
                        <KickIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              );
            })}
          </Stack>

          {/* Actions */}
          <Stack direction="row" spacing={2} justifyContent="center" mt={4}>
            {isHost ? (
              <Button
                variant="contained"
                onClick={startGame}
                sx={{
                  ...cinzel,
                  textTransform: "none",
                  letterSpacing: "0.06em",
                  background: "linear-gradient(135deg, #c9a84c, #a07830)",
                  color: "#080a0f",
                  fontWeight: 700,
                  borderRadius: "8px",
                  px: 3,
                  "&:hover": { background: "linear-gradient(135deg, #e8c97a, #c9a84c)" },
                }}
              >
                Start Game
              </Button>
            ) : ready ? (
              <Button
                variant="outlined"
                onClick={signalUnready}
                sx={{
                  ...cinzel,
                  textTransform: "none",
                  letterSpacing: "0.06em",
                  borderRadius: "8px",
                  px: 3,
                  borderColor: "rgba(255,167,38,0.5)",
                  color: "#ffb74d",
                  "&:hover": { borderColor: "#ffb74d", background: "rgba(255,167,38,0.08)" },
                }}
              >
                Not Ready
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={signalReady}
                sx={{
                  ...cinzel,
                  textTransform: "none",
                  letterSpacing: "0.06em",
                  background: "linear-gradient(135deg, #4caf74, #2e7d52)",
                  color: "#fff",
                  fontWeight: 700,
                  borderRadius: "8px",
                  px: 3,
                  "&:hover": { background: "linear-gradient(135deg, #66bb8a, #4caf74)" },
                }}
              >
                Ready
              </Button>
            )}

            <Button
              variant="outlined"
              onClick={leaveLobby}
              sx={{
                ...cinzel,
                textTransform: "none",
                letterSpacing: "0.06em",
                borderRadius: "8px",
                px: 3,
                borderColor: "rgba(199,63,63,0.4)",
                color: "#e57373",
                "&:hover": { borderColor: "#e57373", background: "rgba(199,63,63,0.08)" },
              }}
            >
              Leave
            </Button>
          </Stack>
        </Paper>
      </Container>

      <Dialog
        open={kicked}
        onClose={() => navigate("/")}
        PaperProps={{
          sx: {
            background: "var(--surface)",
            border: "1px solid rgba(201,168,76,0.2)",
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ fontFamily: "'Cinzel', serif", color: "#e8c97a" }}>
          Removed from Lobby
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: "'Crimson Pro', serif", color: "var(--text-muted)", fontSize: "1rem" }}>
            You have been removed from the lobby, either due to a kick or disconnection.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => navigate("/")}
            sx={{
              fontFamily: "'Cinzel', serif",
              textTransform: "none",
              color: "#e8c97a",
              "&:hover": { background: "rgba(201,168,76,0.08)" },
            }}
          >
            Return Home
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};