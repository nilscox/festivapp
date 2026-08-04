import type { SessionType } from '@festivapp/contracts';

// prettier-ignore
export const sessionTypes: Record<SessionType, { label: string; badge: string; dot: string }> = {
  live:     { label: 'Live',     badge: 'text-[#36b30c] bg-[#36b30c]/10', dot: 'bg-[#36b30c]' },
  dj_set:   { label: 'DJ set',   badge: 'text-[#2563eb] bg-[#2563eb]/10', dot: 'bg-[#2563eb]' },
  talk:     { label: 'Talk',     badge: 'text-[#b208af] bg-[#b208af]/10', dot: 'bg-[#b208af]' },
  workshop: { label: 'Workshop', badge: 'text-[#d97706] bg-[#d97706]/10', dot: 'bg-[#d97706]' },
  other:    { label: 'Other',    badge: 'text-[#424242] bg-[#424242]/10', dot: 'bg-[#424242]' },
};
