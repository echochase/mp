import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Box, Button, Typography, Stack, Fade } from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

export const HomePage = ({ socket }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [onlineCount, setOnlineCount] = useState(null);

  useEffect(() => {
    if (!socket) return;
    const handleOnlinePlayers = (count) => setOnlineCount(count);
    socket.on("online-players", handleOnlinePlayers);
    return () => socket.off("online-players", handleOnlinePlayers);
  }, [socket]);

  const btnSx = {
    fontFamily: "'Cinzel', serif",
    letterSpacing: "0.08em",
    textTransform: "none",
    borderRadius: "8px",
    fontSize: "0.95rem",
    py: 1.2,
  };

  const outlinedSx = {
    ...btnSx,
    borderColor: "rgba(201,168,76,0.5)",
    color: "#e8c97a",
    "&:hover": {
      borderColor: "#e8c97a",
      backgroundColor: "rgba(201,168,76,0.08)",
    },
  };

  const containedSx = {
    ...btnSx,
    background: "linear-gradient(135deg, #c9a84c, #a07830)",
    color: "#080a0f",
    fontWeight: 700,
    border: "none",
    "&:hover": {
      background: "linear-gradient(135deg, #e8c97a, #c9a84c)",
    },
  };

  const backSx = {
    ...btnSx,
    borderColor: "rgba(199,63,63,0.5)",
    color: "#e57373",
    "&:hover": {
      borderColor: "#e57373",
      backgroundColor: "rgba(199,63,63,0.08)",
    },
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
      <Fade in>
        <Box mb={5} textAlign="center" sx={{ "@media (max-width: 760px)": { mb: 2.5 } }}>
          <Typography
            variant="h2"
            sx={{
              fontFamily: "'Cinzel', serif",
              fontWeight: 900,
              letterSpacing: "0.06em",
              background: "linear-gradient(135deg, #e8c97a 0%, #c9a84c 50%, #a07830 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              mb: 1,
              "@media (max-width: 760px)": {
                fontSize: "clamp(1.15rem, 7vw, 1.75rem)",
                lineHeight: 0.96,
                letterSpacing: "0.02em",
                px: 1,
              },
            }}
          >
            Machiavellian Pursuits
          </Typography>
          <Box
            sx={{
              width: 80,
              height: 2,
              background: "linear-gradient(90deg, transparent, #c9a84c, transparent)",
              mx: "auto",
            }}
          />
        </Box>
      </Fade>

      <Fade in timeout={300}>
        <Stack
          spacing={{ xs: 1.2, sm: 2 }}
          width="100%"
          maxWidth="300px"
          alignItems="center"
          sx={{ "@media (max-width: 760px)": { maxWidth: "260px" } }}
        >
          {step === 1 ? (
            <>
              <Button variant="contained" fullWidth sx={containedSx} onClick={() => setStep(2)}>
                Play
              </Button>
              <Button variant="outlined" fullWidth sx={outlinedSx} onClick={() => navigate("/settings")}>
                Settings
              </Button>
              <Button variant="outlined" fullWidth sx={outlinedSx} onClick={() => navigate("/card-list")}>
                Card List
              </Button>
              <Button variant="outlined" fullWidth sx={outlinedSx} onClick={() => navigate("/about")}>
                How to Play
              </Button>
            </>
          ) : (
            <>
              <Button variant="contained" fullWidth sx={containedSx} onClick={() => navigate("/create")}>
                Create Room
              </Button>
              <Button variant="contained" fullWidth sx={containedSx} onClick={() => navigate("/join")}>
                Join Room
              </Button>
              <Button variant="outlined" fullWidth sx={backSx} onClick={() => setStep(1)}>
                ← Back
              </Button>
            </>
          )}
        </Stack>
      </Fade>

      {onlineCount && (
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          sx={{ position: "absolute", bottom: 56 }}
        >
          <FiberManualRecordIcon sx={{ color: "#4caf74", fontSize: "12px" }} />
          <Typography
            variant="body2"
            sx={{ fontFamily: "'Crimson Pro', serif", color: "var(--text-muted)", fontSize: "0.95rem" }}
          >
            {onlineCount} player{onlineCount !== 1 ? "s" : ""} online
          </Typography>
        </Box>
      )}

      <Typography
        variant="caption"
        sx={{
          position: "absolute",
          bottom: 20,
          fontFamily: "'Cinzel', serif",
          fontSize: "0.6rem",
          letterSpacing: "0.2em",
          color: "var(--text-dim)",
        }}
      >
        Version 1.0.0
      </Typography>
    </Box>
  );
};