import { useNavigate } from "react-router-dom";

export const About = () => {
  const navigate = useNavigate();
  return (
    <div className="center about-description">

      <h1>Double Bluff</h1>
      <p>A web game about trickery and deception.</p>

      <h2>Gameplay</h2>
      <p>Each player starts with 5 hitpoints.</p>
      <p>They may choose between 3 default actions: <b>Attack, Defend</b> and <b>Energy Shield</b>.</p>
      <p>Each turn, players receive a random power-up from <b>Special Attack, Cruelty, Prowess</b> and <b>Heal</b>.</p>
      <p>Turns are split into the <b>Declaration Stage</b> and the <b>Execution Stage</b>.</p>
      <p>In the Declaration Stage, each player first declares 3 actions that they plan to take in this turn.</p>
      <p>When every player has done so, everyone's selected actions are revealed and the turn is in its Execution Stage.</p>
      <p>In the Execution Stage, players select up to 2 of their 3 declared actions to execute.</p>
      <p>The actions are then processed simultaneously and the turn is resolved.</p>
      <p>There are two types of damaging moves in this game: <u>Physical</u> moves and <u>Energy</u> moves.</p>
      The default Attack action is a physical move. Power-ups are considered energy moves. 
      <h3>Attack</h3>
      <button style={{ color: "black", border: "2px solid black", backgroundColor: "rgb(193, 37, 37)", position: "fixed" }} onClick={() => navigate("/")}>Back to Home</button>
    </div>
  )
}
