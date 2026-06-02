'use client';

import { ChevronDownIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from 'src/app/admin/components/button';
import { Artist, Location } from 'src/database/model';
import { Event } from 'src/database/model';

import { EventRow } from './event-row';

type LocationSectionProps = {
  location: Location;
  events: (Event & { artists: Artist[] })[];
  allArtists: Artist[];
  festivalId: string;
};

export function LocationSection({
  location,
  events,
  allArtists,
  festivalId,
}: LocationSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [pendingNewEvents, setPendingNewEvents] = useState<string[]>([]);

  const handleAddEvent = () => {
    const newId = Math.random().toString(36);
    setPendingNewEvents([...pendingNewEvents, newId]);
  };

  const removePendingEvent = (id: string) => {
    setPendingNewEvents(pendingNewEvents.filter((e) => e !== id));
  };

  return (
    <section className="mb-6">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="row items-center gap-2 cursor-pointer py-3 border-b border-gray-300"
      >
        <ChevronDownIcon
          className="size-5 transition-transform"
          style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        />
        <h2 className="text-lg font-semibold">{location.label}</h2>
        <span className="text-sm text-dim">({events.length} events)</span>
      </div>

      {isOpen && (
        <div className="py-4 col gap-3">
          {events.length === 0 && pendingNewEvents.length === 0 && (
            <p className="text-sm text-dim">No events yet for this location.</p>
          )}

          {events.map((event) => (
            <EventRow
              key={event.id}
              festivalId={festivalId}
              locationId={location.id}
              allArtists={allArtists}
              event={event}
            />
          ))}

          {pendingNewEvents.map((id) => (
            <div key={id} className="relative">
              <EventRow
                festivalId={festivalId}
                locationId={location.id}
                allArtists={allArtists}
              />
              <button
                type="button"
                onClick={() => removePendingEvent(id)}
                className="absolute top-2 right-2 px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          ))}

          <Button variant="ghost" onClick={handleAddEvent} className="self-start">
            + Add event
          </Button>
        </div>
      )}
    </section>
  );
}
