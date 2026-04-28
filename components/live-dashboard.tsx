"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, RefreshCw, Mic, MicOff, Coins, Clock, Webhook } from "lucide-react";
import type { NormalizedMeeting, StoredEvent } from "@/lib/webhook-store";
import { formatCurrency, formatMinutes } from "@/lib/waste-calculator";

const WEBHOOK_URL =
  typeof window !== "undefined"
    ? `${window.location.origin}/api/webhook`
    : "/api/webhook";

export function LiveDashboard() {
  const [meetings, setMeetings] = useState<NormalizedMeeting[]>([]);
  const [events, setEvents] = useState<StoredEvent[]>([]);
  const [hourlyRate, setHourlyRate] = useState<string>("60");
  const [currency, setCurrency] = useState<"EUR" | "USD">("EUR");
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/events", { cache: "no-store" });
      const data = await res.json();
      setEvents(data.events ?? []);
      setMeetings(data.meetings ?? []);
      setLastFetch(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    const id = setInterval(fetchEvents, 5000);
    return () => clearInterval(id);
  }, [fetchEvents]);

  const rate = Number(hourlyRate) || 60;
  const userNameNorm = userName.trim().toLowerCase();

  const enriched = meetings.map((m) => {
    const totalSec = m.durationSeconds ?? 0;
    let userSec = m.userSpeakingSeconds;
    if (userSec === undefined && userNameNorm) {
      const match = m.participants.find((p) => p.name.toLowerCase().includes(userNameNorm));
      userSec = match?.speakingSeconds;
    }
    const userSpeakingSec = userSec ?? 0;
    const wasteSec = Math.max(0, totalSec - userSpeakingSec);
    const wasteMin = wasteSec / 60;
    const totalMin = totalSec / 60;
    const wasteCost = (wasteMin / 60) * rate;
    const speakingPercent = totalSec > 0 ? Math.round((userSpeakingSec / totalSec) * 100) : 0;
    return {
      ...m,
      userSpeakingSec,
      wasteSec,
      wasteMin,
      totalMin,
      wasteCost,
      speakingPercent,
    };
  });

  const totalDurationMin = enriched.reduce((s, m) => s + m.totalMin, 0);
  const totalWasteMin = enriched.reduce((s, m) => s + m.wasteMin, 0);
  const totalWasteCost = enriched.reduce((s, m) => s + m.wasteCost, 0);
  const totalSpeakingMin = enriched.reduce((s, m) => s + m.userSpeakingSec / 60, 0);
  const speakingPct =
    totalDurationMin > 0 ? Math.round((totalSpeakingMin / totalDurationMin) * 100) : 0;

  const recentEvents = events.slice(0, 8);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Link>
            </Button>
            <Badge variant="default" className="gap-1">
              <Webhook className="h-3 w-3" /> Live webhook data
            </Badge>
            <span className="text-xs text-muted-foreground">
              {lastFetch ? `Updated ${lastFetch.toLocaleTimeString()}` : "Loading…"}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchEvents} disabled={loading}>
            <RefreshCw className={`mr-1 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-card to-card/40">
          <CardContent className="p-8 sm:p-10">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Live · From Vexa webhook
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">
              {meetings.length === 0 ? (
                <>Waiting for your first meeting…</>
              ) : (
                <>
                  You spoke for{" "}
                  <span className="bg-gradient-to-r from-emerald-400 to-primary bg-clip-text text-transparent">
                    {speakingPct}%
                  </span>{" "}
                  of {meetings.length} real meeting{meetings.length > 1 ? "s" : ""}.
                </>
              )}
            </h1>
            <p className="mt-3 max-w-2xl text-balance text-base text-muted-foreground">
              {meetings.length === 0
                ? "Once a meeting completes in Vexa, it shows up here automatically. Speaking time = your real participation. Everything else = expensive listening."
                : "Speaking = participating. Listening = optional. We'll show you exactly how much of the listening could have been a doc."}
            </p>
            {meetings.length > 0 && (
              <div className="mt-6 inline-flex items-baseline gap-2 rounded-lg border border-border bg-background/40 px-4 py-3 font-mono">
                <span className="text-2xl font-semibold text-emerald-400">
                  {formatMinutes(totalSpeakingMin)}
                </span>
                <span className="text-muted-foreground">/</span>
                <span className="text-2xl font-semibold">{formatMinutes(totalDurationMin)}</span>
                <span className="ml-2 text-xs uppercase tracking-wider text-muted-foreground">
                  speaking / total
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Used to compute your real waste cost. Set the name that appears for you in Vexa
              transcripts (only needed if Vexa doesn&apos;t flag you as the user).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="rate" className="text-xs text-muted-foreground">
                  Hourly rate
                </Label>
                <Input
                  id="rate"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={hourlyRate}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") setHourlyRate("");
                    else if (/^\d+$/.test(v)) setHourlyRate(v.replace(/^0+(?=\d)/, ""));
                  }}
                  onBlur={() => {
                    if (hourlyRate === "" || hourlyRate === "0") setHourlyRate("60");
                  }}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="cur" className="text-xs text-muted-foreground">
                  Currency
                </Label>
                <select
                  id="cur"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as "EUR" | "USD")}
                  className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="EUR">EUR €</option>
                  <option value="USD">USD $</option>
                </select>
              </div>
              <div>
                <Label htmlFor="name" className="text-xs text-muted-foreground">
                  Your display name in Vexa
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g. Tristan"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {meetings.length > 0 && (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                icon={<Clock className="h-4 w-4" />}
                label="Speaking ratio"
                value={`${formatMinutes(totalSpeakingMin)} / ${formatMinutes(totalDurationMin)}`}
                sub={`${speakingPct}% spoken across ${meetings.length} meetings`}
                tone={speakingPct >= 30 ? "good" : speakingPct >= 10 ? "neutral" : "bad"}
                small
              />
              <MetricCard
                icon={<Mic className="h-4 w-4" />}
                label="You spoke"
                value={formatMinutes(totalSpeakingMin)}
                sub={`${speakingPct}% of total time`}
                tone="good"
              />
              <MetricCard
                icon={<MicOff className="h-4 w-4" />}
                label="Silent waste"
                value={formatMinutes(totalWasteMin)}
                sub={`${100 - speakingPct}% silent`}
                tone="bad"
              />
              <MetricCard
                icon={<Coins className="h-4 w-4" />}
                label="Money for silence"
                value={formatCurrency(totalWasteCost, currency)}
                sub={`@ ${rate}${currency === "EUR" ? "€" : "$"}/h`}
                tone="bad"
              />
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Real meetings — speaking time breakdown</CardTitle>
                <CardDescription>
                  Pulled live from your Vexa webhook. Updates every 5 seconds.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Meeting</TableHead>
                      <TableHead className="text-right">Speaking / Total</TableHead>
                      <TableHead className="text-right">% spoken</TableHead>
                      <TableHead className="text-right">Wasted</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enriched.map((m) => (
                      <TableRow key={m.meetingId}>
                        <TableCell>
                          <div className="font-medium">{m.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {m.platform && <span className="mr-2">{m.platform}</span>}
                            {m.startedAt &&
                              new Date(m.startedAt).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            {m.participants.length > 0 && (
                              <span className="ml-2">· {m.participants.length} people</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          <span className="text-emerald-400">
                            {formatMinutes(m.userSpeakingSec / 60)}
                          </span>
                          <span className="text-muted-foreground"> / </span>
                          <span>{formatMinutes(m.totalMin)}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="outline"
                            className={
                              m.speakingPercent >= 30
                                ? "text-emerald-400 border-emerald-400/30"
                                : m.speakingPercent >= 10
                                ? "text-amber-400 border-amber-400/30"
                                : "text-orange-400 border-orange-400/30"
                            }
                          >
                            {m.speakingPercent}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-orange-400">
                          {formatMinutes(m.wasteMin)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {formatCurrency(m.wasteCost, currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent webhook events</CardTitle>
            <CardDescription>
              Endpoint:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                {WEBHOOK_URL}
              </code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                No events yet. Hit &quot;Test&quot; on your Vexa dashboard to send one.
              </div>
            ) : (
              <div className="space-y-2">
                {recentEvents.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        {e.eventType}
                      </Badge>
                      <span className="text-muted-foreground">
                        {new Date(e.receivedAt).toLocaleString()}
                      </span>
                    </div>
                    {e.meeting && (
                      <span className="text-muted-foreground">
                        {e.meeting.title} · {e.meeting.participants.length} participants
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <Separator className="my-4" />
            <p className="text-xs text-muted-foreground">
              Events are stored in memory on the server and can be lost if the function instance
              cycles. For permanent storage, plug in Vercel KV.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  tone = "neutral",
  small = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone?: "good" | "bad" | "neutral";
  small?: boolean;
}) {
  const valueColor =
    tone === "bad" ? "text-orange-400" : tone === "good" ? "text-emerald-400" : "text-foreground";
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="uppercase tracking-wider">{label}</span>
          <span>{icon}</span>
        </div>
        <div
          className={`mt-2 font-mono font-bold ${valueColor} ${
            small ? "text-xl sm:text-2xl" : "text-3xl"
          }`}
        >
          {value}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
      </CardContent>
    </Card>
  );
}
