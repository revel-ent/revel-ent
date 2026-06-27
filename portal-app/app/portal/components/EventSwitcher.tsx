'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import type { EventRecord } from '@/lib/mock-data';

export default function EventSwitcher({
  currentEventId,
  events
}: {
  currentEventId: string | null;
  events: EventRecord[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeEventId, setActiveEventId] = useState(currentEventId);

  if (events.length <= 1) return null;

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newEventId = e.target.value;
    if (newEventId === activeEventId) return;

    setActiveEventId(newEventId);

    const res = await fetch('/api/auth/switch-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: newEventId })
    });

    if (!res.ok) {
      setActiveEventId(currentEventId);
      return;
    }

    startTransition(() => {
      router.push('/portal');
      router.refresh();
    });
  }

  return (
    <div className="event-switcher">
      <span className="event-switcher-label">Event</span>
      <select
        value={activeEventId || ''}
        onChange={handleChange}
        disabled={isPending}
        className="event-switcher-select"
      >
        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.code}
          </option>
        ))}
      </select>
    </div>
  );
}
