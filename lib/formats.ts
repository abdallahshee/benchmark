import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = "Africa/Nairobi";

// A report date is a calendar day with no time zone. Drizzle returns it as midnight
// UTC, so format it as UTC. A local-time format could show the wrong day on a server
// in a negative-offset time zone.
export const formatDate = (d: Date | string) => dayjs.utc(d).format("DD MMM YYYY");

// Timestamps are real moments in time, so show them in the site's time zone.
export const formatDateTime = (d: Date | string) =>
  dayjs(d).tz(TZ).format("DD MMM YYYY, HH:mm");


// Time of day in the site's time zone. Accepts a Date, an ISO string or epoch ms.
export const formatTime = (d: Date | string | number) => dayjs(d).tz(TZ).format("HH:mm");

export function displayName(p: { firstName: string | null; lastName: string | null }) {
  return [p.firstName, p.lastName].filter(Boolean).join(" ") || "—";
}