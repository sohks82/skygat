import { formatAnnouncementDate, type ItemWithQueue } from "./types";

/** Prefer the WhatsApp handle; fall back to the in-game name so nobody is dropped. */
function mention(name: string, whatsapp: string | null): string {
  return `@${(whatsapp ?? name).trim()}`;
}

const ORDINAL = ["1st", "2nd"];

/**
 * Builds the announcement for the first two people in each queue.
 *
 * Items with nobody queued are skipped. Items with one person queued show one
 * line rather than an empty backup slot.
 */
export function buildAnnouncement(
  date: string,
  items: ItemWithQueue[],
  slots = 2,
): { text: string; missing: string[] } {
  const missing = new Set<string>();
  const blocks: string[] = [];

  for (const item of items) {
    const picks = item.queue.slice(0, slots);
    if (picks.length === 0) continue;

    const lines = picks.map((q, i) => {
      if (!q.member_whatsapp) missing.add(q.member_name);
      // Second slot can carry its own price; otherwise reuse the item's cost.
      const cost = i === 0 ? item.cost : (item.backup_cost ?? item.cost);
      const label = `${ORDINAL[i] ?? `${i + 1}th`} ${item.name}`;
      return `${label} (${cost}) ${mention(q.member_name, q.member_whatsapp)}`;
    });

    blocks.push(`*${item.name}*\n${lines.join("\n")}`);
  }

  const header = `${formatAnnouncementDate(date)} - Auction`;
  const text = blocks.length
    ? `${header}\n\n${blocks.join("\n\n")}`
    : `${header}\n\nNo queues have anyone waiting.`;

  return { text, missing: [...missing].sort() };
}
