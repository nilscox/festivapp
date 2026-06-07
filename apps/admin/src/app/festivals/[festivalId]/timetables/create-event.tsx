'use client';

import { Artist } from '@festivapp/persistence';
import { PlusIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/button';
import { Card } from '@/components/card';

import { EventForm, EventFormSubmit } from './event-form';

export function CreateEvent({
  festivalId,
  locationId,
  artists,
}: {
  festivalId: string;
  locationId: string;
  artists: Artist[];
}) {
  const [showForm, setShowForm] = useState(false);

  if (!showForm) {
    return (
      <Button left={<PlusIcon className="size-4" />} onClick={() => setShowForm(true)}>
        Add event
      </Button>
    );
  }

  return (
    <Card className="p-4">
      <EventForm
        festivalId={festivalId}
        locationId={locationId}
        artists={artists}
        actions={
          <div className="row items-center gap-4">
            <EventFormSubmit />
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        }
        onSuccessAction={() => setShowForm(false)}
      />
    </Card>
  );
}
