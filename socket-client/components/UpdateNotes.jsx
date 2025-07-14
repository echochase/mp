import { Box, Typography, Paper, Stack, Divider } from "@mui/material";
import { useNavigate } from "react-router-dom";

const updates = [
  {
    version: "v0.1.0",
    date: "July 14, 2025",
    notes: [
      "Added this Update Notes section so I can keep better track of my own work 😅😅😅",
      "In 1v1 games, selecting an attack will automatically aim it at your opponent.",
      "Reworded some in-game prompts to feel a little more natural and welcoming.",
      "Massive revamps to the UI so that it looks actually decent."
    ],
  },
];

export const UpdateNotes = () => {
  const navigate = useNavigate();
  return (
    <Box>
      <Typography
        variant="h3"
        fontWeight={600}
        gutterBottom
      >
        Update Notes 📜
      </Typography>

      <Stack spacing={4}>
        {updates.map((update, idx) => (
          <Paper
            key={idx}
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 3,
              backgroundColor: (theme) =>
                theme.palette.mode === "dark" ? "#1e1e1e" : "#f9f9f9",
              textAlign: "left",
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              {update.version} —{" "}
              <Typography
                component="span"
                color="text.secondary"
              >
                {update.date}
              </Typography>
            </Typography>
            <Divider sx={{ my: 1.5 }} />
            <Stack spacing={1.5}>
              {update.notes.map((note, i) => (
                <Typography
                  key={i}
                  sx={{ lineHeight: 1.6 }}
                >
                  {note}
                </Typography>
              ))}
            </Stack>
          </Paper>
        ))}
      </Stack>
      <button className="return-to-menu" onClick={() => navigate("/")}>
        Back to Home
      </button>
    </Box>
  );
};
