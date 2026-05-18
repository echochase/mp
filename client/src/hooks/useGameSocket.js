import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const useGameSocket = (socket, name, roomCode, room, setRoom) => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!socket) return;
    if (!name) {
      navigate("/");
      return;
    }

    if (!room) setRoom(roomCode);

    const handleGameState = (state) => setGameState(state);
    const handleResumeSuccess = ({ started }) => {
      if (!started) navigate(`/lobby/${roomCode}`);
    };
    const handleRoomNotFound = () => navigate("/");
    const handleNotInRoom = () => navigate("/");
    const handleGameError = (message) => {
      setError(message);
      window.setTimeout(() => setError(""), 3500);
    };

    socket.emit("resume-game", roomCode, name);
    socket.on("game-state", handleGameState);
    socket.on("resume-success", handleResumeSuccess);
    socket.on("room-not-found", handleRoomNotFound);
    socket.on("not-in-room-error", handleNotInRoom);
    socket.on("game-error", handleGameError);

    return () => {
      socket.off("game-state", handleGameState);
      socket.off("resume-success", handleResumeSuccess);
      socket.off("room-not-found", handleRoomNotFound);
      socket.off("not-in-room-error", handleNotInRoom);
      socket.off("game-error", handleGameError);
    };
  }, [socket, name, room, roomCode, navigate, setRoom]);

  return { gameState, error };
};
