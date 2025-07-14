import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Box, Button, Typography, Stack, Fade } from "@mui/material";

export const HomePage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

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
        Version 0.0.9
      </Typography>
    </Box>
  );
};
