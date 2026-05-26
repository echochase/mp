// ── Shared MUI sx constants ───────────────────────────────────────────────────

const btnBase = {
  fontFamily: "'Cinzel', serif",
  letterSpacing: "0.06em",
  textTransform: "none",
  borderRadius: "8px",
};

export const containedGoldSx = {
  ...btnBase,
  background: "linear-gradient(135deg, #c9a84c, #a07830)",
  color: "#080a0f",
  fontWeight: 700,
  border: "none",
  "&:hover": { background: "linear-gradient(135deg, #e8c97a, #c9a84c)" },
};

export const outlinedGoldSx = {
  ...btnBase,
  borderColor: "rgba(201,168,76,0.5)",
  color: "#e8c97a",
  "&:hover": {
    borderColor: "#e8c97a",
    backgroundColor: "rgba(201,168,76,0.08)",
  },
};

export const outlinedRedSx = {
  ...btnBase,
  borderColor: "rgba(199,63,63,0.5)",
  color: "#e57373",
  "&:hover": {
    borderColor: "#e57373",
    backgroundColor: "rgba(199,63,63,0.08)",
  },
};

export const fieldSx = {
  "& .MuiInput-root": { color: "#e8e4dc", fontFamily: "'Crimson Pro', serif", fontSize: "1.1rem" },
  "& .MuiInput-underline:before": { borderBottomColor: "rgba(255,255,255,0.15)" },
  "& .MuiInput-underline:hover:before": { borderBottomColor: "rgba(201,168,76,0.5)" },
  "& .MuiInput-underline:after": { borderBottomColor: "#c9a84c" },
  "& .MuiInputLabel-root": { color: "#8a8f9e", fontFamily: "'Crimson Pro', serif" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#c9a84c" },
};

export const titleGradientSx = {
  fontFamily: "'Cinzel', serif",
  background: "linear-gradient(135deg, #e8c97a 0%, #c9a84c 50%, #a07830 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};
