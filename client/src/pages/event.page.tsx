import { useParams } from '@solidjs/router';

import { data } from 'src/data';
import { assert, defined } from 'src/utils/assert';

export function Event() {
  const { eventId } = useParams();
  assert(typeof eventId === 'string');

  const event = () => {
    return defined(data.events.get(eventId));
  };

  return <>Event {event().name}</>;
}
