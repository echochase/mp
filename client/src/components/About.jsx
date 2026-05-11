import { useNavigate } from "react-router-dom";
import "../styles/about.css";

export const About = () => {
  const navigate = useNavigate();

  return (
    <div className="about-description">
      <h1 className="title">Double Bluff</h1>
      <div className="subtitle">A web game about trickery and deception.</div>

      <h2>Goal</h2>
      <p>To eliminate all other players and <b>become the last player standing</b>.</p>

      <h2>Recommended Player Count</h2>
      <p>Double Bluff is best played with 4-6 players, but can support a minimum of 2.</p>

      <h2>Gameplay</h2>
      <p>Each player starts with <b>5 hitpoints</b>.</p>
      <p>
        They may choose between 3 default actions:{" "}
        <b>Attack</b>, <b>Defend</b>, and <b>Energy Shield</b>.
      </p>
      <p>
        Each turn, players receive a random power-up from:{" "}
        <b>Special Attack</b>, <b>Cruelty</b>, <b>Prowess</b>, and <b>Heal</b>.
      </p>
      <p>
        Turns are split into two phases: the{" "}
        <b>Declaration Stage</b> and the <b>Execution Stage</b>.
      </p>
      <ul className="stages-list">
        <li>
          <b>Declaration Stage:</b> Each player declares 3 actions they intend to
          take this turn.
        </li>
        <li>
          <b>Execution Stage:</b> Once declarations are revealed, each player chooses
          up to 2 of their declared actions to execute. Actions are processed
          simultaneously.
        </li>
      </ul>

      <p>
        There are two types of damaging moves in this game:{" "}
        <u>Physical</u> moves and <u>Energy</u> moves.
      </p>
      <p>
        The default <b>Attack</b> action is a <u>Physical</u> move, while power-ups
        are classified as <u>Energy</u> moves.
      </p>
      <p>While both can be declared simultaneously, <b>Defend</b> and <b>Energy Shield</b> cannot be executed in the same turn.</p>

      <h3>Attack</h3>
      <p>A physical offensive move that deals 1 hitpoint of damage from its target if left unblocked.</p>

      <h3>Defend</h3>
      <p>Blocks all incoming physical damage, like attacks.</p>

      <h3>Energy Shield</h3>
      <p>Blocks all incoming energy damage, including power-ups like Special Attack and Cruelty.</p>

      <h3>Special Attack</h3>
      <p>A energy-based offensive move that deals 2 hitpoints of damage from its target if left unblocked.</p>

      <h3>Cruelty</h3>
      <p>A rare and powerful energy-based offensive move. Instantly disintegrates its target if left unblocked.</p>
      
      <h3>Prowess</h3>
      <p>A rare power-up that reflects all damage of incoming attacks from a single target.</p>

      <h3>Heal</h3>
      <p>Recovers 2 hitpoints for the user.</p>

      <button className="return-to-menu" onClick={() => navigate("/")}>
        Back to Home
      </button>
    </div>
  );
};
