import { LandingHero } from "@/components/landing-hero";
import { Footer } from "@/components/footer";

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col">
      <LandingHero />
      <Footer />
    </main>
  );
}
