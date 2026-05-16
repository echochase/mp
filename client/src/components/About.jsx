import { useNavigate } from "react-router-dom";
import "../styles/about.css";

export const About = () => {
  const navigate = useNavigate();

  return (
    <div className="about-description">
      <h1 className="title">Machiavellian Pursuits</h1>
      <div className="subtitle">A tactical card game about building wealth, cutting deals, and outmanoeuvring the table.</div>

      <h2>Objective</h2>
      <p>
        Score points by completing private goal cards. The first player to reach <b>10 points</b> wins.
        If the goal deck runs out, the game ends immediately and the player with the most points wins.
        If multiple players are tied for the highest score, the game ends in a tie.
      </p>

      <h2>Setup</h2>
      <p>
        Each player begins with <b>7 playing cards</b> and <b>2 private goal cards</b>. Playing cards include
        resources, action cards, reactions, and trade tools. Goal cards describe the conditions needed to score points.
      </p>

      <h2>Turn Structure</h2>
      <p>On your turn, you draw 1 playing card, then decide how to build toward your goals.</p>
      <ul className="stages-list">
        <li><b>Store resources:</b> Move resource cards from your hand into your storage area.</li>
        <li><b>Play one action:</b> Use an action card to steal, inspect, disrupt, renew, or manipulate goals.</li>
        <li><b>Trade:</b> Offer up to 4 cards to another player or to the table. Some trades can be protected with Binding Contract.</li>
        <li><b>Reroll one goal:</b> Once per turn, discard one of your goals and draw a replacement.</li>
        <li><b>End turn:</b> If you played no action card, you draw 1 extra card. Then discard down to 8 cards if needed.</li>
      </ul>

      <h2>Resources and Storage</h2>
      <p>
        Most goals require resources in your storage, such as <b>Workforce</b>, <b>Candy</b>, <b>Money</b>,
        <b> Wood</b>, <b>Land</b>, and <b>Steel</b>. Rare resources like <b>Gold</b> and <b>Diamond</b> can unlock
        higher-value goals. Stored resources stay visible to the table and can be targeted by some action cards.
      </p>

      <h2>Actions and Reactions</h2>
      <p>
        Action cards are powerful one-off effects. Most actions open a short reaction window where opponents can respond
        with cards like <b>I Think Not</b> or <b>Absolutely Not</b>. If no reaction cancels the action, it resolves.
      </p>

      <h2>Trading</h2>
      <p>
        Trades let players exchange cards from hand. After an unprotected trade is accepted, the trading players may have
        a brief chance to use <b>It's a Scam</b>. A <b>Binding Contract</b> protects the trade and prevents scams.
      </p>

      <h2>Completing Goals</h2>
      <p>
        Most goals complete automatically when their condition is met. Some special goals, such as <b>Investor</b> and
        <b> Action-Ready</b>, require you to open a completion interface and choose exactly how to complete them.
      </p>

      <button className="return-to-menu" onClick={() => navigate("/")}>Back to Home</button>
    </div>
  );
};
