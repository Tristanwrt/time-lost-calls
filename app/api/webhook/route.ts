import { NextRequest, NextResponse } from "next/server";
import { addEvent, normalizeMeetingPayload } from "@/lib/webhook-store";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature =
      req.headers.get("x-webhook-signature") ||
      req.headers.get("svix-signature") ||
      req.headers.get("x-signature") ||
      null;

    let payload: unknown;
    try {
      payload = JSON.parse(body);
    } catch {
      payload = body;
    }

    const obj = (payload && typeof payload === "object" ? payload : {}) as Record<
      string,
      unknown
    >;
    const eventType =
      (obj.event_type as string) ||
      (obj.type as string) ||
      (obj.event as string) ||
      "unknown";

    let meeting = null;
    if (
      eventType === "meeting.completed" ||
      eventType === "meeting.ended" ||
      eventType === "transcription.completed"
    ) {
      meeting = normalizeMeetingPayload(payload);
    }

    addEvent({
      id:
        (obj.event_id as string) ||
        `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      receivedAt: new Date().toISOString(),
      eventType,
      raw: payload,
      meeting,
    });

    console.log("[webhook] received", {
      ts: new Date().toISOString(),
      eventType,
      hasMeeting: Boolean(meeting),
      signature,
    });

    return NextResponse.json({ ok: true, received: true, eventType });
  } catch (err) {
    console.error("[webhook] error", err);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Time Lost Calls webhook endpoint. POST your events here.",
    events: [
      "meeting.completed",
      "meeting.started",
      "bot.failed",
      "meeting.status_change",
    ],
    inspect: "/live",
  });
}
