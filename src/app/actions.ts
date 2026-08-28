"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { requireAdmin, signIn, signOut } from "@/lib/auth";
import { MEMBER_LIMIT, defaultStartFor, type DayType } from "@/lib/types";

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}
function num(fd: FormData, key: string): number {
  return Number.parseInt(str(fd, key) || "0", 10) || 0;
}

function refreshAll() {
  revalidatePath("/", "layout");
}

/** Close gaps in an item's queue so positions run 1..n with no holes. */
async function resequence(itemId: number) {
  await sql`
    with ranked as (
      select id, row_number() over (order by position, id) as rn
      from queue_entries where item_id = ${itemId}
    )
    update queue_entries q set position = ranked.rn
    from ranked where ranked.id = q.id and q.position is distinct from ranked.rn
  `;
}

/* ---------------------------------- auth --------------------------------- */

export async function unlockAction(_prev: string | undefined, fd: FormData) {
  const ok = await signIn(str(fd, "pin"));
  if (!ok) return "That PIN doesn't match. Try again.";
  refreshAll();
  redirect("/");
}

export async function lockAction() {
  await signOut();
  refreshAll();
  redirect("/");
}

/* -------------------------------- members -------------------------------- */

export async function addMemberAction(fd: FormData) {
  await requireAdmin();
  const name = str(fd, "name");
  if (!name) throw new Error("Give the member a name.");

  const [{ n }] = (await sql`select count(*)::int as n from members where active`) as { n: number }[];
  if (n >= MEMBER_LIMIT) {
    throw new Error(`SkyGat is full at ${MEMBER_LIMIT} active members. Retire someone first.`);
  }

  const aliases = str(fd, "aliases").split(",").map((a) => a.trim()).filter(Boolean);
  await sql`
    insert into members (name, aliases, whatsapp, note)
    values (${name}, ${aliases}, ${str(fd, "whatsapp") || null}, ${str(fd, "note") || null})
  `;
  refreshAll();
}

export async function updateMemberAction(fd: FormData) {
  await requireAdmin();
  const id = num(fd, "id");
  const name = str(fd, "name");
  if (!name) throw new Error("Give the member a name.");
  const aliases = str(fd, "aliases").split(",").map((a) => a.trim()).filter(Boolean);
  await sql`
    update members set
      name = ${name},
      aliases = ${aliases},
      whatsapp = ${str(fd, "whatsapp") || null},
      note = ${str(fd, "note") || null}
    where id = ${id}
  `;
  refreshAll();
}

/** Retire keeps history intact but frees a roster slot and clears their queue spots. */
export async function setMemberActiveAction(fd: FormData) {
  await requireAdmin();
  const id = num(fd, "id");
  const active = str(fd, "active") === "true";

  if (active) {
    const [{ n }] = (await sql`select count(*)::int as n from members where active`) as { n: number }[];
    if (n >= MEMBER_LIMIT) throw new Error(`SkyGat is full at ${MEMBER_LIMIT} active members.`);
  } else {
    const items = (await sql`select distinct item_id from queue_entries where member_id = ${id}`) as {
      item_id: number;
    }[];
    await sql`delete from queue_entries where member_id = ${id}`;
    for (const { item_id } of items) await resequence(item_id);
  }

  await sql`update members set active = ${active} where id = ${id}`;
  refreshAll();
}

export async function deleteMemberAction(fd: FormData) {
  await requireAdmin();
  await sql`delete from members where id = ${num(fd, "id")}`;
  refreshAll();
}

/* --------------------------------- items --------------------------------- */

export async function addItemAction(fd: FormData) {
  await requireAdmin();
  const name = str(fd, "name");
  if (!name) throw new Error("Give the item a name.");
  const [{ n }] = (await sql`select coalesce(max(sort_order), 0)::int as n from items`) as { n: number }[];
  await sql`insert into items (name, cost, sort_order) values (${name}, ${num(fd, "cost")}, ${n + 10})`;
  refreshAll();
}

export async function updateItemAction(fd: FormData) {
  await requireAdmin();
  const name = str(fd, "name");
  if (!name) throw new Error("Give the item a name.");
  const backup = str(fd, "backup_cost");
  await sql`
    update items set
      name = ${name},
      cost = ${num(fd, "cost")},
      backup_cost = ${backup ? Number.parseInt(backup, 10) : null}
    where id = ${num(fd, "id")}
  `;
  refreshAll();
}

export async function setItemActiveAction(fd: FormData) {
  await requireAdmin();
  await sql`update items set active = ${str(fd, "active") === "true"} where id = ${num(fd, "id")}`;
  refreshAll();
}

export async function moveItemAction(fd: FormData) {
  await requireAdmin();
  const id = num(fd, "id");
  const delta = num(fd, "delta");
  const rows = (await sql`select id, sort_order from items order by sort_order, id`) as {
    id: number;
    sort_order: number;
  }[];
  const i = rows.findIndex((r) => r.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= rows.length) return;
  await sql`update items set sort_order = ${rows[j].sort_order} where id = ${rows[i].id}`;
  await sql`update items set sort_order = ${rows[i].sort_order} where id = ${rows[j].id}`;
  refreshAll();
}

/* --------------------------------- queues -------------------------------- */

export async function joinQueueAction(fd: FormData) {
  await requireAdmin();
  const itemId = num(fd, "item_id");
  const memberId = num(fd, "member_id");
  if (!memberId) throw new Error("Pick a member to add.");

  const [{ n }] = (await sql`
    select coalesce(max(position), 0)::int as n from queue_entries where item_id = ${itemId}
  `) as { n: number }[];

  await sql`
    insert into queue_entries (item_id, member_id, position, note)
    values (${itemId}, ${memberId}, ${n + 1}, ${str(fd, "note") || null})
    on conflict (item_id, member_id) do nothing
  `;
  refreshAll();
}

export async function leaveQueueAction(fd: FormData) {
  await requireAdmin();
  const id = num(fd, "id");
  const rows = (await sql`delete from queue_entries where id = ${id} returning item_id`) as {
    item_id: number;
  }[];
  if (rows[0]) await resequence(rows[0].item_id);
  refreshAll();
}

export async function moveQueueAction(fd: FormData) {
  await requireAdmin();
  const id = num(fd, "id");
  const delta = num(fd, "delta");

  const [entry] = (await sql`select item_id, position from queue_entries where id = ${id}`) as {
    item_id: number;
    position: number;
  }[];
  if (!entry) return;

  const target = entry.position + delta;
  const [neighbour] = (await sql`
    select id from queue_entries where item_id = ${entry.item_id} and position = ${target}
  `) as { id: number }[];
  if (!neighbour) return;

  await sql`update queue_entries set position = -1 where id = ${id}`;
  await sql`update queue_entries set position = ${entry.position} where id = ${neighbour.id}`;
  await sql`update queue_entries set position = ${target} where id = ${id}`;
  refreshAll();
}

/** Drops the whole queue for one item. Used rarely — after a reset or a rule change. */
export async function clearQueueAction(fd: FormData) {
  await requireAdmin();
  await sql`delete from queue_entries where item_id = ${num(fd, "item_id")}`;
  refreshAll();
}

/* -------------------------------- auctions ------------------------------- */

export async function createAuctionAction(fd: FormData) {
  await requireAdmin();
  const date = str(fd, "date");
  if (!date) throw new Error("Pick a date for the auction.");
  const dayType = (str(fd, "day_type") || "War") as DayType;
  const startsAt = str(fd, "starts_at") || defaultStartFor(dayType);

  const rows = (await sql`
    insert into auctions (date, day_type, starts_at)
    values (${date}, ${dayType}, ${startsAt})
    on conflict (date) do update set day_type = excluded.day_type
    returning id
  `) as { id: number }[];

  refreshAll();
  redirect(`/auctions/${rows[0].id}`);
}

export async function updateAuctionAction(fd: FormData) {
  await requireAdmin();
  const id = num(fd, "id");
  const dayType = (str(fd, "day_type") || "War") as DayType;
  const startsAt = str(fd, "starts_at") || defaultStartFor(dayType);
  await sql`
    update auctions set day_type = ${dayType}, starts_at = ${startsAt}, notes = ${str(fd, "notes") || null}
    where id = ${id}
  `;
  refreshAll();
}

export async function setAuctionStatusAction(fd: FormData) {
  await requireAdmin();
  await sql`update auctions set status = ${str(fd, "status")} where id = ${num(fd, "id")}`;
  refreshAll();
}

export async function deleteAuctionAction(fd: FormData) {
  await requireAdmin();
  await sql`delete from auctions where id = ${num(fd, "id")}`;
  refreshAll();
  redirect("/auctions");
}

/* -------------------------------- results -------------------------------- */

/**
 * Records one line of the night's result. A win also pulls that member out of
 * the item's queue, which is the step that used to get missed in the sheet.
 */
export async function addResultAction(fd: FormData) {
  await requireAdmin();
  const auctionId = num(fd, "auction_id");
  const itemId = num(fd, "item_id");
  const outcome = str(fd, "outcome") || "won";
  const memberId = num(fd, "member_id") || null;
  const bulletsRaw = str(fd, "bullets");

  if (outcome === "won" && !memberId) throw new Error("Pick who won it.");

  let bullets: number | null = bulletsRaw ? Number.parseInt(bulletsRaw, 10) : null;
  if (bullets === null && outcome === "won") {
    const [item] = (await sql`select cost from items where id = ${itemId}`) as { cost: number }[];
    bullets = item?.cost ?? null;
  }

  await sql`
    insert into results (auction_id, item_id, member_id, outcome, bullets, note)
    values (${auctionId}, ${itemId}, ${memberId}, ${outcome}, ${bullets}, ${str(fd, "note") || null})
  `;

  if (outcome === "won" && memberId) {
    await sql`delete from queue_entries where item_id = ${itemId} and member_id = ${memberId}`;
    await resequence(itemId);
  }

  refreshAll();
}

/** Removing a win does not put the member back in the queue — re-add them if that's what you want. */
export async function deleteResultAction(fd: FormData) {
  await requireAdmin();
  await sql`delete from results where id = ${num(fd, "id")}`;
  refreshAll();
}
