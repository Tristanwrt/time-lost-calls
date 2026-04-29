"use client";

import { Sparkles } from "@/components/ui/sparkles";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { Video, Users, MessageSquare, Mic, Calendar, Webhook, Bot, Activity } from "lucide-react";

type Platform = {
  id: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const PLATFORMS: Platform[] = [
  { id: "google-meet", label: "Google Meet", Icon: Video },
  { id: "zoom", label: "Zoom", Icon: Users },
  { id: "teams", label: "Microsoft Teams", Icon: MessageSquare },
  { id: "vexa", label: "Vexa", Icon: Mic },
  { id: "calendar", label: "Google Calendar", Icon: Calendar },
  { id: "webhook", label: "Webhooks", Icon: Webhook },
  { id: "bot", label: "Meeting bots", Icon: Bot },
  { id: "vercel", label: "Vercel", Icon: Activity },
];

export function TrustedBySection() {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="mx-auto max-w-3xl px-6 pt-20 text-center">
        <p className="text-sm uppercase tracking-widest text-muted-foreground">
          Plugs into the tools you already hate-love
        </p>
        <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="text-muted-foreground">Built for the calls.</span>
          <br />
          <span className="bg-gradient-to-r from-primary via-fuchsia-400 to-orange-300 bg-clip-text text-transparent">
            Powered by your stack.
          </span>
        </h2>
      </div>

      <div className="relative mx-auto mt-10 h-[88px] w-full max-w-5xl">
        <InfiniteSlider
          className="flex h-full w-full items-center"
          duration={32}
          gap={56}
        >
          {PLATFORMS.map(({ id, label, Icon }) => (
            <div
              key={id}
              className="flex shrink-0 items-center gap-3 px-3 text-muted-foreground"
            >
              <Icon className="h-5 w-5" />
              <span className="whitespace-nowrap text-sm font-semibold uppercase tracking-wider">
                {label}
              </span>
            </div>
          ))}
        </InfiniteSlider>
        <ProgressiveBlur
          className="pointer-events-none absolute left-0 top-0 h-full w-[180px]"
          direction="left"
          blurIntensity={1}
        />
        <ProgressiveBlur
          className="pointer-events-none absolute right-0 top-0 h-full w-[180px]"
          direction="right"
          blurIntensity={1}
        />
      </div>

      <div className="relative -mt-4 h-[420px] w-full overflow-hidden [mask-image:radial-gradient(50%_50%,white,transparent)]">
        <div className="absolute inset-0 before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_bottom_center,var(--color-primary),transparent_70%)] before:opacity-50" />
        <div className="absolute -left-1/2 top-1/2 z-10 aspect-[1/0.7] w-[200%] rounded-[100%] border-t border-white/15 bg-background" />
        <Sparkles
          density={1100}
          color="#ffffff"
          className="absolute inset-x-0 bottom-0 h-full w-full [mask-image:radial-gradient(50%_50%,white,transparent_85%)]"
        />
      </div>
    </section>
  );
}
