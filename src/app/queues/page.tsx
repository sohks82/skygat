import { isAdmin } from "@/lib/auth";
import { getMembers, getQueues } from "@/lib/data";
import { QueueBoard } from "@/components/queue-board";
import { PageHead } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function QueuesPage() {
  const [admin, queues, members] = await Promise.all([isAdmin(), getQueues(), getMembers()]);

  return (
    <>
      <PageHead eyebrow="Who's waiting for what" title="Queues" />
      {admin ? (
        <p className="mb-5 max-w-2xl text-sm text-muted">
          Position 1 is next in line. Recording a win removes that member from the item&apos;s queue
          automatically, so you never have to remember to cross them off.
        </p>
      ) : null}
      <QueueBoard items={queues} members={members} admin={admin} />
    </>
  );
}
