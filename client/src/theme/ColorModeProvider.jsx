import { createContext, useMemo, useState, useEffect } from "react";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";

export const ColorModeContext = createContext({
  toggleColorMode: () => {},
  mode: "light",
});

export const ColorModeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    const stored = localStorage.getItem("theme");
    return stored === "dark" ? "dark" : "light";
  });

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === "light" ? "dark" : "light";
          localStorage.setItem("theme", newMode);
          return newMode;
        });
      },
      mode,
    }),
    [mode]
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === "dark"
            ? {
                background: {
                  default: "#121212",
                  paper: "#1e1e1e",
                },
                text: {
                  primary: "#ffffff",
                },
              }
            : {
                background: {
                  default: "#eeeeee",
                  paper: "#ffffff",
                },
                text: {
                  primary: "#242424",
                },
              }),
        },
        typography: {
          fontFamily: "system-ui, Avenir, Helvetica, Arial, sans-serif",
        },
      }),
    [mode]
  );

  useEffect(() => {
    // Apply CSS variables for non-MUI global styles
    const isDark = mode === "dark";
    document.body.style.setProperty("--bg", isDark ? "linear-gradient(145deg, #1e1e1e, #2c2c2c)" : "linear-gradient(145deg, #e6e6e6, #ffffff)");
    document.body.style.setProperty("--text", isDark ? "white" : "#242424");
    document.body.style.setProperty("--border", isDark ? "white" : "black");
    document.body.style.setProperty("--button-bg", isDark ? "#1a1a1a" : "#646cff");
    document.body.style.setProperty("--button-text", isDark ? "white" : "black");
    document.body.style.setProperty("--button-hover", isDark ? "#333333" : "#535bf2");
    document.body.style.setProperty("--card-bg", isDark ? "#222222" : "#cccccc");
    document.body.style.setProperty("--settings-bg", isDark ? "#222222" : "#cccccc");
    document.body.style.setProperty("--setting-bg", isDark ? "#333333" : "#bbbbbb");
    document.body.style.setProperty("--modal-bg", isDark ? "black" : "#eeeeee");
    document.body.style.setProperty("--confirmed-border", isDark ? "yellow" : "green");
    document.body.style.setProperty("--info-bg", isDark ? "#121212" : "#cccccc");
    document.body.style.setProperty("--tile-bg", isDark ? "black" : "#ffffff")
    document.body.style.setProperty("--warning", isDark ? "yellow" : "darkorange")
  }, [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
