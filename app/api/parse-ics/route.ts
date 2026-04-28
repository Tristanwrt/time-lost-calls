import { NextRequest, NextResponse } from "next/server";
import { parseICS } from "@/lib/ics-parser";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const text = await file.text();

    if (!text.includes("BEGIN:VCALENDAR")) {
      return NextResponse.json(
        { error: "This doesn't look like a valid .ics file. Re-export from Google Calendar." },
        { status: 400 }
      );
    }

    const now = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - 30);
    periodStart.setHours(0, 0, 0, 0);

    const meetings = parseICS(text, periodStart, now);

    return NextResponse.json({ meetings });
  } catch (err) {
    console.error("ICS parse error", err);
    return NextResponse.json(
      { error: "Couldn't parse this file. It might be malformed." },
      { status: 500 }
    );
  }
}
