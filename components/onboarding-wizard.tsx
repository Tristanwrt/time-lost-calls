"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Webhook,
  Sparkles,
  Calendar,
  Mic,
} from "lucide-react";

type Platform = {
  id: string;
  name: string;
  color: string;
  initials: string;
};

const PLATFORMS: Platform[] = [
  { id: "google-meet", name: "Google Meet", color: "#00897b", initials: "GM" },
  { id: "zoom", name: "Zoom", color: "#2d8cff", initials: "Z" },
  { id: "teams", name: "Microsoft Teams", color: "#5059c9", initials: "T" },
];

type Step = 0 | 1 | 2;

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [selected, setSelected] = useState<string[]>(["google-meet"]);
  const [progress, setProgress] = useState(0);

  function toggle(id: string) {
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );
  }

  function go(next: Step) {
    setStep(next);
  }

  // Step 1 — fake progress that fills then advances
  useEffect(() => {
    if (step !== 1) return;
    setProgress(0);
    const start = performance.now();
    const duration = 3200;
    let raf: number | null = null;
    const tick = () => {
      const elapsed = performance.now() - start;
      const p = Math.min(1, elapsed / duration);
      setProgress(p);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(() => setStep(2), 600);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [step]);

  return (
    <div className="relative min-h-[100vh] overflow-hidden">
      {/* Background gradient + grid */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[1100px] rounded-full bg-primary/15 blur-[140px]" />
        <div className="absolute top-1/3 right-0 h-[400px] w-[400px] rounded-full bg-fuchsia-500/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <header className="border-b border-border/40">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Link>
          </Button>
          <Stepper step={step} />
          <span className="w-[60px] text-right text-xs text-muted-foreground">
            {step + 1}/3
          </span>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-65px)] max-w-3xl items-center justify-center px-6 py-12">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              <StepPlatform
                selected={selected}
                onToggle={toggle}
                onNext={() => go(1)}
              />
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              <StepConnecting
                progress={progress}
                selected={selected.map(
                  (id) => PLATFORMS.find((p) => p.id === id)!
                )}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              <StepDone onContinue={() => router.push("/live")} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`h-1.5 w-8 rounded-full transition-all duration-500 ${
            i <= step ? "bg-primary" : "bg-border"
          }`}
        />
      ))}
    </div>
  );
}

function StepPlatform({
  selected,
  onToggle,
  onNext,
}: {
  selected: string[];
  onToggle: (id: string) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-center"
      >
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          Step 1 — Connect your calls
        </div>
        <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-5xl">
          Where do your meetings happen?
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-balance text-base text-muted-foreground">
          Pick the platforms you use. We&apos;ll plug in the Vexa transcription bot so it
          joins each call and logs your speaking time.
        </p>
      </motion.div>

      <div className="mx-auto mt-8 grid max-w-xl gap-3">
        {PLATFORMS.map((p, idx) => {
          const isOn = selected.includes(p.id);
          return (
            <motion.button
              key={p.id}
              type="button"
              onClick={() => onToggle(p.id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + idx * 0.06, duration: 0.35 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`group flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                isOn
                  ? "border-primary/50 bg-primary/5 shadow-[0_0_0_1px_var(--color-primary)]"
                  : "border-border/60 bg-card/40 hover:border-border"
              }`}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold text-white"
                style={{ background: p.color }}
              >
                {p.initials}
              </div>
              <div className="flex-1">
                <div className="font-semibold">{p.name}</div>
                <div className="text-xs text-muted-foreground">
                  {p.id === "google-meet"
                    ? "Auto-detect from your Google Calendar"
                    : p.id === "zoom"
                    ? "Connect via Zoom OAuth"
                    : "Connect via Microsoft Graph"}
                </div>
              </div>
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
                  isOn
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border"
                }`}
              >
                {isOn && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Check className="h-3 w-3" />
                  </motion.div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="mx-auto mt-8 flex max-w-xl flex-col items-center gap-2"
      >
        <Button
          size="lg"
          onClick={onNext}
          disabled={selected.length === 0}
          className="h-12 w-full text-base font-semibold sm:w-auto sm:px-12"
        >
          Continue <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <p className="text-xs text-muted-foreground">
          You can change this later. No credentials needed for the demo.
        </p>
      </motion.div>
    </div>
  );
}

function StepConnecting({
  progress,
  selected,
}: {
  progress: number;
  selected: Platform[];
}) {
  const checks = [
    { label: "Provisioning Vexa transcription bot", at: 0.2 },
    { label: "Linking to your meeting platforms", at: 0.45 },
    { label: "Configuring webhook endpoint", at: 0.7 },
    { label: "Listening for meeting events", at: 0.95 },
  ];

  return (
    <Card className="mx-auto max-w-xl border-border/60 bg-card/70 p-8 backdrop-blur-md">
      <CardContent className="space-y-6 p-0">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary"
          >
            <Loader2 className="h-6 w-6" />
          </motion.div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Connecting…
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Setting up the Vexa bot for{" "}
            <span className="text-foreground">
              {selected.map((p) => p.name).join(", ")}
            </span>
          </p>
        </div>

        <div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-fuchsia-400"
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
          </div>
          <div className="mt-1 text-right font-mono text-xs text-muted-foreground">
            {Math.round(progress * 100)}%
          </div>
        </div>

        <ul className="space-y-3">
          {checks.map((c, i) => {
            const done = progress >= c.at;
            return (
              <motion.li
                key={i}
                animate={{ opacity: done ? 1 : 0.4 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3 text-sm"
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all ${
                    done
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2, ease: "backOut" }}
                    >
                      <Check className="h-3 w-3" />
                    </motion.div>
                  ) : (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                </div>
                <span className={done ? "text-foreground" : "text-muted-foreground"}>
                  {c.label}
                </span>
              </motion.li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

function StepDone({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          delay: 0.1,
          duration: 0.6,
          type: "spring",
          stiffness: 200,
          damping: 15,
        }}
        className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, duration: 0.3, ease: "backOut" }}
        >
          <Check className="h-10 w-10 text-emerald-400" strokeWidth={3} />
        </motion.div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="text-balance text-3xl font-bold tracking-tight sm:text-5xl"
      >
        Webhook connected.
        <br />
        <span className="bg-gradient-to-r from-primary via-fuchsia-400 to-orange-300 bg-clip-text text-transparent">
          You&apos;re all set.
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="mx-auto mt-4 max-w-xl text-balance text-base text-muted-foreground"
      >
        From now on, every meeting that completes will land on your live dashboard with
        your real speaking time and the cost of every minute you stayed silent.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.4 }}
        className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-2"
      >
        <Badge variant="outline" className="gap-1 px-3 py-1.5">
          <Webhook className="h-3 w-3" /> Webhook live
        </Badge>
        <Badge variant="outline" className="gap-1 px-3 py-1.5">
          <Mic className="h-3 w-3" /> Speaking time enabled
        </Badge>
        <Badge variant="outline" className="gap-1 px-3 py-1.5">
          <Sparkles className="h-3 w-3" /> Live dashboard ready
        </Badge>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.4 }}
        className="mt-8"
      >
        <Button
          size="lg"
          onClick={onContinue}
          className="h-12 px-12 text-base font-semibold"
        >
          Open live dashboard <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
}
