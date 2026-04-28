import { NextResponse } from "next/server";
import { listEvents, listMeetings } from "@/lib/webhook-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    events: listEvents().slice(0, 50),
    meetings: listMeetings(),
  });
}
