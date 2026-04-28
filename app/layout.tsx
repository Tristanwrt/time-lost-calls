import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Time Lost Calls — How much of your life are meetings stealing?",
  description:
    "Drop your calendar, get a brutally honest report on every minute you've wasted in pointless meetings. Spoiler: it's a lot.",
  openGraph: {
    title: "Time Lost Calls — How much of your life are meetings stealing?",
    description:
      "Drop your calendar, get a brutally honest report on every minute you've wasted in pointless meetings.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {children}
        <Toaster theme="dark" position="top-center" />
      </body>
    </html>
  );
}
