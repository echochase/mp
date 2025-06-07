import { useNavigate } from "react-router-dom";

export const About = () => {
  const navigate = useNavigate();
  return (
    <div className="center">

      <h1>Double Bluff</h1>
      <p>A web game.</p>
      
      <button className="back-button" onClick={() => navigate("/")}>Back to Home</button>
    </div>
  )
}