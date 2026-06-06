'use client';

import { PlusIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from 'src/app/admin/components/button';
import { Card } from 'src/app/admin/components/card';
import { Artist } from 'src/database/model';

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
