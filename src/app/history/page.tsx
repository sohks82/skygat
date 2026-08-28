import Link from "next/link";
import { getHistory } from "@/lib/data";
import { OUTCOME_LABEL, formatDate, formatDayName } from "@/lib/types";
import { Bullets, DayChip, Empty, PageHead } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const rows = await getHistory();

  const nights = new Map<string, typeof rows>();
  for (const r of rows) {
    const list = nights.get(r.date) ?? [];
    list.push(r);
    nights.set(r.date, list);
  }

  return (
    <>
      <PageHead eyebrow="Archived results" title="History" />

      <p className="eyebrow mb-2">Night by night</p>
      {nights.size === 0 ? (
        <Empty>No results recorded yet.</Empty>
      ) : (
        <div className="space-y-3">
          {[...nights.entries()].map(([date, list]) => (
            <section key={date} className="panel">
              <header className="flex flex-wrap items-center gap-3 border-b border-line px-3.5 py-2.5">
                <span className="font-display text-sm uppercase tracking-widest text-muted">
                  {formatDayName(date)}
                </span>
                <h2 className="font-mono text-sm">{formatDate(date)}</h2>
                <DayChip type={list[0].day_type} />
                <Link
                  href={`/auctions/${list[0].auction_id}`}
                  className="ml-auto font-display text-xs uppercase tracking-widest text-muted hover:text-ink"
                >
                  Open →
                </Link>
              </header>
              <div className="divide-y divide-line/60">
                {list.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3.5 py-2">
                    <span className="min-w-0 flex-1 text-sm text-ink/85">{r.item_name}</span>
                    {r.outcome === "won" ? (
                      <span className="font-display text-base font-semibold text-brass">
                        {r.member_name ?? "—"}
                      </span>
                    ) : (
                      <span className={`chip ${r.outcome === "missed" ? "text-danger" : "text-muted"}`}>
                        {OUTCOME_LABEL[r.outcome]}
                      </span>
                    )}
                    {r.bullets != null ? <Bullets n={r.bullets} /> : null}
                    {r.note ? <span className="text-xs text-muted">{r.note}</span> : null}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
