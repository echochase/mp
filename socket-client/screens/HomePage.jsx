import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Box, Button, Typography, Stack, Fade } from "@mui/material";
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

export const HomePage = ({ socket }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [onlineCount, setOnlineCount] = useState(null);

  useEffect(() => {
    if (!socket) return;
    const handleOnlinePlayers = (count) => setOnlineCount(count);
    console.log("Received online count:", onlineCount);
    socket.on("online-players", handleOnlinePlayers);

    return () => {
      socket.off("online-players", handleOnlinePlayers);
    };
  }, [socket]);

  useEffect(() => {
    const logVisit = async () => {
      try {
        await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/log-visit`);
      } catch (err) {
        console.error('Failed to log visit:', err);
      }
    };
    logVisit();
  }, []);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      px={2}
    >
      <Fade in>
        <Typography variant="h2" gutterBottom fontWeight={700}>
          Double Bluff
        </Typography>
      </Fade>

      <Fade in timeout={300}>
        <Stack spacing={2} width="100%" maxWidth="300px" alignItems="center">
          {step === 1 ? (
            <>
              <Button
                variant="contained"
                fullWidth
                onClick={() => setStep(2)}
              >
                Play
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate("/settings")}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(29, 133, 224, 0.08)',
                  },
                }}
              >
                Settings
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate("/about")}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(29, 133, 224, 0.08)',
                  },
                }}
              >
                About
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate("/update-notes")}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(29, 133, 224, 0.08)',
                  },
                }}
              >
                Update Notes
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate("/create")}
              >
                Create Room
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate("/join")}
              >
                Join Room
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setStep(1)}
                sx={{
                  color: 'error.main',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 0, 0, 0.08)',
                  },
                  border: "1px solid rgba(144, 8, 8)",
                }}
              >
                Back to Home
              </Button>
            </>
          )}
        </Stack>
      </Fade>

      <Typography
        variant="caption"
        mt={5}
        sx={{ position: "absolute", bottom: 16 }}
      >
        Version 0.2.0
      </Typography>
      
      {onlineCount && <Box display="flex" alignItems="center" gap={1} sx={{ position: "absolute", bottom: 50 }}>
        <FiberManualRecordIcon sx={{ color: 'green', fontSize: '14px' }} />
        <Typography variant="body2">{onlineCount} player{onlineCount !== 1 ? 's' : ''} online</Typography>
      </Box>}
    </Box>
  );
};
