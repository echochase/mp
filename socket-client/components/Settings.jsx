import { useNavigate } from "react-router-dom";
import "../styles/settings.css";

export const Settings = () => {
  const navigate = useNavigate();

  return (
    <div className="settings-wrapper">
      <div className="settings-panel">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-stub">More settings coming soon.</p>
        <button className="back-button" onClick={() => navigate("/")}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
};