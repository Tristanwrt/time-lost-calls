import { NextRequest, NextResponse } from "next/server";

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

    console.log("[webhook] received", {
      ts: new Date().toISOString(),
      signature,
      contentType: req.headers.get("content-type"),
      payload,
    });

    return NextResponse.json({ ok: true, received: true });
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
  });
}
