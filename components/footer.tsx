export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-muted-foreground sm:flex-row">
        <div>
          Built with Next.js, shadcn/ui, and a deep, abiding hatred of the
          weekly all-hands.
        </div>
        <div>
          Deployed on{" "}
          <a
            href="https://vercel.com"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-foreground"
          >
            Vercel
          </a>
        </div>
      </div>
    </footer>
  );
}
