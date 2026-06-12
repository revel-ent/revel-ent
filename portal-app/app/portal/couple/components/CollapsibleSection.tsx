'use client';

import { useCallback, useEffect, useState } from 'react';

export default function CollapsibleSection({
  id,
  title,
  hint,
  badge,
  defaultOpen = false,
  children
}: {
  id: string;
  title: string;
  hint?: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const openIfTargeted = useCallback(() => {
    if (window.location.hash === `#${id}`) {
      setOpen(true);
    }
  }, [id]);

  useEffect(() => {
    openIfTargeted();
    window.addEventListener('hashchange', openIfTargeted);
    return () => window.removeEventListener('hashchange', openIfTargeted);
  }, [openIfTargeted]);

  return (
    <details
      id={id}
      className="concierge-fold"
      open={open}
      onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}
    >
      <summary className="concierge-fold__summary">
        <span className="concierge-fold__heading">
          <span className="concierge-fold__title">{title}</span>
          {hint ? <span className="concierge-fold__hint">{hint}</span> : null}
        </span>
        <span className="concierge-fold__meta">
          {badge ? <span className="concierge-fold__badge">{badge}</span> : null}
          <span className="concierge-fold__chevron" aria-hidden>
            ▾
          </span>
        </span>
      </summary>
      <div className="concierge-fold__body">{children}</div>
    </details>
  );
}
