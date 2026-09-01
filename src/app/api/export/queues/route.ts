import { isAdmin } from "@/lib/auth";
import { getQueues } from "@/lib/data";
import { csvResponse, stamped, toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

/** Current state of every queue, one row per person. */
export async function GET() {
  if (!(await isAdmin())) return new Response("Admin access required.", { status: 403 });

  const items = await getQueues();
  const rows: unknown[][] = [];

  for (const item of items) {
    for (const q of item.queue) {
      rows.push([
        item.name,
        item.cost,
        item.backup_cost ?? "",
        q.position,
        q.member_name,
        q.member_whatsapp ?? "",
        q.note ?? "",
      ]);
    }
  }

  const csv = toCsv(
    ["Item", "Cost", "Backup cost", "Position", "Member", "WhatsApp", "Note"],
    rows,
  );
  return csvResponse(stamped("skygat-queues"), csv);
}
