import type { Meeting, ScoredMeeting, WasteReport, MeetingCategory, Recommendation } from "./types";

function categorize(m: Meeting): MeetingCategory {
  const t = m.title.toLowerCase();
  if (m.isOneOnOne || t.includes("1:1") || t.includes("1-1") || t.includes("one on one")) return "1:1";
  if (t.includes("standup") || t.includes("daily")) return "standup";
  if (t.includes("all-hands") || t.includes("all hands") || t.includes("townhall") || t.includes("town hall")) return "all-hands";
  if (t.includes("status") || t.includes("update") || t.includes("sync") || t.includes("weekly") || t.includes("monthly")) return "status-update";
  if (t.includes("client") || t.includes("vendor") || t.includes("customer") || t.includes("investor") || t.includes("external")) return "external";
  if (m.durationMinutes >= 60 && m.attendeesCount <= 6) return "deep-dive";
  return "other";
}

/**
 * Heuristic engagement score 0-100. Higher = more likely to be valuable for YOU.
 * Used to estimate "waste" without transcripts.
 */
function scoreEngagement(m: Meeting, category: MeetingCategory): { score: number; reason: string } {
  let score = 60;
  const reasons: string[] = [];

  // Attendee count: more people = less personal speaking time
  if (m.attendeesCount === 2) {
    score += 30;
    reasons.push("1:1 — usually high signal");
  } else if (m.attendeesCount <= 5) {
    score += 10;
    reasons.push("Small group");
  } else if (m.attendeesCount <= 10) {
    score -= 10;
    reasons.push("Medium group — your speaking time drops");
  } else if (m.attendeesCount <= 20) {
    score -= 25;
    reasons.push("Large group — mostly listening");
  } else {
    score -= 40;
    reasons.push("Crowd. You're a spectator, not a participant");
  }

  // Recurring penalty (often inertia, not necessity)
  if (m.isRecurring && category !== "1:1") {
    score -= 15;
    reasons.push("Recurring — high risk of going on autopilot");
  }

  // Duration penalty
  if (m.durationMinutes >= 90) {
    score -= 15;
    reasons.push("Long meeting — diminishing returns after 60 min");
  } else if (m.durationMinutes <= 20 && m.attendeesCount > 5) {
    score -= 10;
    reasons.push("Quick group meeting — usually status updates that could be a Slack message");
  }

  // Category-specific
  if (category === "standup") {
    score -= 20;
    reasons.push("Standups are 80% async-able");
  }
  if (category === "all-hands") {
    score -= 25;
    reasons.push("Could literally be an email");
  }
  if (category === "status-update") {
    score -= 10;
    reasons.push("Status updates love being a doc");
  }
  if (category === "1:1") {
    reasons.push("Direct conversation, you actually talk");
  }
  if (category === "external") {
    score += 15;
    reasons.push("External call — usually higher stakes");
  }
  if (category === "deep-dive") {
    score += 10;
    reasons.push("Small group + long = real work happens");
  }

  score = Math.max(0, Math.min(100, score));
  return { score, reason: reasons[0] ?? "Standard meeting heuristic" };
}

const FUN_VERDICTS = [
  (h: number) => `You spent ${h} hours pretending to listen. That's a part-time hobby.`,
  (h: number) => `${h} hours. You could have learned to juggle. Or quit.`,
  (h: number) => `${h} hours wasted. Your soul filed a complaint to HR.`,
  (h: number) => `${h} hours of "let's circle back". The circle never ends.`,
  (h: number) => `${h} hours. Long enough to grow a beard. Or grow resentful.`,
  (h: number) => `${h} hours. That's like watching The Lord of the Rings extended edition. Twice. With less plot.`,
  (h: number) => `${h} hours. Nobody noticed you turned your camera off mentally.`,
];

export function buildReport(
  meetings: Meeting[],
  hourlyRate: number,
  currency: "EUR" | "USD" = "EUR"
): WasteReport {
  const scored: ScoredMeeting[] = meetings.map((m) => {
    const category = categorize(m);
    const { score, reason } = scoreEngagement(m, category);
    // Waste = inverse of engagement, scaled by duration
    const wasteRatio = (100 - score) / 100;
    const wasteMinutes = Math.round(m.durationMinutes * wasteRatio);
    const wasteCost = (wasteMinutes / 60) * hourlyRate;
    return {
      ...m,
      engagementScore: score,
      wasteMinutes,
      wasteCost,
      reason,
      category,
    };
  });

  const totalMeetings = scored.length;
  const totalMinutes = scored.reduce((s, m) => s + m.durationMinutes, 0);
  const wasteMinutes = scored.reduce((s, m) => s + m.wasteMinutes, 0);
  const productiveMinutes = totalMinutes - wasteMinutes;
  const wastePercentage = totalMinutes ? Math.round((wasteMinutes / totalMinutes) * 100) : 0;
  const totalCost = (totalMinutes / 60) * hourlyRate;
  const wasteCost = (wasteMinutes / 60) * hourlyRate;
  const efficiencyScore = totalMinutes ? Math.round((productiveMinutes / totalMinutes) * 100) : 100;

  // Group recurring titles for top wasters
  const grouped = new Map<string, ScoredMeeting & { occurrences: number; totalDuration: number; totalWasteMinutes: number; totalWasteCost: number }>();
  for (const m of scored) {
    const key = m.isRecurring ? m.title : m.id;
    const existing = grouped.get(key);
    if (existing) {
      existing.occurrences += 1;
      existing.totalDuration += m.durationMinutes;
      existing.totalWasteMinutes += m.wasteMinutes;
      existing.totalWasteCost += m.wasteCost;
    } else {
      grouped.set(key, {
        ...m,
        occurrences: 1,
        totalDuration: m.durationMinutes,
        totalWasteMinutes: m.wasteMinutes,
        totalWasteCost: m.wasteCost,
      });
    }
  }

  const topWasters = Array.from(grouped.values())
    .sort((a, b) => b.totalWasteMinutes - a.totalWasteMinutes)
    .slice(0, 6)
    .map((g) => ({
      ...g,
      durationMinutes: g.totalDuration,
      wasteMinutes: g.totalWasteMinutes,
      wasteCost: g.totalWasteCost,
      attendeesCount: g.attendeesCount,
      title: g.isRecurring ? `${g.title} (×${g.occurrences})` : g.title,
    }));

  // By category
  const cats: MeetingCategory[] = ["standup", "all-hands", "1:1", "deep-dive", "status-update", "external", "other"];
  const byCategory = cats
    .map((category) => {
      const list = scored.filter((m) => m.category === category);
      return {
        category,
        count: list.length,
        wasteMinutes: list.reduce((s, m) => s + m.wasteMinutes, 0),
        wasteCost: list.reduce((s, m) => s + m.wasteCost, 0),
      };
    })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.wasteMinutes - a.wasteMinutes);

  // Recommendations
  const recommendations: Recommendation[] = [];
  const standups = byCategory.find((c) => c.category === "standup");
  if (standups && standups.wasteMinutes > 30) {
    recommendations.push({
      icon: "MessageSquare",
      title: "Make your standups async",
      description: `Replace daily standups with a Slack thread. You'll gain ${formatMinutes(standups.wasteMinutes)} every month and a tiny piece of your soul back.`,
      savedMinutes: standups.wasteMinutes,
      savedCost: standups.wasteCost,
    });
  }
  const allHands = byCategory.find((c) => c.category === "all-hands");
  if (allHands && allHands.wasteMinutes > 30) {
    recommendations.push({
      icon: "Mail",
      title: "Turn the all-hands into a Loom",
      description: `Watch it on 2x. Skip the Q&A. ${formatMinutes(allHands.wasteMinutes)} reclaimed every month.`,
      savedMinutes: allHands.wasteMinutes,
      savedCost: allHands.wasteCost,
    });
  }
  const status = byCategory.find((c) => c.category === "status-update");
  if (status && status.wasteMinutes > 60) {
    recommendations.push({
      icon: "FileText",
      title: "Replace status syncs with a doc",
      description: `Async docs > sync rambling. Save ${formatMinutes(status.wasteMinutes)}/month and stop hearing "yeah, so basically…".`,
      savedMinutes: status.wasteMinutes,
      savedCost: status.wasteCost,
    });
  }
  const big = scored.filter((m) => m.attendeesCount >= 15);
  if (big.length >= 3) {
    const w = big.reduce((s, m) => s + m.wasteMinutes, 0);
    const c = big.reduce((s, m) => s + m.wasteCost, 0);
    recommendations.push({
      icon: "UsersRound",
      title: "Decline meetings with 15+ people",
      description: `You won't speak. They won't notice. Saves ${formatMinutes(w)} and ${formatCurrency(c, currency)}.`,
      savedMinutes: w,
      savedCost: c,
    });
  }
  if (recommendations.length === 0) {
    recommendations.push({
      icon: "Sparkles",
      title: "You're actually doing fine",
      description: "Most of your meetings are useful. This is rare and beautiful. Keep going.",
      savedMinutes: 0,
      savedCost: 0,
    });
  }

  // Fun verdict
  const hours = Math.round(wasteMinutes / 60);
  const verdict = FUN_VERDICTS[Math.floor(Math.random() * FUN_VERDICTS.length)](hours);

  // Period
  const sortedByDate = [...scored].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  const periodStart = sortedByDate[0]?.start ?? new Date().toISOString();
  const periodEnd = sortedByDate[sortedByDate.length - 1]?.end ?? new Date().toISOString();

  return {
    hourlyRate,
    currency,
    totalMeetings,
    totalMinutes,
    productiveMinutes,
    wasteMinutes,
    wastePercentage,
    totalCost,
    wasteCost,
    efficiencyScore,
    meetings: scored,
    topWasters,
    recommendations,
    byCategory,
    funVerdict: verdict,
    periodStart,
    periodEnd,
  };
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${Math.round(min)}m`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatCurrency(amount: number, currency: "EUR" | "USD" = "EUR"): string {
  const sym = currency === "EUR" ? "€" : "$";
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString("en-US")}${sym}`;
}

export function categoryLabel(c: MeetingCategory): string {
  return {
    standup: "Standups",
    "all-hands": "All-hands",
    "1:1": "1:1s",
    "deep-dive": "Deep dives",
    "status-update": "Status updates",
    external: "External",
    other: "Other",
  }[c];
}
