import {
  addMemberAction,
  deleteMemberAction,
  setMemberActiveAction,
  updateMemberAction,
} from "@/app/actions";
import { isAdmin } from "@/lib/auth";
import { getMemberStats, getMembers, getQueues } from "@/lib/data";
import { MEMBER_LIMIT } from "@/lib/types";
import { Empty, PageHead } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const [admin, members, queues, stats] = await Promise.all([
    isAdmin(),
    getMembers(),
    getQueues(),
    getMemberStats(),
  ]);

  const active = members.filter((m) => m.active);
  const retired = members.filter((m) => !m.active);
  const full = active.length >= MEMBER_LIMIT;

  const queueCount = new Map<number, number>();
  for (const item of queues) {
    for (const q of item.queue) queueCount.set(q.member_id, (queueCount.get(q.member_id) ?? 0) + 1);
  }
  const statBy = new Map(stats.map((s) => [s.member_id, s]));

  return (
    <>
      <PageHead eyebrow={`${active.length} of ${MEMBER_LIMIT} slots used`} title="Members" />

      {admin ? (
        <form action={addMemberAction} className="panel mb-6 grid gap-2 p-3 sm:grid-cols-[1fr_1.5fr_auto]">
          <input name="name" className="field" placeholder="In-game name" required disabled={full} />
          <input
            name="whatsapp"
            className="field"
            placeholder="WhatsApp handle, e.g. ZapZoom-SkyGat-pigu"
            disabled={full}
          />
          <button className="btn btn-primary" disabled={full}>
            {full ? "Roster full" : "Add member"}
          </button>
          {full ? (
            <p className="text-xs text-danger sm:col-span-3">
              SkyGat caps at {MEMBER_LIMIT}. Retire someone below to free a slot.
            </p>
          ) : null}
        </form>
      ) : null}

      <p className="eyebrow mb-2">Active</p>
      <div className="panel mb-8 divide-y divide-line">
        {active.length === 0 ? (
          <Empty>No members yet.</Empty>
        ) : (
          active.map((m) => {
            const s = statBy.get(m.id);
            return (
              <div key={m.id} className="grid gap-2 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                {admin ? (
                  <form action={updateMemberAction} className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="aliases" value={m.aliases.join(", ")} />
                    <input name="name" defaultValue={m.name} className="field" required />
                    <input
                      name="whatsapp"
                      defaultValue={m.whatsapp ?? ""}
                      className="field"
                      placeholder="WhatsApp handle"
                    />
                    <button className="btn">Save</button>
                  </form>
                ) : (
                  <div>
                    <p className="text-sm">{m.name}</p>
                    {m.aliases.length ? (
                      <p className="text-xs text-muted">aka {m.aliases.join(", ")}</p>
                    ) : null}
                  </div>
                )}

                <div className="flex items-center gap-3 sm:justify-end">
                  <span className="font-mono text-xs text-muted">
                    {queueCount.get(m.id) ?? 0} queues · {s?.wins ?? 0} wins
                  </span>
                  {admin ? (
                    <form action={setMemberActiveAction}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="active" value="false" />
                      <button className="btn btn-tiny" title="Frees a roster slot and clears their queue spots">
                        Retire
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      {retired.length > 0 ? (
        <>
          <p className="eyebrow mb-2">Retired · history kept</p>
          <div className="panel divide-y divide-line">
            {retired.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3">
                <span className="flex-1 text-sm text-muted">
                  {m.name}
                  {m.aliases.length ? (
                    <span className="ml-2 text-xs">aka {m.aliases.join(", ")}</span>
                  ) : null}
                </span>
                {admin ? (
                  <>
                    <form action={setMemberActiveAction}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="active" value="true" />
                      <button className="btn btn-tiny" disabled={full}>
                        Reinstate
                      </button>
                    </form>
                    <form action={deleteMemberAction}>
                      <input type="hidden" name="id" value={m.id} />
                      <button
                        className="btn btn-ghost btn-tiny hover:text-danger"
                        title="Deletes them and their results permanently"
                      >
                        Delete
                      </button>
                    </form>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}
