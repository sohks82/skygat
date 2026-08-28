import Link from "next/link";
import { createAuctionAction } from "@/app/actions";
import { isAdmin } from "@/lib/auth";
import { getAuctions } from "@/lib/data";
import { DAY_TYPES, formatDate, formatDayName } from "@/lib/types";
import { DayChip, Empty, PageHead, StatusChip } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AuctionsPage() {
  const [admin, auctions] = await Promise.all([isAdmin(), getAuctions()]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHead eyebrow="Every auction night" title="Auctions" />

      {admin ? (
        <form
          action={createAuctionAction}
          className="panel mb-6 grid gap-2 p-3 sm:grid-cols-[170px_140px_130px_auto]"
        >
          <input type="date" name="date" defaultValue={today} className="field font-mono" required />
          <select name="day_type" className="field" defaultValue="War">
            {DAY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input name="starts_at" className="field font-mono" placeholder="22:00" />
          <button className="btn btn-primary">Schedule night</button>
          <p className="text-xs text-muted sm:col-span-4">
            Leave the time blank and war nights default to 22:00. Scheduling an existing date opens it
            instead of creating a duplicate.
          </p>
        </form>
      ) : null}

      <div className="panel divide-y divide-line">
        {auctions.length === 0 ? (
          <Empty>No auction nights recorded yet.</Empty>
        ) : (
          auctions.map((a) => (
            <Link
              key={a.id}
              href={`/auctions/${a.id}`}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3.5 py-3 transition-colors hover:bg-panel2"
            >
              <span className="w-11 font-display text-sm uppercase tracking-widest text-muted">
                {formatDayName(a.date)}
              </span>
              <span className="w-32 font-mono text-sm">{formatDate(a.date)}</span>
              <DayChip type={a.day_type} />
              <span className="font-mono text-xs text-muted">{a.starts_at ?? "—"}</span>
              <span className="ml-auto">
                <StatusChip status={a.status} />
              </span>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
