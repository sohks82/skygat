import { isAdmin } from "@/lib/auth";
import { getHistory } from "@/lib/data";
import { OUTCOME_LABEL } from "@/lib/types";
import { csvResponse, stamped, toCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

/** Every recorded result, newest night first. */
export async function GET() {
  if (!(await isAdmin())) return new Response("Admin access required.", { status: 403 });

  const rows = (await getHistory(100000)).map((r) => [
    r.date,
    r.day_type,
    r.status,
    r.item_name,
    r.item_cost,
    r.member_name ?? "",
    OUTCOME_LABEL[r.outcome] ?? r.outcome,
    r.bullets ?? "",
    r.note ?? "",
  ]);

  const csv = toCsv(
    ["Date", "Day type", "Status", "Item", "Item cost", "Member", "Outcome", "Bullets", "Note"],
    rows,
  );
  return csvResponse(stamped("skygat-history"), csv);
}
