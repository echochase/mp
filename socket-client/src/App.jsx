import { BrowserRouter, Routes, Route } from "react-router-dom";
import "../styles/common.css";
import "./App.css";
import { HomePage } from "../screens/HomePage";
import { EnterDetails } from "../screens/EnterDetails";
import { Lobby } from "../screens/Lobby";
import { Game } from "../screens/Game";
import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import { Settings } from "../components/Settings";
import { About } from "../components/About";
import { UpdateNotes } from "../components/UpdateNotes";

export default function App() {
  const [socket, setSocket] = useState(null);
  const [name, setName] = useState(localStorage.getItem("name") || "");
  const [room, setRoom] = useState(localStorage.getItem("room") || "");

  let storedTheme = localStorage.getItem("theme");
  if (!storedTheme) {
    localStorage.setItem("theme", "dark");
    storedTheme = "dark";
  }
  const isDark = storedTheme === "dark";
  document.body.classList.toggle("dark", isDark);

  const backend = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const newSocket = io(backend);
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    localStorage.setItem("name", name);
  }, [name]);

  useEffect(() => {
    localStorage.setItem("room", room);
  }, [room]);

  const sharedProps = { socket, name, setName, room, setRoom };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage socket={socket} />} />
        <Route path="/create" element={<EnterDetails {...sharedProps} creating={true} />} />
        <Route path="/join" element={<EnterDetails {...sharedProps} creating={false} />} />
        <Route path="/lobby/:roomCode" element={<Lobby {...sharedProps} />} />
        <Route path="/play/:roomCode" element={<Game {...sharedProps} />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/about" element={<About />} />
        <Route path="/update-notes" element={<UpdateNotes />} />
      </Routes>
    </BrowserRouter>
  );
}
