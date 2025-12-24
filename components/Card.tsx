
import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; className?: string, title?: string, action?: React.ReactNode }> = ({ children, className, title, action }) => {
  return (
    <div className={`fot-card ${className || ''}`}>
      {title && (
          <div className="px-5 py-4 border-b border-[var(--fot-border)] flex justify-between items-center bg-white/5">
              <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
              {action && <div>{action}</div>}
          </div>
      )}
      <div className="p-5 text-[var(--fot-text-secondary)]">
        {children}
      </div>
    </div>
  );
};
