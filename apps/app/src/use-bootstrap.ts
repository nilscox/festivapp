import type { BootstrapResponse } from '@festivapp/contracts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export function useBootstrapQuery() {
  return useQuery({
    queryKey: ['bootstrap'],
    queryFn: fetchBootstrap,
    select: selectBootstrap,
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

function selectBootstrap({ tenant, locations, participants, sessions }: BootstrapResponse) {
  const locationById = new Map(locations.map((location) => [location.id, location]));

  const participantsById = new Map(participants.map((participant) => [participant.id, participant]));

  return {
    tenant,
    locations: locations.toSorted((a, b) => a.position - b.position),
    sessions: sessions
      .map((session) => ({
        ...session,
        location: locationById.get(session.locationId)!,
        participants: session.participantIds.map((id) => participantsById.get(id)!),
      }))
      .toSorted((a, b) => a.startsAt.localeCompare(b.startsAt)),
  };
}

export function useTenant() {
  return useBootstrap().tenant;
}

export function useSession(id: string) {
  const { sessions } = useBootstrap();

  return useMemo(() => {
    return sessions.find((session) => session.id === id);
  }, [sessions, id]);
}

export function useSessionLocation(id: string) {
  return useSession(id)!.location;
}

export function useSessionParticipants(id: string) {
  return useSession(id)!.participants;
}
