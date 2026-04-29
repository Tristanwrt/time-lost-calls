"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { generateDemoMeetings } from "@/lib/demo-data";
import { saveSession } from "@/lib/store";
import {
  Upload,
  Sparkles,
  Clock,
  Flame,
  ChevronRight,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { PerspectiveMarquee } from "@/components/ui/perspective-marquee";
import Link from "next/link";

export function LandingHero() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hourlyRateStr, setHourlyRateStr] = useState("60");
  const [currency, setCurrency] = useState<"EUR" | "USD">("EUR");
  const [loading, setLoading] = useState<"demo" | "ics" | null>(null);

  const hourlyRate = Number(hourlyRateStr) || 0;

  function handleDemo() {
    setLoading("demo");
    const meetings = generateDemoMeetings();
    saveSession({ meetings, hourlyRate: hourlyRate || 60, currency, source: "demo" });
    setTimeout(() => router.push("/dashboard"), 400);
  }

  async function handleFile(file: File) {
    setLoading("ics");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/parse-ics", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      if (!data.meetings?.length) {
        toast.error("No meetings found in the last 30 days. Lucky you?");
        setLoading(null);
        return;
      }
      saveSession({
        meetings: data.meetings,
        hourlyRate: hourlyRate || 60,
        currency,
        source: "ics",
      });
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't parse that file.");
      setLoading(null);
    }
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Decorative gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-1/3 right-0 h-[400px] w-[400px] rounded-full bg-fuchsia-500/10 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <header className="border-b border-border/40 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Clock className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight">Time Lost Calls</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <a
              href="/live"
              className="rounded-full border border-border px-3 py-1 hover:text-foreground hover:border-primary/50"
            >
              Live · Vexa webhook
            </a>
            <span className="hidden sm:inline">
              Built for the Vercel Time Lost Calls contest
            </span>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-20 pb-12 text-center sm:pt-28">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <Flame className="h-3 w-3 text-orange-400" />
          Brutally honest meeting audit
        </div>

        <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-7xl">
          How much of your life are
          <br />
          <span className="bg-gradient-to-r from-primary via-fuchsia-400 to-orange-300 bg-clip-text text-transparent">
            meetings stealing?
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl">
          Drop your calendar. We&apos;ll do the math you&apos;ve been avoiding. Spoiler: the
          number ends in &quot;ouch&quot;.
        </p>

        <div className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="h-12 px-8 text-base font-semibold">
            <Link href="/onboarding">
              Connect your calls <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base">
            <Link href="/live">See live dashboard</Link>
          </Button>
        </div>

        <div className="mx-auto mt-10 max-w-xl">
          <Card className="border-border/60 bg-card/70 p-6 text-left backdrop-blur-md">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label htmlFor="rate" className="text-xs text-muted-foreground">
                  Your hourly rate
                </Label>
                <Input
                  id="rate"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="60"
                  value={hourlyRateStr}
                  onChange={(e) => {
                    const v = e.target.value;
                    // accept empty string and digits only; strip leading zeros (but keep "0")
                    if (v === "") {
                      setHourlyRateStr("");
                    } else if (/^\d+$/.test(v)) {
                      setHourlyRateStr(v.replace(/^0+(?=\d)/, ""));
                    }
                  }}
                  onBlur={() => {
                    if (hourlyRateStr === "" || hourlyRateStr === "0") setHourlyRateStr("60");
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
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button
                size="lg"
                onClick={handleDemo}
                disabled={loading !== null}
                className="h-12 text-base font-semibold"
              >
                {loading === "demo" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Try with demo data
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading !== null}
                className="h-12 text-base font-semibold"
              >
                {loading === "ics" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Upload your .ics
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".ics,text/calendar"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              No login. No database. Your file is parsed in memory and forgotten the
              moment you close this tab. We&apos;re not a startup, we&apos;re a guilt trip.
            </p>
          </Card>

          <details className="mx-auto mt-4 max-w-md text-left text-xs text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">
              How do I export my Google Calendar as .ics?
            </summary>
            <ol className="mt-3 space-y-1 pl-4 [&>li]:list-decimal">
              <li>
                Open{" "}
                <a
                  className="underline"
                  href="https://calendar.google.com/calendar/u/0/r/settings/export"
                  target="_blank"
                  rel="noreferrer"
                >
                  Google Calendar → Settings → Export
                </a>
              </li>
              <li>Click &quot;Export&quot; — you get a .zip file</li>
              <li>Unzip it, grab the .ics file inside, drop it here</li>
              <li>Cry a little (optional)</li>
            </ol>
          </details>
        </div>
      </section>

      <section className="relative mb-12 mt-4 border-y border-border/40">
        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="rounded-full border border-border/60 bg-background/70 px-4 py-1.5 text-[11px] uppercase tracking-widest text-muted-foreground backdrop-blur">
            The hits you didn&apos;t ask for
          </div>
        </div>
        <PerspectiveMarquee
          height={300}
          fontSize={80}
          rotateY={-22}
          rotateX={6}
          speed={0.8}
          color="oklch(0.9 0 0 / 0.85)"
        />
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={<Clock className="h-5 w-5" />}
            title="Calculates real waste"
            body={`We score every meeting using a heuristic that punishes large groups, recurring autopilot, and 90-minute "quick syncs".`}
          />
          <FeatureCard
            icon={<Flame className="h-5 w-5" />}
            title="Tells you the cost"
            body="Multiply wasted minutes by your rate. The result is a number nobody at your company wants you to see."
          />
          <FeatureCard
            icon={<Sparkles className="h-5 w-5" />}
            title="Suggests escape routes"
            body="Async standups. Looms instead of all-hands. Decline buttons you forgot existed."
          />
        </div>
      </section>

      <section className="border-t border-border/40 bg-card/30 py-16 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            How it works
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <Step n="1" title="Drop your calendar" body={`Or click "demo data" to see it work in 1 second.`} />
            <Step n="2" title="We score every meeting" body="Heuristic engagement score based on size, duration, recurrence, type." />
            <Step n="3" title="Get the verdict" body="Top time wasters, monthly cost, and how to claw your time back." />
          </div>
          <Button asChild variant="ghost" className="mt-10 text-muted-foreground hover:text-foreground">
            <a href="#top">
              Ready to face the truth? <ChevronRight className="ml-1 h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <Card className="border-border/60 bg-card/50 p-5 backdrop-blur-sm">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 text-primary">
        {icon}
      </div>
      <div className="font-semibold">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </Card>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="text-left">
      <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 font-mono text-xs text-primary">
        {n}
      </div>
      <div className="font-semibold">{title}</div>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
