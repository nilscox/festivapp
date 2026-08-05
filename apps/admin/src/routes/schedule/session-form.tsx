import { Form } from '@base-ui/react/form';
import type { Location, Participant, Session, SessionInput, SessionType } from '@festivapp/contracts';
import { get, has } from '@festivapp/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useMemo, useState } from 'react';

import { Button } from '../../components/button.tsx';
import { FieldArray, useFieldArray } from '../../components/field-array.tsx';
import { Field } from '../../components/field.tsx';
import { Input } from '../../components/input.tsx';
import { Select } from '../../components/select.tsx';
import { Textarea } from '../../components/textarea.tsx';
import { api } from '../../lib/api.ts';
import { formatDayKey, formatTime, nextDay, toInstant } from '../../lib/datetime.ts';
import { parseValidationError } from '../../lib/errors.ts';
import { listSessionsOptions } from '../../lib/queries.ts';
import { sessionTypes } from './session-types.ts';

import type { ScheduleSession } from '../../lib/schedule.ts';

type FormValues = {
  locationId: string;
  type: SessionType;
  date: string;
  startsAt: string;
  endsAt: string;
  title: string;
  description: string;
};

const typeOptions = Object.entries(sessionTypes).map(([type, { label, dot }]) => ({
  value: type as SessionType,
  label: (
    <span className="row items-center gap-2">
      <span className={clsx('size-2 rounded-xs', dot)} />
      {label}
    </span>
  ),
}));

export function SessionForm({
  session,
  tenantId,
  locations,
  participants,
  timezone,
  onClose,
}: {
  session?: ScheduleSession;
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

  const peopleFieldArray = useFieldArray(session?.participantIds ?? []);

  const people = peopleFieldArray.fields.map(([, id]) => participants.find(has('id', id)));
  const solePerson = people.length === 1 ? people[0] : undefined;

  const [startsAt, setStartsAt] = useState(session ? formatTime(session.startsAt, timezone) : '');
  const [endsAt, setEndsAt] = useState(session ? formatTime(session.endsAt, timezone) : '');
  const rollsOver = Boolean(startsAt && endsAt) && endsAt <= startsAt;

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

  const pending = createMutation.isPending || updateMutation.isPending;

  const errors = useMemo(() => {
    return parseValidationError(createMutation.error ?? updateMutation.error);
  }, [createMutation.error, updateMutation.error]);

  const handleSubmit = (values: FormValues) => {
    // an end at or before the start is a set running past midnight, so it belongs to the next day
    const endsOn = values.endsAt <= values.startsAt ? nextDay(values.date) : values.date;

    const input: SessionInput = {
      locationId: values.locationId,
      type: values.type,
      title: values.title,
      description: values.description,
      participantIds: people.filter((person) => person !== undefined).map(get('id')),
      startsAt: toInstant(values.date, values.startsAt, timezone),
      endsAt: toInstant(endsOn, values.endsAt, timezone),
    };

    if (!session) {
      createMutation.mutate(input, { onSuccess: onClose });
    } else {
      updateMutation.mutate([session.id, input], { onSuccess: onClose });
    }
  };

  return (
    <Form errors={errors} onFormSubmit={handleSubmit} className="col min-h-0 flex-1">
      <div className="col min-h-0 flex-1 gap-6 overflow-y-auto p-4">
        <Field name="locationId" label="Location">
          <Select defaultValue={session?.locationId ?? locations[0]?.id} items={locationOptions} />
        </Field>

        <Field name="type" label="Type">
          <Select defaultValue={session?.type ?? 'live'} items={typeOptions} />
        </Field>

        <Field name="date" label="Date" hint={`Read in the festival's timezone (${timezone}).`}>
          <Input required type="date" defaultValue={session && formatDayKey(session.startsAt, timezone)} />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field name="startsAt" label="Starts at">
            <Input
              required
              type="time"
              defaultValue={session && formatTime(session.startsAt, timezone)}
              onChange={(event) => setStartsAt(event.target.value)}
            />
          </Field>

          <Field name="endsAt" label="Ends at" hint={rollsOver && 'Ends the next day.'}>
            <Input
              required
              type="time"
              defaultValue={session && formatTime(session.endsAt, timezone)}
              onChange={(event) => setEndsAt(event.target.value)}
            />
          </Field>
        </div>

        <PeopleEditor participants={participants} fieldArray={peopleFieldArray} />

        <Field name="title" label="Title">
          <Input defaultValue={session?.title ?? ''} placeholder={solePerson?.name ?? 'e.g. Opening ceremony'} />
        </Field>

        <Field name="description" label="Description">
          <Textarea rows={5} defaultValue={session?.description ?? ''} placeholder={solePerson?.description ?? ''} />
        </Field>
      </div>

      <div className="row gap-4 border-t p-4">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancel
        </Button>

        <Button type="submit" className="flex-1" disabled={pending}>
          {!session ? 'Add session' : 'Save changes'}
        </Button>
      </div>
    </Form>
  );
}

function PeopleEditor({
  participants,
  fieldArray: { fields, append, remove, update },
}: {
  participants: Participant[];
  fieldArray: FieldArray<string>;
}) {
  const options = participants.map((participant) => ({ value: participant.id, label: participant.name }));

  return (
    <FieldArray
      fields={fields}
      name="participantIds"
      onAdd={() => append('')}
      onRemove={remove}
      label="People"
      add="Add people"
    >
      {(participantId, index) => (
        <Field>
          <Select
            name={`participantIds.${index}`}
            value={participantId}
            onValueChange={(value) => update(index, value ?? '')}
            items={options}
            placeholder="Pick someone"
          />
        </Field>
      )}
    </FieldArray>
  );
}
