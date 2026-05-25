import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Box, Button, Typography, Stack, Fade } from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { containedGoldSx, outlinedGoldSx, outlinedRedSx, titleGradientSx } from "../styles/theme.js";

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
              ...titleGradientSx,
              fontWeight: 900,
              letterSpacing: "0.06em",
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
              <Button variant="contained" fullWidth sx={containedGoldSx} onClick={() => setStep(2)}>
                Play
              </Button>
              <Button variant="outlined" fullWidth sx={outlinedGoldSx} onClick={() => navigate("/settings")}>
                Settings
              </Button>
              <Button variant="outlined" fullWidth sx={outlinedGoldSx} onClick={() => navigate("/card-list")}>
                Card List
              </Button>
              <Button variant="outlined" fullWidth sx={outlinedGoldSx} onClick={() => navigate("/about")}>
                How to Play
              </Button>
            </>
          ) : (
            <>
              <Button variant="contained" fullWidth sx={containedGoldSx} onClick={() => navigate("/create")}>
                Create Room
              </Button>
              <Button variant="contained" fullWidth sx={containedGoldSx} onClick={() => navigate("/join")}>
                Join Room
              </Button>
              <Button variant="outlined" fullWidth sx={outlinedRedSx} onClick={() => setStep(1)}>
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