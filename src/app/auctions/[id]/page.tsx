import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addResultAction,
  deleteAuctionAction,
  deleteResultAction,
  setAuctionStatusAction,
  updateAuctionAction,
} from "@/app/actions";
import { isAdmin } from "@/lib/auth";
import { getAuction, getMembers, getQueues, getResults } from "@/lib/data";
import { DAY_TYPES, OUTCOME_LABEL, formatDate, formatDayName, type Outcome } from "@/lib/types";
import { Bullets, DayChip, Empty, PageHead, StatusChip } from "@/components/ui";
import { Announcement } from "@/components/announcement";
import { buildAnnouncement } from "@/lib/announcement";

export const dynamic = "force-dynamic";

export default async function AuctionPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number.parseInt((await params).id, 10);
  const auction = await getAuction(id);
  if (!auction) notFound();

  const [admin, results, queues, members] = await Promise.all([
    isAdmin(),
    getResults(id),
    getQueues(),
    getMembers(),
  ]);

  const activeMembers = members.filter((m) => m.active);
  const settled = new Set(results.map((r) => r.item_id));
  const pending = queues.filter((q) => !settled.has(q.id) && q.queue.length > 0);
  const locked = auction.status === "archived";
  const announcement = buildAnnouncement(auction.date, queues);

  return (
    <>
      <PageHead eyebrow={`${formatDayName(auction.date)} · ${auction.day_type} night`} title={formatDate(auction.date)}>
        <StatusChip status={auction.status} />
        <Link href="/auctions" className="btn btn-ghost">
          All nights
        </Link>
      </PageHead>

      {/* Night settings */}
      {admin && !locked ? (
        <form action={updateAuctionAction} className="panel mb-6 grid gap-2 p-3 sm:grid-cols-[140px_120px_1fr_auto]">
          <input type="hidden" name="id" value={auction.id} />
          <select name="day_type" className="field" defaultValue={auction.day_type}>
            {DAY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            name="starts_at"
            className="field font-mono"
            defaultValue={auction.starts_at ?? ""}
            placeholder="22:00"
          />
          <input name="notes" className="field" defaultValue={auction.notes ?? ""} placeholder="Notes" />
          <button className="btn">Save night</button>
        </form>
      ) : (
        <div className="panel mb-6 flex flex-wrap items-center gap-4 p-3">
          <DayChip type={auction.day_type} />
          <span className="font-mono text-sm">{auction.starts_at ?? "time TBC"}</span>
          {auction.notes ? <span className="text-sm text-muted">{auction.notes}</span> : null}
        </div>
      )}

      {auction.status !== "archived" ? (
        <Announcement initial={announcement.text} missing={announcement.missing} />
      ) : null}

      {/* One-tap awards from the front of each queue */}
      {admin && !locked && pending.length > 0 ? (
        <section className="mb-6">
          <p className="eyebrow mb-2">Award to whoever is next</p>
          <div className="panel divide-y divide-line">
            {pending.map((item) => (
              <form
                key={item.id}
                action={addResultAction}
                className="flex flex-wrap items-center gap-3 px-3.5 py-2.5"
              >
                <input type="hidden" name="auction_id" value={auction.id} />
                <input type="hidden" name="item_id" value={item.id} />
                <input type="hidden" name="member_id" value={item.queue[0].member_id} />
                <input type="hidden" name="outcome" value="won" />
                <span className="min-w-0 flex-1">
                  <span className="text-sm">{item.name}</span>
                  <span className="ml-2">
                    <Bullets n={item.cost} />
                  </span>
                </span>
                <span className="font-display text-base font-semibold text-brass">
                  {item.queue[0].member_name}
                </span>
                <button className="btn btn-primary btn-tiny">Award</button>
              </form>
            ))}
          </div>
        </section>
      ) : null}

      {/* Free-form entry: split wins, missed items, off-queue wins */}
      {admin && !locked ? (
        <form action={addResultAction} className="panel mb-8 grid gap-2 p-3 sm:grid-cols-[1.2fr_110px_1.2fr_110px_auto]">
          <input type="hidden" name="auction_id" value={auction.id} />
          <select name="item_id" className="field" required defaultValue="">
            <option value="" disabled>
              Item…
            </option>
            {queues.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
          <select name="outcome" className="field" defaultValue="won">
            {(Object.keys(OUTCOME_LABEL) as Outcome[]).map((o) => (
              <option key={o} value={o}>
                {OUTCOME_LABEL[o]}
              </option>
            ))}
          </select>
          <select name="member_id" className="field" defaultValue="">
            <option value="">Nobody</option>
            {activeMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <input name="bullets" type="number" min="0" step="50" className="field font-mono" placeholder="Bullets" />
          <button className="btn">Add line</button>
          <p className="text-xs text-muted sm:col-span-5">
            Use this for split wins, items nobody took, or a winner who was not at the front of the
            queue. Blank bullets fall back to the item&apos;s listed cost.
          </p>
        </form>
      ) : null}

      {/* Recorded results */}
      <p className="eyebrow mb-2">Results</p>
      <div className="panel divide-y divide-line">
        {results.length === 0 ? (
          <Empty>Nothing recorded for this night yet.</Empty>
        ) : (
          results.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3.5 py-2.5">
              <span className="min-w-0 flex-1 text-sm">{r.item_name}</span>
              {r.outcome === "won" ? (
                <span className="font-display text-base font-semibold">{r.member_name ?? "—"}</span>
              ) : (
                <span className={`chip ${r.outcome === "missed" ? "text-danger" : "text-muted"}`}>
                  {OUTCOME_LABEL[r.outcome]}
                </span>
              )}
              {r.bullets != null ? <Bullets n={r.bullets} /> : null}
              {r.note ? <span className="text-xs text-muted">{r.note}</span> : null}
              {admin && !locked ? (
                <form action={deleteResultAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="btn btn-ghost btn-tiny hover:text-danger">✕</button>
                </form>
              ) : null}
            </div>
          ))
        )}
      </div>

      {/* Status transitions */}
      {admin ? (
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          {auction.status === "planned" ? (
            <StatusButton id={auction.id} status="completed" label="Mark completed" primary />
          ) : null}
          {auction.status === "completed" ? (
            <StatusButton id={auction.id} status="archived" label="Archive night" primary />
          ) : null}
          {auction.status === "archived" ? (
            <StatusButton id={auction.id} status="completed" label="Reopen for edits" />
          ) : null}
          {auction.status === "completed" ? (
            <StatusButton id={auction.id} status="planned" label="Back to planned" />
          ) : null}

          <form action={deleteAuctionAction} className="ml-auto">
            <input type="hidden" name="id" value={auction.id} />
            <button className="btn btn-ghost hover:text-danger">Delete night</button>
          </form>
        </div>
      ) : null}

      <p className="mt-3 max-w-2xl text-xs text-muted">
        Archiving locks the night so nobody edits it by accident. It stays in History and still counts
        toward member totals.
      </p>
    </>
  );
}

function StatusButton({
  id,
  status,
  label,
  primary,
}: {
  id: number;
  status: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <form action={setAuctionStatusAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className={`btn ${primary ? "btn-primary" : ""}`}>{label}</button>
    </form>
  );
}
