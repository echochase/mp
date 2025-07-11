import { useMediaQuery, useTheme } from "@mui/material";
import "../styles/players.css";

export const Players = ({ players, you, totalDeclarations, stage, blockAnimations }) => {
  const isMobile = useMediaQuery('(max-width:600px)');
  const theme = useTheme();
  const radiusFactor = isMobile ? 0.3 : 0.45;
  const playerCount = players.length;
  const radius = 350 + (playerCount - 2) * 10;
  const declarationsMap = Object.fromEntries(totalDeclarations);

  const tileText = theme.palette.text.primary;
  const youColor = theme.palette.primary.main;
  const eliminatedColor = theme.palette.grey[700];

  return (
    <div
      className="players-circle"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        marginTop: `${-300 + playerCount * 100 - (playerCount - 3) * 75}px`,
        marginBottom: `${playerCount * 20}px`
      }}
    >
      {players.map((player, index) => {
        const { name, hp } = player;

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
        if (stage === "execution") {
          className += " dec"
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
              color: name === you ? youColor : hp <= 0 ? eliminatedColor : tileText,
              borderRadius: "10px",
              padding: "8px",
              minWidth: "80px",
              textAlign: "center",
              boxShadow: theme.shadows[3]
            }}
          >
            {blockAnimations?.[name] && (
              <div className={`animation-pulse animation-${blockAnimations[name]}`} />
            )}
            <div>{name}</div>
            <div className="healthbar">
              {[0, 1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className={`hp-segment ${i < hp ? 'filled' : 'empty'}`}
                />
              ))}
            </div>
            {stage === "execution" && declarationsMap[name] && (
              <div className="player-declarations" style={{ marginTop: "4px", fontSize: "12px" }}>
                {declarationsMap[name].map((a, i) => (
                  <div key={i}>{a}</div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
