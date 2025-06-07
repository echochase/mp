import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FormControlLabel,
  Switch,
} from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";

export const Settings = () => {
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(true);
  const [skipAnimations, setSkipAnimations] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const storedAnimations = localStorage.getItem("skipAnimations");

    const isDark = storedTheme === "dark";
    setDarkMode(isDark);
    document.body.classList.toggle("dark", isDark);

    if (storedAnimations !== null) {
      setSkipAnimations(JSON.parse(storedAnimations));
    }
  }, []);

  const handleThemeToggle = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("theme", newDarkMode ? "dark" : "light");
    document.body.classList.toggle("dark", newDarkMode);
  };

  const handleAnimationToggle = () => {
    const newSetting = !skipAnimations;
    setSkipAnimations(newSetting);
    localStorage.setItem("skipAnimations", JSON.stringify(newSetting));
  };

  return (
    <div className="settings-panel">
      <h1 className="settings-title">Settings</h1>
      <FormControlLabel
        control={
          <Switch
            checked={darkMode}
            onChange={handleThemeToggle}
            icon={<Brightness7 sx={{ color: "#fdd835", bottom: "2px", position: "relative" }} />}
            checkedIcon={<Brightness4 sx={{ color: "#fff", bottom: "2px", position: "relative" }} />}
            sx={{
              "& .MuiSwitch-switchBase": {
                color: darkMode ? "#fff" : "#000", // knob
              },
              "& .MuiSwitch-switchBase + .MuiSwitch-track": {
                backgroundColor: darkMode ? "#888" : "#000", // track when off
              },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                backgroundColor: darkMode ? "#fff" : "#2196f3", // track when on
              },
            }}
          />
        }
        label="Dark Mode"
      />

      <FormControlLabel
        control={
          <Switch
            checked={skipAnimations}
            onChange={handleAnimationToggle}
            sx={{
              "& .MuiSwitch-switchBase": {
                color: darkMode ? "#fff" : "#000",
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
        label="Skip Animations"
      />

      <button className="back-button" onClick={() => navigate("/")}>Back to Home</button>
    </div>
  );
};
