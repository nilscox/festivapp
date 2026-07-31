import type { BootstrapResponse, Location, Participant, Session } from '@festivapp/contracts';
import { defined } from '@festivapp/utils';
import { useQuery } from '@tanstack/react-query';

export type ResolvedSession = Session & {
  location: Location;
  participants: Participant[];
};

export function useBootstrapQuery() {
  return useQuery({
    queryKey: ['bootstrap'],
    queryFn: fetchBootstrap,
    select: selectBootstrap,
    refetchOnWindowFocus: true,
  });
}

export function useBootstrap() {
  const { data } = useBootstrapQuery();

  if (!data) {
    throw new Error('No bootstrap data');
  }

  return data;
}

async function fetchBootstrap(): Promise<BootstrapResponse> {
  const response = await fetch('/api/bootstrap');

  if (!response.ok) {
    throw new Error(`bootstrap failed: ${response.status}`);
  }

  return (await response.json()) as BootstrapResponse;
}

function selectBootstrap({ tenant, locations, participants, sessions, messages, pushPublicKey }: BootstrapResponse) {
  const locationById = new Map(locations.map((location) => [location.id, location]));

  const participantsById = new Map(participants.map((participant) => [participant.id, participant]));

  return {
    tenant,
    messages,
    pushPublicKey,
    participants,
    locations: locations.toSorted((a, b) => a.position - b.position),
    sessions: sessions
      .map(
        (session): ResolvedSession => ({
          ...session,
          location: defined(locationById.get(session.locationId)),
          participants: session.participantIds.map((id) => defined(participantsById.get(id))),
        }),
      )
      .toSorted((a, b) => a.startsAt.localeCompare(b.startsAt)),
  };
}

export function useTenant() {
  return useBootstrap().tenant;
}

export function useMessages() {
  return useBootstrap().messages;
}

export function usePushPublicKey() {
  return useBootstrap().pushPublicKey;
}
