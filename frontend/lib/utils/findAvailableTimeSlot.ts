// ✅ STEP 1: Drop this helper function in /lib/utils/findAvailableTimeSlot.ts

import moment from "moment-timezone";

export type PreferredTimeWindow = "morning" | "afternoon" | "evening" | "any";

export function findAvailableTimeSlot({
  events,
  durationMinutes,
  bufferMinutes = 30,
  timeZone,
  preferredTimeWindow = "any",
}: {
  events: { start: string; end: string }[];
  durationMinutes: number;
  bufferMinutes?: number;
  timeZone: string;
  preferredTimeWindow?: PreferredTimeWindow;
}): { start: Date; end: Date } | null {
  const now = moment.tz(timeZone).add(30, "minutes").startOf("minute");
  const lunchStart = moment.tz(timeZone).hour(12).minute(0);
  const lunchEnd = moment.tz(timeZone).hour(13).minute(0);

  const windows: Record<PreferredTimeWindow, [number, number]> = {
    morning: [8, 12],
    afternoon: [12, 17],
    evening: [17, 21],
    any: [8, 21],
  };

  const [startHour, endHour] = windows[preferredTimeWindow];
  const windowStart = moment.tz(timeZone).hour(startHour).minute(0).max(now);
  const windowEnd = moment.tz(timeZone).hour(endHour).minute(0);

  const busy = events.map(e => ({
    start: moment.tz(e.start, timeZone).subtract(bufferMinutes, "minutes"),
    end: moment.tz(e.end, timeZone).add(bufferMinutes, "minutes"),
  }));

  for (
    let slotStart = windowStart.clone();
    slotStart.isBefore(windowEnd);
    slotStart.add(15, "minutes")
  ) {
    const slotEnd = slotStart.clone().add(durationMinutes, "minutes");
    if (slotEnd.isAfter(windowEnd)) break;

    const overlapsLunch =
      slotStart.isBefore(lunchEnd) && slotEnd.isAfter(lunchStart);

    const conflicts = busy.some(
      b => slotStart.isBefore(b.end) && slotEnd.isAfter(b.start)
    );

    if (!conflicts && !overlapsLunch) {
      return { start: slotStart.toDate(), end: slotEnd.toDate() };
    }
  }

  return null;
}
