import ICAL from "ical.js";
import type { Meeting } from "./types";

export function parseICS(icsText: string, periodStart: Date, periodEnd: Date): Meeting[] {
  const jcal = ICAL.parse(icsText);
  const comp = new ICAL.Component(jcal);
  const vevents = comp.getAllSubcomponents("vevent");

  const meetings: Meeting[] = [];

  for (const vevent of vevents) {
    const event = new ICAL.Event(vevent);
    const summary = event.summary || "(no title)";
    const attendeesRaw = vevent.getAllProperties("attendee");
    const attendeesCount = attendeesRaw.length;

    // Skip solo events (no attendees other than self)
    if (attendeesCount < 2) continue;

    const isRecurring = event.isRecurring();
    const organizer = vevent.getFirstPropertyValue("organizer") as string | undefined;

    if (isRecurring) {
      // Expand recurring events within the period
      const iter = event.iterator();
      let next;
      let count = 0;
      while ((next = iter.next()) && count < 200) {
        const occStart = next.toJSDate();
        if (occStart > periodEnd) break;
        if (occStart < periodStart) continue;

        const occurrence = event.getOccurrenceDetails(next);
        const occEnd = occurrence.endDate.toJSDate();
        const durationMinutes = Math.round((occEnd.getTime() - occStart.getTime()) / 60000);
        if (durationMinutes <= 0 || durationMinutes > 720) continue;

        meetings.push({
          id: `${event.uid}-${occStart.toISOString()}`,
          title: summary,
          start: occStart.toISOString(),
          end: occEnd.toISOString(),
          durationMinutes,
          attendeesCount,
          organizer: organizer ? cleanMailto(organizer) : undefined,
          isRecurring: true,
          isOneOnOne: attendeesCount === 2,
        });
        count++;
      }
    } else {
      const start = event.startDate.toJSDate();
      const end = event.endDate.toJSDate();
      if (start < periodStart || start > periodEnd) continue;
      const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
      if (durationMinutes <= 0 || durationMinutes > 720) continue;

      meetings.push({
        id: `${event.uid}-${start.toISOString()}`,
        title: summary,
        start: start.toISOString(),
        end: end.toISOString(),
        durationMinutes,
        attendeesCount,
        organizer: organizer ? cleanMailto(organizer) : undefined,
        isRecurring: false,
        isOneOnOne: attendeesCount === 2,
      });
    }
  }

  return meetings;
}

function cleanMailto(s: string): string {
  return s.replace(/^mailto:/i, "");
}
