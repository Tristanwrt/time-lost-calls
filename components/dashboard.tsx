"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { loadSession, clearSession } from "@/lib/store";
import { buildReport, formatMinutes, formatCurrency, categoryLabel } from "@/lib/waste-calculator";
import type { WasteReport, ScoredMeeting } from "@/lib/types";
import {
  Clock,
  Coins,
  TrendingDown,
  Sparkles,
  ArrowLeft,
  Mail,
  MessageSquare,
  FileText,
  UsersRound,
  Flame,
  Skull,
} from "lucide-react";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageSquare,
  Mail,
  FileText,
  UsersRound,
  Sparkles,
};

export function Dashboard() {
  const router = useRouter();
  const [report, setReport] = useState<WasteReport | null>(null);
  const [source, setSource] = useState<"demo" | "ics">("demo");

  useEffect(() => {
    const session = loadSession();
    if (!session) {
      router.replace("/");
      return;
    }
    const r = buildReport(session.meetings, session.hourlyRate, session.currency);
    setReport(r);
    setSource(session.source);
  }, [router]);

  if (!report) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-muted-foreground">Crunching the painful truth…</div>
      </div>
    );
  }

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
            <Badge variant={source === "demo" ? "secondary" : "default"}>
              {source === "demo" ? "Demo data" : "Your calendar"}
            </Badge>
            <span className="text-xs text-muted-foreground">Last 30 days</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearSession();
              router.push("/");
            }}
          >
            Clear & start over
          </Button>
        </div>

        <Hero report={report} />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={<Clock className="h-4 w-4" />}
            label="Total meetings"
            value={String(report.totalMeetings)}
            sub={`${formatMinutes(report.totalMinutes)} of your life`}
          />
          <MetricCard
            icon={<Skull className="h-4 w-4" />}
            label="Wasted time"
            value={formatMinutes(report.wasteMinutes)}
            sub={`${report.wastePercentage}% of total`}
            tone="bad"
          />
          <MetricCard
            icon={<Coins className="h-4 w-4" />}
            label="Money set on fire"
            value={formatCurrency(report.wasteCost, report.currency)}
            sub={`@ ${report.hourlyRate}${report.currency === "EUR" ? "€" : "$"}/h`}
            tone="bad"
          />
          <MetricCard
            icon={<TrendingDown className="h-4 w-4" />}
            label="Efficiency score"
            value={`${report.efficiencyScore}/100`}
            sub={
              report.efficiencyScore >= 60
                ? "You're doing okay."
                : report.efficiencyScore >= 35
                ? "Room for improvement."
                : "Yikes."
            }
            tone={report.efficiencyScore >= 60 ? "good" : report.efficiencyScore >= 35 ? "neutral" : "bad"}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-400" /> Top time wasters
              </CardTitle>
              <CardDescription>
                Ranked by total waste over the last 30 days. Recurring meetings are bundled.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Meeting</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Wasted</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.topWasters.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="font-medium">{m.title}</div>
                        <div className="text-xs text-muted-foreground">{m.reason}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {formatMinutes(m.durationMinutes)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-orange-400">
                        {formatMinutes(m.wasteMinutes)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {formatCurrency(m.wasteCost, report.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Escape routes
              </CardTitle>
              <CardDescription>Things you could actually do this week.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {report.recommendations.map((r, i) => {
                const Icon = ICONS[r.icon] ?? Sparkles;
                return (
                  <div key={i} className="rounded-lg border border-border/60 p-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{r.title}</div>
                        <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>
                        {r.savedMinutes > 0 && (
                          <div className="mt-2 flex items-center gap-2 font-mono text-xs">
                            <Badge variant="outline" className="text-emerald-400 border-emerald-400/30">
                              +{formatMinutes(r.savedMinutes)}/mo
                            </Badge>
                            <Badge variant="outline" className="text-emerald-400 border-emerald-400/30">
                              {formatCurrency(r.savedCost, report.currency)}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Breakdown by meeting type</CardTitle>
            <CardDescription>Where your hours are going to die.</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryBreakdown report={report} />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Every meeting</CardTitle>
            <CardDescription>
              Sorted by waste. Click your tongue at the worst offenders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AllMeetings meetings={report.meetings} currency={report.currency} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Hero({ report }: { report: WasteReport }) {
  const wastedHours = Math.round(report.wasteMinutes / 60);
  return (
    <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-card to-card/40">
      <CardContent className="p-8 sm:p-12">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Last 30 days
        </div>
        <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-6xl">
          You wasted{" "}
          <span className="bg-gradient-to-r from-orange-400 via-fuchsia-400 to-primary bg-clip-text text-transparent">
            {wastedHours}h
          </span>{" "}
          in pointless meetings.
        </h1>
        <p className="mt-3 max-w-2xl text-balance text-lg text-muted-foreground">
          {report.funVerdict}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {formatCurrency(report.wasteCost, report.currency)} burned
          </Badge>
          <Badge variant="outline" className="font-mono">
            {report.wastePercentage}% wasted
          </Badge>
          <Badge variant="outline" className="font-mono">
            {report.totalMeetings} meetings analyzed
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone?: "good" | "bad" | "neutral";
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
        <div className={`mt-2 font-mono text-3xl font-bold ${valueColor}`}>{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
      </CardContent>
    </Card>
  );
}

function CategoryBreakdown({ report }: { report: WasteReport }) {
  const max = Math.max(...report.byCategory.map((c) => c.wasteMinutes), 1);
  return (
    <div className="space-y-3">
      {report.byCategory.map((c) => {
        const pct = (c.wasteMinutes / max) * 100;
        return (
          <div key={c.category}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <div className="font-medium">{categoryLabel(c.category)}</div>
              <div className="font-mono text-xs text-muted-foreground">
                {c.count} meetings · {formatMinutes(c.wasteMinutes)} wasted ·{" "}
                {formatCurrency(c.wasteCost, report.currency)}
              </div>
            </div>
            <Progress value={pct} />
          </div>
        );
      })}
    </div>
  );
}

function AllMeetings({
  meetings,
  currency,
}: {
  meetings: ScoredMeeting[];
  currency: "EUR" | "USD";
}) {
  const [showAll, setShowAll] = useState(false);
  const sorted = useMemo(
    () => [...meetings].sort((a, b) => b.wasteMinutes - a.wasteMinutes),
    [meetings]
  );
  const display = showAll ? sorted : sorted.slice(0, 12);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Meeting</TableHead>
            <TableHead className="text-right">Attendees</TableHead>
            <TableHead className="text-right">Duration</TableHead>
            <TableHead className="text-right">Engagement</TableHead>
            <TableHead className="text-right">Waste</TableHead>
            <TableHead className="text-right">Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {display.map((m) => (
            <TableRow key={m.id}>
              <TableCell>
                <div className="font-medium">{m.title}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(m.start).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {m.isRecurring && " · recurring"}
                </div>
              </TableCell>
              <TableCell className="text-right font-mono text-xs">{m.attendeesCount}</TableCell>
              <TableCell className="text-right font-mono text-xs">
                {formatMinutes(m.durationMinutes)}
              </TableCell>
              <TableCell className="text-right">
                <Badge
                  variant="outline"
                  className={
                    m.engagementScore >= 60
                      ? "text-emerald-400 border-emerald-400/30"
                      : m.engagementScore >= 35
                      ? "text-amber-400 border-amber-400/30"
                      : "text-orange-400 border-orange-400/30"
                  }
                >
                  {m.engagementScore}/100
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono text-xs text-orange-400">
                {formatMinutes(m.wasteMinutes)}
              </TableCell>
              <TableCell className="text-right font-mono text-xs">
                {formatCurrency(m.wasteCost, currency)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {sorted.length > 12 && (
        <>
          <Separator className="my-3" />
          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={() => setShowAll(!showAll)}>
              {showAll ? "Show less" : `Show all ${sorted.length} meetings`}
            </Button>
          </div>
        </>
      )}
    </>
  );
}
