export const MEMBER_LIMIT = 25;

export const DAY_TYPES = ["War", "League", "Glory", "Other"] as const;
export type DayType = (typeof DAY_TYPES)[number];

export const OUTCOMES = ["won", "missed", "no_bid"] as const;
export type Outcome = (typeof OUTCOMES)[number];

export const OUTCOME_LABEL: Record<Outcome, string> = {
  won: "Won",
  missed: "Missed",
  no_bid: "No bid",
};

export type Member = {
  id: number;
  name: string;
  aliases: string[];
  whatsapp: string | null;
  active: boolean;
  note: string | null;
};

export type Item = {
  id: number;
  name: string;
  cost: number;
  backup_cost: number | null;
  sort_order: number;
  active: boolean;
};

export type QueueRow = {
  id: number;
  item_id: number;
  member_id: number;
  position: number;
  note: string | null;
  member_name: string;
  member_whatsapp: string | null;
  member_active: boolean;
};

export type ItemWithQueue = Item & { queue: QueueRow[] };

export type Auction = {
  id: number;
  date: string;
  day_type: DayType;
  starts_at: string | null;
  status: "planned" | "completed" | "archived";
  notes: string | null;
};

export type ResultRow = {
  id: number;
  auction_id: number;
  item_id: number;
  member_id: number | null;
  outcome: Outcome;
  bullets: number | null;
  note: string | null;
  item_name: string;
  item_cost: number;
  member_name: string | null;
};

/** War nights auction at 22:00; other day types have no fixed slot. */
export function defaultStartFor(dayType: DayType): string | null {
  return dayType === "War" ? "22:00" : null;
}

export function formatDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDayName(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short" });
}

/** "27th Aug 2026" — the format used in the WhatsApp announcement. */
export function formatAnnouncementDate(d: string): string {
  const date = new Date(d + "T00:00:00");
  const day = date.getDate();
  const teen = day > 10 && day < 14;
  const suffix = teen ? "th" : ["th", "st", "nd", "rd"][day % 10] ?? "th";
  const month = date.toLocaleDateString("en-GB", { month: "short" });
  return `${day}${suffix} ${month} ${date.getFullYear()}`;
}
