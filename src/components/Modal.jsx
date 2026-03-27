import React, { useEffect } from 'react';


export default function Modal({ open, onClose, title, children, footer, size }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal-box${size === 'lg' ? ' lg' : ''}`}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button onClick={onClose}><i className="fa-solid fa-xmark" /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}