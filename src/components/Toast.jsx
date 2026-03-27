import React from 'react';
import { useApp } from '../context/AppContext.jsx';

const ICONS = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };

export default function Toast() {
  const { toasts } = useApp();
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <i className={`fa-solid ${ICONS[t.type] || ICONS.info}`} />
          {t.msg}
        </div>
      ))}
    </div>
  );
}