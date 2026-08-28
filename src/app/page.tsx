import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { getActiveMemberCount, getMembers, getQueues, getUpcomingAuction } from "@/lib/data";
import { MEMBER_LIMIT, formatDate, formatDayName } from "@/lib/types";
import { QueueBoard } from "@/components/queue-board";
import { Countdown } from "@/components/countdown";
import { DayChip, PageHead } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const [admin, queues, members, activeCount, next] = await Promise.all([
    isAdmin(),
    getQueues(),
    getMembers(),
    getActiveMemberCount(),
    getUpcomingAuction(),
  ]);

  const queued = new Set(queues.flatMap((i) => i.queue.map((q) => q.member_id))).size;

  return (
    <>
      <PageHead eyebrow="SkyGat alliance" title="Board">
        <Link href="/queues" className="btn">
          Full queues
        </Link>
        {admin ? (
          <Link href="/auctions" className="btn btn-primary">
            Record a night
          </Link>
        ) : null}
      </PageHead>

      {/* Next auction strip */}
      <section className="panel mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3.5">
        {next ? (
          <>
            <div>
              <p className="eyebrow">Next auction</p>
              <p className="mt-0.5 font-display text-2xl font-semibold leading-none">
                {formatDayName(next.date)} {formatDate(next.date)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <DayChip type={next.day_type} />
              <span className="font-mono text-sm text-ink">
                {next.starts_at ? `${next.starts_at}` : "time TBC"}
              </span>
              <Countdown date={next.date} startsAt={next.starts_at} />
            </div>
            <Link href={`/auctions/${next.id}`} className="btn ml-auto">
              Open
            </Link>
          </>
        ) : (
          <>
            <div>
              <p className="eyebrow">Next auction</p>
              <p className="mt-0.5 text-sm text-muted">
                Nothing scheduled. War nights run at 22:00.
              </p>
            </div>
            {admin ? (
              <Link href="/auctions" className="btn btn-primary ml-auto">
                Schedule one
              </Link>
            ) : null}
          </>
        )}
      </section>

      {/* Roster gauge */}
      <section className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2">
        <p className="eyebrow">Roster</p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm">
            <span className={activeCount >= MEMBER_LIMIT ? "text-danger" : "text-ink"}>{activeCount}</span>
            <span className="text-muted"> / {MEMBER_LIMIT}</span>
          </span>
          <div className="flex gap-[2px]" aria-hidden>
            {Array.from({ length: MEMBER_LIMIT }, (_, i) => (
              <span
                key={i}
                className={`h-3 w-[5px] rounded-[1px] ${i < activeCount ? "bg-brass" : "bg-line"}`}
              />
            ))}
          </div>
        </div>
        <p className="text-xs text-muted">{queued} in at least one queue</p>
      </section>

      <p className="eyebrow mb-3">Queues</p>
      <QueueBoard items={queues} members={members} admin={admin} compact />
    </>
  );
}
