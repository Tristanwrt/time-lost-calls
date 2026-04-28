import type { Meeting } from "./types";

const RECURRING_TITLES = [
  "Daily Standup",
  "Weekly All-Hands",
  "Sprint Planning",
  "Engineering Sync",
  "Product Roadmap Review",
  "Marketing Sync",
];

const ONE_OFF_TITLES = [
  "Q2 Strategy Brainstorm",
  "Budget Review",
  "Client Onboarding Call",
  "Hiring Loop Debrief",
  "Vendor Pitch — DataCorp",
  "Architecture Review",
  "Performance Review",
  "Crisis Sync (don't panic)",
  "Kickoff: New Landing Page",
  "Customer Discovery Call",
  "Investor Update Prep",
  "Team Retrospective",
];

const ONE_ON_ONE_TITLES = [
  "1:1 with Sarah",
  "1:1 with Marc",
  "1:1 with Priya",
  "Coffee chat with Alex",
];

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateDemoMeetings(seed = 42): Meeting[] {
  const rand = seeded(seed);
  const meetings: Meeting[] = [];
  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - 30);
  periodStart.setHours(0, 0, 0, 0);

  let id = 0;

  // Recurring meetings
  // Daily standup → every weekday for 30 days
  for (let i = 0; i < 30; i++) {
    const d = new Date(periodStart);
    d.setDate(d.getDate() + i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    d.setHours(9, 30, 0, 0);
    const end = new Date(d);
    end.setMinutes(end.getMinutes() + 15);
    meetings.push({
      id: `m-${id++}`,
      title: "Daily Standup",
      start: d.toISOString(),
      end: end.toISOString(),
      durationMinutes: 15,
      attendeesCount: 8,
      organizer: "lead@acme.io",
      isRecurring: true,
      isOneOnOne: false,
    });
  }

  // Weekly All-Hands → Monday 10am, 60 min, 35 people
  for (let i = 0; i < 30; i++) {
    const d = new Date(periodStart);
    d.setDate(d.getDate() + i);
    if (d.getDay() !== 1) continue;
    d.setHours(10, 0, 0, 0);
    const end = new Date(d);
    end.setMinutes(end.getMinutes() + 60);
    meetings.push({
      id: `m-${id++}`,
      title: "Weekly All-Hands",
      start: d.toISOString(),
      end: end.toISOString(),
      durationMinutes: 60,
      attendeesCount: 35,
      organizer: "ceo@acme.io",
      isRecurring: true,
      isOneOnOne: false,
    });
  }

  // Sprint Planning → every 2 weeks, 90 min, 12 people
  for (let i = 0; i < 30; i += 14) {
    const d = new Date(periodStart);
    d.setDate(d.getDate() + i);
    d.setHours(14, 0, 0, 0);
    const end = new Date(d);
    end.setMinutes(end.getMinutes() + 90);
    meetings.push({
      id: `m-${id++}`,
      title: "Sprint Planning",
      start: d.toISOString(),
      end: end.toISOString(),
      durationMinutes: 90,
      attendeesCount: 12,
      organizer: "pm@acme.io",
      isRecurring: true,
      isOneOnOne: false,
    });
  }

  // Engineering Sync → weekly, 30 min, 10 people
  for (let i = 0; i < 30; i++) {
    const d = new Date(periodStart);
    d.setDate(d.getDate() + i);
    if (d.getDay() !== 3) continue;
    d.setHours(15, 0, 0, 0);
    const end = new Date(d);
    end.setMinutes(end.getMinutes() + 30);
    meetings.push({
      id: `m-${id++}`,
      title: "Engineering Sync",
      start: d.toISOString(),
      end: end.toISOString(),
      durationMinutes: 30,
      attendeesCount: 10,
      organizer: "eng-lead@acme.io",
      isRecurring: true,
      isOneOnOne: false,
    });
  }

  // 1:1s — every 2 weeks, 30 min
  for (const name of ONE_ON_ONE_TITLES) {
    for (let i = 0; i < 30; i += 7) {
      const d = new Date(periodStart);
      d.setDate(d.getDate() + i + Math.floor(rand() * 4));
      d.setHours(11 + Math.floor(rand() * 4), 0, 0, 0);
      const dur = 30;
      const end = new Date(d);
      end.setMinutes(end.getMinutes() + dur);
      meetings.push({
        id: `m-${id++}`,
        title: name,
        start: d.toISOString(),
        end: end.toISOString(),
        durationMinutes: dur,
        attendeesCount: 2,
        organizer: "manager@acme.io",
        isRecurring: true,
        isOneOnOne: true,
      });
    }
  }

  // One-off meetings sprinkled across the month
  for (let i = 0; i < 12; i++) {
    const dayOffset = Math.floor(rand() * 30);
    const d = new Date(periodStart);
    d.setDate(d.getDate() + dayOffset);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    d.setHours(10 + Math.floor(rand() * 7), Math.floor(rand() * 4) * 15, 0, 0);
    const title = ONE_OFF_TITLES[Math.floor(rand() * ONE_OFF_TITLES.length)];
    const dur = [30, 45, 60, 60, 90, 120][Math.floor(rand() * 6)];
    const attendees = 3 + Math.floor(rand() * 14);
    const end = new Date(d);
    end.setMinutes(end.getMinutes() + dur);
    meetings.push({
      id: `m-${id++}`,
      title,
      start: d.toISOString(),
      end: end.toISOString(),
      durationMinutes: dur,
      attendeesCount: attendees,
      organizer: "someone@acme.io",
      isRecurring: false,
      isOneOnOne: false,
    });
  }

  return meetings;
}

// Helpful to silence unused import lint; not exported in ICS path.
export const _unused = { RECURRING_TITLES };
