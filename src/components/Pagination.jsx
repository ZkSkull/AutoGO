import { useMemo } from 'react';

export default function Pagination({ page, totalPages, onChange }) {
  const pages = useMemo(() => {
    const items = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) items.push(i);
    return items;
  }, [page, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button
        className="pagination-btn"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <i className="fa-solid fa-chevron-left" />
      </button>
      {pages[0] > 1 && (
        <>
          <button className="pagination-btn" onClick={() => onChange(1)}>1</button>
          {pages[0] > 2 && <span className="pagination-dots">...</span>}
        </>
      )}
      {pages.map(p => (
        <button
          key={p}
          className={`pagination-btn${p === page ? ' active' : ''}`}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="pagination-dots">...</span>}
          <button className="pagination-btn" onClick={() => onChange(totalPages)}>{totalPages}</button>
        </>
      )}
      <button
        className="pagination-btn"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        <i className="fa-solid fa-chevron-right" />
      </button>
    </div>
  );
}