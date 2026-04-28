"use client";

import type { Meeting } from "./types";

const STORAGE_KEY = "tlc_session";

export type SessionData = {
  meetings: Meeting[];
  hourlyRate: number;
  currency: "EUR" | "USD";
  source: "demo" | "ics";
};

export function saveSession(data: SessionData) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadSession(): SessionData | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
