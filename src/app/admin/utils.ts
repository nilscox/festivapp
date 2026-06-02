import { format } from 'date-fns';

export function formatDateInput(date: Date | null | undefined): string {
  if (!date) {
    return '';
  }

  return format(date, "yyyy-MM-dd'T'HH:mm");
}
