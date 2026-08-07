import type { Location, Participant, Session, SessionInput, SessionType } from '@festivapp/contracts';
import { has } from '@festivapp/utils';
import { revalidateLogic } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { TriangleAlert } from 'lucide-react';
import * as z from 'zod/mini';

import { Button } from '../../components/button.tsx';
import { Form, SubmitButton, useAppForm } from '../../components/form/form.tsx';
import { api } from '../../lib/api.ts';
import { formatDayKey, formatTime, nextDay, toInstant } from '../../lib/datetime.ts';
import { submitToApi } from '../../lib/errors.ts';
import { listSessionsOptions } from '../../lib/queries.ts';
import { sessionSlotLabel, slotsOverlap, type ScheduleSession } from '../../lib/schedule.ts';
import { sessionTypes, sessionTypeValues } from './session-types.ts';

const typeOptions = sessionTypeValues.map((type) => ({
  value: type,
  label: (
    <span className="row items-center gap-2">
      <span className={clsx('size-2 rounded-xs', sessionTypes[type].dot)} />
      {sessionTypes[type].label}
    </span>
  ),
}));

export function SessionForm({
  session,
  sessions,
  tenantId,
  locations,
  participants,
  timezone,
  onClose,
}: {
  session?: ScheduleSession;
  sessions: ScheduleSession[];
  tenantId: string;
  locations: Location[];
  participants: Participant[];
  timezone: string;
  onClose: () => void;
}) {
  const locationOptions = locations.map((location) => ({
    value: location.id,
    label: location.name,
  }));

  const participantOptions = participants.map((participant) => ({
    value: participant.id,
    label: participant.name,
  }));

  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries(listSessionsOptions(tenantId));

  const createMutation = useMutation({
    mutationFn: (input: SessionInput) => api.post<Session>(`/admin/tenants/${tenantId}/sessions`, input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ([id, input]: [id: string, session: SessionInput]) =>
      api.put<Session>(`/admin/tenants/${tenantId}/sessions/${id}`, input),
    onSuccess: invalidate,
  });

  const form = useAppForm({
    defaultValues: toFormValues(session, locations, timezone),
    validationLogic: revalidateLogic(),
    validators: { onDynamic: schema },
    onSubmit: async ({ value, formApi }) => {
      const input = toInput(value, timezone);

      const saved = await submitToApi(formApi, () => {
        if (!session) {
          return createMutation.mutateAsync(input);
        }

        return updateMutation.mutateAsync([session.id, input]);
      });

      if (saved) {
        onClose();
      }
    },
  });

  return (
    <Form form={form} className="col min-h-0 flex-1">
      <div className="col min-h-0 flex-1 gap-6 overflow-y-auto p-4">
        <form.AppField name="locationId">
          {({ SelectField }) => <SelectField label="Location" items={locationOptions} />}
        </form.AppField>

        <form.AppField name="type">
          {({ SelectField }) => <SelectField label="Type" items={typeOptions} />}
        </form.AppField>

        <form.AppField name="date">
          {({ InputField }) => (
            <InputField label="Date" hint={`Read in the festival's timezone (${timezone}).`} type="date" />
          )}
        </form.AppField>

        <div className="grid gap-6 sm:grid-cols-2">
          <form.AppField name="startsAt">
            {({ InputField }) => <InputField label="Starts at" type="time" />}
          </form.AppField>

          <form.Subscribe selector={(state) => rollsOver(state.values.startsAt, state.values.endsAt)}>
            {(rollsOver) => (
              <form.AppField name="endsAt">
                {({ InputField }) => (
                  <InputField label="Ends at" hint={rollsOver && 'Ends the next day.'} type="time" />
                )}
              </form.AppField>
            )}
          </form.Subscribe>
        </div>

        <form.Subscribe selector={(state) => selectOverlapsWarning(state.values, sessions, session, timezone)}>
          {(warning) => warning && <OverlapWarning warning={warning} />}
        </form.Subscribe>

        <form.AppField name="participantIds" mode="array">
          {({ ArrayField }) => (
            <ArrayField label="People" add="Add people" newItem="">
              {(index) => (
                <form.AppField name={`participantIds[${index}]`}>
                  {({ SelectField }) => <SelectField items={participantOptions} placeholder="Pick someone" />}
                </form.AppField>
              )}
            </ArrayField>
          )}
        </form.AppField>

        <form.Subscribe selector={(state) => solePerson(state.values.participantIds, participants)}>
          {(person) => (
            <>
              <form.AppField name="title">
                {({ InputField }) => <InputField label="Title" placeholder={person?.name ?? 'e.g. Opening ceremony'} />}
              </form.AppField>

              <form.AppField name="description">
                {({ TextareaField }) => (
                  <TextareaField label="Description" rows={5} placeholder={person?.description ?? ''} />
                )}
              </form.AppField>
            </>
          )}
        </form.Subscribe>
      </div>

      <div className="row gap-4 border-t p-4">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancel
        </Button>

        <SubmitButton className="flex-1">{!session ? 'Add session' : 'Save changes'}</SubmitButton>
      </div>
    </Form>
  );
}

const schema = z.object({
  locationId: z.string().check(z.minLength(1, 'A location is required.')),
  type: z.enum(sessionTypeValues),
  date: z.string().check(z.minLength(1, 'A date is required.')),
  startsAt: z.string().check(z.minLength(1, 'A start time is required.')),
  endsAt: z.string().check(z.minLength(1, 'An end time is required.')),
  participantIds: z.array(z.string()),
  title: z.string(),
  description: z.string(),
});

function toFormValues(session: ScheduleSession | undefined, locations: Location[], timezone: string) {
  return {
    locationId: session?.locationId ?? locations[0]?.id ?? '',
    type: session?.type ?? ('live' as SessionType),
    date: session ? formatDayKey(session.startsAt, timezone) : '',
    startsAt: session ? formatTime(session.startsAt, timezone) : '',
    endsAt: session ? formatTime(session.endsAt, timezone) : '',
    participantIds: session?.participantIds ?? [],
    title: session?.title ?? '',
    description: session?.description ?? '',
  };
}

function toInput(values: ReturnType<typeof toFormValues>, timezone: string): SessionInput {
  const endsOn = rollsOver(values.startsAt, values.endsAt) ? nextDay(values.date) : values.date;

  return {
    locationId: values.locationId,
    type: values.type,
    title: values.title,
    description: values.description,
    participantIds: values.participantIds.filter((id) => id !== ''),
    startsAt: toInstant(values.date, values.startsAt, timezone),
    endsAt: toInstant(endsOn, values.endsAt, timezone),
  };
}

// an end at or before the start is a set running past midnight, so it belongs to the next day
function rollsOver(startsAt: string, endsAt: string) {
  return Boolean(startsAt && endsAt) && endsAt <= startsAt;
}

function OverlapWarning({ warning }: { warning: string }) {
  return (
    <output className="row border-warning-line bg-warning/5 text-warning-ink items-start gap-2 rounded-lg border p-3 text-sm">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      <span>Overlaps {warning}.</span>
    </output>
  );
}

function selectOverlapsWarning(
  values: ReturnType<typeof toFormValues>,
  sessions: ScheduleSession[],
  session: ScheduleSession | undefined,
  timezone: string,
  max = 3,
) {
  if (!values.locationId || !values.date || !values.startsAt || !values.endsAt) {
    return undefined;
  }

  const slot = toInput(values, timezone);
  const overlapping = sessions.filter((other) => other.id !== session?.id && slotsOverlap(slot, other));

  if (overlapping.length === 0) {
    return undefined;
  }

  const named = overlapping
    .slice(0, max)
    .map((other) => sessionSlotLabel(other, timezone))
    .join(', ');

  const rest = overlapping.length - max;

  return rest > 0 ? `${named} and ${rest} more` : named;
}

function solePerson(participantIds: string[], participants: Participant[]) {
  const people = participantIds.map((id) => participants.find(has('id', id)));

  return people.length === 1 ? people[0] : undefined;
}
