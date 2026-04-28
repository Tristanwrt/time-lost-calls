export type Meeting = {
  id: string;
  title: string;
  start: string; // ISO
  end: string; // ISO
  durationMinutes: number;
  attendeesCount: number;
  organizer?: string;
  isRecurring: boolean;
  isOneOnOne: boolean;
};

export type ScoredMeeting = Meeting & {
  engagementScore: number; // 0-100, higher = more engaged
  wasteMinutes: number;
  wasteCost: number;
  reason: string;
  category: MeetingCategory;
};

export type MeetingCategory =
  | "standup"
  | "all-hands"
  | "1:1"
  | "deep-dive"
  | "status-update"
  | "external"
  | "other";

export type WasteReport = {
  hourlyRate: number;
  currency: "EUR" | "USD";
  totalMeetings: number;
  totalMinutes: number;
  productiveMinutes: number;
  wasteMinutes: number;
  wastePercentage: number;
  totalCost: number;
  wasteCost: number;
  efficiencyScore: number; // 0-100
  meetings: ScoredMeeting[];
  topWasters: ScoredMeeting[];
  recommendations: Recommendation[];
  byCategory: { category: MeetingCategory; count: number; wasteMinutes: number; wasteCost: number }[];
  funVerdict: string;
  periodStart: string;
  periodEnd: string;
};

export type Recommendation = {
  icon: string;
  title: string;
  description: string;
  savedMinutes: number;
  savedCost: number;
};
