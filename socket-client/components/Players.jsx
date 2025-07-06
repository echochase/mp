import { useMediaQuery } from "@mui/material";
import "../styles/players.css";

export const Players = ({ players, you, totalDeclarations, stage, blockAnimations }) => {
  const isMobile = useMediaQuery('(max-width:600px)');
  const radiusFactor = isMobile ? 0.3 : 0.45;
  const playerCount = players.length;
  const radius = 350 + (playerCount - 2) * 10;

  const declarationsMap = Object.fromEntries(totalDeclarations);

  return (
    <div className="players-circle" style={{ position: "relative", width: "100%", height: "100%" }}>
      {players.map((player, index) => {
        const { name, hp } = player;
        
        // Calculate dynamic angle in radians
        let angleRad = (2 * Math.PI * index) / playerCount;
        if (playerCount > 2) angleRad += Math.PI / 6;
        const x = radius * radiusFactor * Math.cos(angleRad);
        const y = radius * radiusFactor * Math.sin(angleRad);

        let className = "player-tile";
        if (name === you) {
          className += " you";
        } else {
          className += " other";
        }
        if (hp <= 0) {
          className += " eliminated";
        }

        return (
          <div
            key={name}
            className={className}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
              transformOrigin: "center",
            }}
          >
            {blockAnimations?.[name] && (
              <div className={`animation-pulse animation-${blockAnimations[name]}`} />
            )}
            <div>{name}</div>
            <div className="healthbar">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className={`hp-segment ${i < hp ? 'filled' : 'empty'}`} />
              ))}
            </div>
            {stage === "execution" && declarationsMap[name] && (
              <div className="player-declarations">
                {declarationsMap[name].map((a, i) => (
                  <div key={i} style={{ fontSize: "12px" }}>
                    {a}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
