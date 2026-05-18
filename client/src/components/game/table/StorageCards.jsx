import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { groupCardsByKey } from "../../../utils/cards.js";
import { CardFace } from "../cards/CardFace.jsx";

export const StorageCards = ({ cards = [], compact = false, paginate = true }) => {
  const [page, setPage] = useState(0);
  const [slotsPerRow, setSlotsPerRow] = useState(10);
  const containerRef = useRef(null);

  const groups = groupCardsByKey(cards);

  useLayoutEffect(() => {
    if (!paginate) return;
    const cardWidth = compact ? 44 : 54;
    const gap = compact ? 7 : 9;

    const compute = () => {
      const el = containerRef.current;
      if (!el) return;
      const w = el.getBoundingClientRect().width;
      if (w === 0) return;
      setSlotsPerRow(Math.max(2, Math.floor((w + gap) / (cardWidth + gap))));
    };

    compute();
    const ro = new ResizeObserver(compute);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setPage(0);
  }, [slotsPerRow]);

  const needsPagination = paginate && groups.length > slotsPerRow;
  const cardsPerPage = needsPagination ? slotsPerRow - 1 : groups.length;
  const totalPages = needsPagination ? Math.ceil(groups.length / cardsPerPage) : 1;
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const hasPrev = needsPagination && safePage > 0;
  const hasNext = needsPagination && safePage < totalPages - 1;
  const visible = needsPagination
    ? groups.slice(safePage * cardsPerPage, (safePage + 1) * cardsPerPage)
    : groups;

  return (
    <div ref={containerRef} className={`storage-card-grid ${compact ? "compact-storage-cards" : ""}`}>
      {groups.length === 0 ? (
        <p className="empty-storage">No resources stored yet.</p>
      ) : (
        <>
          {hasPrev && (
            <button className="storage-nav-btn" onClick={() => setPage(safePage - 1)}>&#8249;</button>
          )}
          {visible.map(({ card, count }) => (
            <article className="storage-stack-card" key={card.key} title={`${card.name} × ${count}`}>
              <div className="stack-shadow stack-shadow-one" />
              {count > 1 && <div className="stack-shadow stack-shadow-two" />}
              <CardFace card={card} compact />
              <span className="storage-count-badge">×{count}</span>
            </article>
          ))}
          {hasNext && (
            <button className="storage-nav-btn" onClick={() => setPage(safePage + 1)}>&#8250;</button>
          )}
        </>
      )}
    </div>
  );
};
