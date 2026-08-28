import { addItemAction, moveItemAction, setItemActiveAction, updateItemAction } from "@/app/actions";
import { isAdmin } from "@/lib/auth";
import { getItems, getQueues } from "@/lib/data";
import { Bullets, Empty, PageHead } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ItemsPage() {
  const [admin, items, queues] = await Promise.all([isAdmin(), getItems(true), getQueues()]);
  const depth = new Map(queues.map((q) => [q.id, q.queue.length]));

  return (
    <>
      <PageHead eyebrow="Names and bullet costs" title="Items" />

      {admin ? (
        <form action={addItemAction} className="panel mb-6 grid gap-2 p-3 sm:grid-cols-[1fr_140px_auto]">
          <input name="name" className="field" placeholder="Item name" required />
          <input name="cost" type="number" min="0" step="50" className="field" placeholder="Bullets" />
          <button className="btn btn-primary">Add item</button>
        </form>
      ) : null}

      <div className="panel divide-y divide-line">
        {items.length === 0 ? (
          <Empty>No items yet.</Empty>
        ) : (
          items.map((item, i) => (
            <div
              key={item.id}
              className={`grid gap-2 p-3 sm:grid-cols-[1fr_auto] sm:items-center ${
                item.active ? "" : "opacity-55"
              }`}
            >
              {admin ? (
                <form action={updateItemAction} className="grid gap-2 sm:grid-cols-[1fr_110px_110px_auto]">
                  <input type="hidden" name="id" value={item.id} />
                  <input name="name" defaultValue={item.name} className="field" required />
                  <input
                    name="cost"
                    type="number"
                    min="0"
                    step="50"
                    defaultValue={item.cost}
                    className="field font-mono"
                    title="Cost for the 1st slot"
                  />
                  <input
                    name="backup_cost"
                    type="number"
                    min="0"
                    step="50"
                    defaultValue={item.backup_cost ?? ""}
                    className="field font-mono"
                    placeholder="backup"
                    title="Cost for the 2nd slot — leave blank to reuse the main cost"
                  />
                  <button className="btn">Save</button>
                </form>
              ) : (
                <div className="flex items-baseline gap-3">
                  <span className="text-sm">{item.name}</span>
                  <Bullets n={item.cost} />
                </div>
              )}

              <div className="flex items-center gap-2 sm:justify-end">
                <span className="font-mono text-xs text-muted">{depth.get(item.id) ?? 0} queued</span>
                {admin ? (
                  <>
                    <MoveItem id={item.id} delta={-1} disabled={i === 0} glyph="▲" />
                    <MoveItem id={item.id} delta={1} disabled={i === items.length - 1} glyph="▼" />
                    <form action={setItemActiveAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="active" value={item.active ? "false" : "true"} />
                      <button className="btn btn-tiny">{item.active ? "Hide" : "Show"}</button>
                    </form>
                  </>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      <p className="mt-4 max-w-2xl text-xs text-muted">
        The second cost box is the price quoted to the backup in the WhatsApp announcement. Leave it
        blank and the main cost is used for both.
      </p>
      <p className="mt-2 max-w-2xl text-xs text-muted">
        Hidden items drop off the board and the results form but keep their queue and past results, so
        you can bring a rotating item back without retyping anything.
      </p>
    </>
  );
}

function MoveItem({ id, delta, disabled, glyph }: { id: number; delta: number; disabled: boolean; glyph: string }) {
  return (
    <form action={moveItemAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="delta" value={delta} />
      <button className="btn btn-ghost btn-tiny disabled:opacity-25" disabled={disabled}>
        {glyph}
      </button>
    </form>
  );
}
