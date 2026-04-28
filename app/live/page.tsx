import { LiveDashboard } from "@/components/live-dashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function LivePage() {
  return (
    <main className="flex-1">
      <LiveDashboard />
    </main>
  );
}
