import { useNavigate } from "react-router-dom";
import "../styles/card-list.css";

/* ── Main Cards ── */
const cardModules = import.meta.glob("/src/assets/cards/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});

const cards = Object.entries(cardModules).map(([path, src]) => ({
  src,
  name: path
    .split("/")
    .pop()
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]/g, " "),
}));

/* ── Goal Cards ── */
const goalCardModules = import.meta.glob("/src/assets/goal-cards/*.{png,jpg,jpeg,webp}", {
  eager: true,
  import: "default",
});

const goalCards = Object.entries(goalCardModules).map(([path, src]) => ({
  src,
  name: path
    .split("/")
    .pop()
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]/g, " "),
}));

export const CardList = () => {
  const navigate = useNavigate();

  return (
    <div className="card-list-page">
      {/* ── Main Header ── */}
      <header className="card-list-header">
        <span className="header-eyebrow">Complete Roster</span>
        <h1>Card Collection</h1>
        <span className="header-count">{cards.length} cards</span>
      </header>

      {/* ── Main Cards ── */}
      <section className="collection-section">
        <div className="card-grid">
          {cards.map((card, index) => (
            <div className="card-item" key={index} style={{ "--i": index }}>
              <div className="card-inner">
                <img src={card.src} alt={card.name} className="card-image" />

                <div className="card-overlay">
                  <span className="card-name">{card.name}</span>
                </div>

                <div className="card-shine" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Goal Cards Section ── */}
      <section className="collection-section goal-section">
        <div className="section-heading">
          <span className="section-eyebrow">Special Objectives</span>
          <h2>Goal Cards</h2>
          <span className="section-count">{goalCards.length} cards</span>
        </div>

        <div className="card-grid">
          {goalCards.map((card, index) => (
            <div
              className="card-item goal-card-item"
              key={index}
              style={{ "--i": index }}
            >
              <div className="card-inner">
                <img src={card.src} alt={card.name} className="card-image" />

                <div className="card-overlay">
                  <span className="card-name">{card.name}</span>
                </div>

                <div className="card-shine" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Back Button ── */}
      <button className="back-button" onClick={() => navigate(-1)}>
        ← Back
      </button>
    </div>
  );
};