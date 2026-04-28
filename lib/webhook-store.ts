// In-process store for webhook events. Survives within a single Fluid Compute
// instance. Good enough for an MVP / demo. For real production, replace with
// Vercel KV / Upstash Redis.

export type StoredEvent = {
  id: string;
  receivedAt: string;
  eventType: string;
  raw: unknown;
  meeting?: NormalizedMeeting | null;
};

export type NormalizedParticipant = {
  name: string;
  speakingSeconds: number;
  isUser?: boolean;
};

export type NormalizedMeeting = {
  meetingId: string;
  title: string;
  platform?: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  participants: NormalizedParticipant[];
  userSpeakingSeconds?: number;
  userName?: string;
  transcriptUrl?: string;
};

const MAX_EVENTS = 200;
const g = globalThis as unknown as { __tlc_events?: StoredEvent[] };
if (!g.__tlc_events) g.__tlc_events = [];

export function addEvent(ev: StoredEvent) {
  g.__tlc_events!.unshift(ev);
  if (g.__tlc_events!.length > MAX_EVENTS) {
    g.__tlc_events!.length = MAX_EVENTS;
  }
}

export function listEvents(): StoredEvent[] {
  return [...(g.__tlc_events ?? [])];
}

export function listMeetings(): NormalizedMeeting[] {
  const events = listEvents();
  const completed = events.filter(
    (e) =>
      e.eventType === "meeting.completed" ||
      e.eventType === "meeting.ended" ||
      e.eventType === "transcription.completed"
  );
  // Deduplicate by meetingId, keep most recent (events are unshifted, so list[0] is newest)
  const seen = new Set<string>();
  const out: NormalizedMeeting[] = [];
  for (const e of completed) {
    if (!e.meeting) continue;
    if (seen.has(e.meeting.meetingId)) continue;
    seen.add(e.meeting.meetingId);
    out.push(e.meeting);
  }
  return out;
}

export function clearEvents() {
  g.__tlc_events = [];
}

/**
 * Try to normalize a Vexa-style payload into our internal Meeting shape.
 * Vexa shape (observed from a real test): { event_type, data: { meeting_id, platform, ... } }
 * For meeting.completed, data should contain participants with speaking time.
 * We accept multiple property names because the exact field can vary.
 */
export function normalizeMeetingPayload(raw: unknown): NormalizedMeeting | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const data = (obj.data ?? obj.payload ?? obj.meeting ?? obj) as Record<string, unknown>;
  if (!data || typeof data !== "object") return null;

  const meetingId =
    (data.meeting_id as string) ||
    (data.meetingId as string) ||
    (data.id as string) ||
    (obj.event_id as string) ||
    `unknown-${Date.now()}`;

  const title =
    (data.title as string) ||
    (data.subject as string) ||
    (data.name as string) ||
    "Untitled meeting";

  const platform = (data.platform as string) || (data.source as string);

  const startedAt =
    (data.started_at as string) ||
    (data.start_time as string) ||
    (data.startedAt as string);
  const endedAt =
    (data.ended_at as string) ||
    (data.end_time as string) ||
    (data.endedAt as string);

  let durationSeconds: number | undefined;
  if (typeof data.duration_seconds === "number") durationSeconds = data.duration_seconds;
  else if (typeof data.duration === "number") durationSeconds = data.duration;
  else if (typeof data.durationMinutes === "number") durationSeconds = data.durationMinutes * 60;
  else if (startedAt && endedAt) {
    const s = new Date(startedAt).getTime();
    const e = new Date(endedAt).getTime();
    if (!isNaN(s) && !isNaN(e) && e > s) durationSeconds = Math.round((e - s) / 1000);
  }

  const rawParticipants = (data.participants ??
    data.attendees ??
    data.speakers ??
    []) as Array<Record<string, unknown>>;

  const participants: NormalizedParticipant[] = Array.isArray(rawParticipants)
    ? rawParticipants.map((p) => {
        const name =
          (p.name as string) ||
          (p.display_name as string) ||
          (p.email as string) ||
          "Unknown";
        let speakingSeconds = 0;
        if (typeof p.speaking_time_seconds === "number") speakingSeconds = p.speaking_time_seconds;
        else if (typeof p.speaking_seconds === "number") speakingSeconds = p.speaking_seconds;
        else if (typeof p.speaking_time === "number") speakingSeconds = p.speaking_time;
        else if (typeof p.speaking_duration === "number") speakingSeconds = p.speaking_duration;
        else if (typeof p.duration === "number") speakingSeconds = p.duration;
        const isUser = Boolean(p.is_user || p.is_self || p.self);
        return { name, speakingSeconds, isUser };
      })
    : [];

  // Find the user — by `is_user` flag, otherwise the participant with the longest speaking time
  // is a guess; we let the page user decide.
  const userParticipant =
    participants.find((p) => p.isUser) ?? null;
  const userSpeakingSeconds = userParticipant?.speakingSeconds;
  const userName = userParticipant?.name;

  const transcriptUrl =
    (data.transcript_url as string) ||
    (data.transcriptUrl as string) ||
    undefined;

  return {
    meetingId,
    title,
    platform,
    startedAt,
    endedAt,
    durationSeconds,
    participants,
    userSpeakingSeconds,
    userName,
    transcriptUrl,
  };
}
