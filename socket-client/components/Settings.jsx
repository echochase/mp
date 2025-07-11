import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  FormControlLabel,
  Switch,
} from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { ColorModeContext } from "../theme/ColorModeProvider"; // adjust import path
import "../styles/settings.css";

export const Settings = () => {
  const navigate = useNavigate();

  const { mode, toggleColorMode } = useContext(ColorModeContext);
  const [darkMode, setDarkMode] = useState(mode === "dark");
  const [enableAnimations, setEnableAnimations] = useState(false);

  useEffect(() => {
    setDarkMode(mode === "dark");

    const storedAnimations = localStorage.getItem("enableAnimations");
    if (storedAnimations !== null) {
      setEnableAnimations(JSON.parse(storedAnimations));
    }
  }, [mode]);

  const handleThemeToggle = () => {
    toggleColorMode();
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
                  backgroundColor: "#888",
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
                  backgroundColor: "#888",
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
