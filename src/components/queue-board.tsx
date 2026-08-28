import { joinQueueAction, leaveQueueAction, moveQueueAction } from "@/app/actions";
import { Bullets } from "@/components/ui";
import type { ItemWithQueue, Member } from "@/lib/types";

export function QueueBoard({
  items,
  members,
  admin,
  compact = false,
}: {
  items: ItemWithQueue[];
  members: Member[];
  admin: boolean;
  compact?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <QueueCard key={item.id} item={item} members={members} admin={admin} compact={compact} />
      ))}
    </div>
  );
}

function QueueCard({
  item,
  members,
  admin,
  compact,
}: {
  item: ItemWithQueue;
  members: Member[];
  admin: boolean;
  compact: boolean;
}) {
  const visible = compact ? item.queue.slice(0, 4) : item.queue;
  const hidden = item.queue.length - visible.length;
  const available = members.filter((m) => m.active && !item.queue.some((q) => q.member_id === m.id));

  return (
    <section className="panel flex flex-col">
      <header className="flex items-start justify-between gap-3 border-b border-line px-3.5 py-3">
        <div className="min-w-0">
          <h2 className="truncate font-display text-[1.05rem] font-semibold leading-tight">{item.name}</h2>
          <Bullets n={item.cost} />
        </div>
        <span className="shrink-0 font-mono text-xs text-muted">
          {item.queue.length ? `${item.queue.length} waiting` : "empty"}
        </span>
      </header>

      {item.queue.length === 0 ? (
        <p className="px-3.5 py-6 text-center text-xs text-muted">
          Nobody queued. {admin ? "Add the first name below." : ""}
        </p>
      ) : (
        <ol className="divide-y divide-line/60">
          {visible.map((q, i) => {
            const next = i === 0;
            return (
              <li
                key={q.id}
                className={`flex items-center gap-2.5 py-1.5 pl-3 pr-2 ${
                  next ? "border-l-2 border-l-brass bg-brass/[0.055]" : "border-l-2 border-l-transparent"
                }`}
              >
                <span
                  className={`w-5 shrink-0 text-right font-mono text-[0.78rem] ${
                    next ? "text-brass" : "text-muted"
                  }`}
                >
                  {q.position}
                </span>

                <span className={`min-w-0 flex-1 truncate text-sm ${next ? "text-ink" : "text-ink/85"}`}>
                  {q.member_name}
                  {q.note ? <span className="ml-1.5 text-[0.7rem] text-muted">({q.note})</span> : null}
                </span>

                {next ? <span className="chip shrink-0 text-brass">Next</span> : null}

                {admin ? (
                  <span className="flex shrink-0 items-center">
                    <MoveButton id={q.id} delta={-1} disabled={i === 0} label="Move up" glyph="▲" />
                    <MoveButton
                      id={q.id}
                      delta={1}
                      disabled={i === item.queue.length - 1}
                      label="Move down"
                      glyph="▼"
                    />
                    <form action={leaveQueueAction}>
                      <input type="hidden" name="id" value={q.id} />
                      <button className="btn btn-ghost btn-tiny hover:text-danger" title="Remove from queue">
                        ✕
                      </button>
                    </form>
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}

      {hidden > 0 ? (
        <p className="border-t border-line px-3.5 py-1.5 text-[0.72rem] text-muted">+{hidden} more</p>
      ) : null}

      {admin && available.length > 0 ? (
        <form action={joinQueueAction} className="mt-auto flex gap-1.5 border-t border-line p-2.5">
          <input type="hidden" name="item_id" value={item.id} />
          <select name="member_id" className="field flex-1" defaultValue="" aria-label={`Add to ${item.name}`}>
            <option value="" disabled>
              Add member…
            </option>
            {available.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <button className="btn">Add</button>
        </form>
      ) : null}
    </section>
  );
}

function MoveButton({
  id,
  delta,
  disabled,
  label,
  glyph,
}: {
  id: number;
  delta: number;
  disabled: boolean;
  label: string;
  glyph: string;
}) {
  return (
    <form action={moveQueueAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="delta" value={delta} />
      <button className="btn btn-ghost btn-tiny disabled:opacity-25" disabled={disabled} title={label}>
        {glyph}
      </button>
    </form>
  );
}
