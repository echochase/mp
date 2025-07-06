import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FormControlLabel,
  Switch,
} from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import "../styles/settings.css"

export const Settings = () => {
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(true);
  const [enableAnimations, setEnableAnimations] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const storedAnimations = localStorage.getItem("enableAnimations");

    const isDark = storedTheme === "dark";
    setDarkMode(isDark);
    document.body.classList.toggle("dark", isDark);

    if (storedAnimations !== null) {
      setEnableAnimations(JSON.parse(storedAnimations));
    }
  }, []);

  const handleThemeToggle = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("theme", newDarkMode ? "dark" : "light");
    document.body.classList.toggle("dark", newDarkMode);
  };

  const handleAnimationToggle = () => {
    const newSetting = !enableAnimations;
    setEnableAnimations(newSetting);
    localStorage.setItem("enableAnimations", JSON.stringify(newSetting));
  };

  return (
    <div className="settings-wrapper">
      <div className="settings-panel">
        <h1 className="settings-title">Settings</h1>

        <FormControlLabel
          label="Dark Mode"
          sx={{ width: "100%", m: 0, justifyContent: "space-between" }}
          control={
            <Switch
              checked={darkMode}
              onChange={handleThemeToggle}
              icon={
                <Brightness7 sx={{ color: "#fdd835", position: "relative", bottom: "2px" }} />
              }
              checkedIcon={
                <Brightness4 sx={{ color: "#fff", position: "relative", bottom: "2px" }} />
              }
              sx={{
                "& .MuiSwitch-switchBase": {
                  color: darkMode ? "#fff" : "#000",
                },
                "& .MuiSwitch-switchBase + .MuiSwitch-track": {
                  backgroundColor: darkMode ? "#888" : "#000",
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: darkMode ? "#fff" : "#2196f3",
                },
              }}
            />
          }
        />

        <FormControlLabel
          label="Animations"
          sx={{ width: "100%", m: 0, justifyContent: "space-between" }}
          control={
            <Switch
              checked={enableAnimations}
              onChange={handleAnimationToggle}
              sx={{
                "& .MuiSwitch-switchBase": {
                  color: "#fff",
                },
                "& .MuiSwitch-switchBase + .MuiSwitch-track": {
                  backgroundColor: darkMode ? "#444" : "#000",
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: darkMode ? "#66bb6a" : "#2e7d32",
                },
              }}
            />
          }
        />

        <button className="back-button" onClick={() => navigate("/")}>
          Back to Home
        </button>
      </div>
    </div>
  );
};
