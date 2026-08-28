import { sql } from "./db";
import type { Auction, Item, ItemWithQueue, Member, QueueRow, ResultRow } from "./types";

export async function getMembers(): Promise<Member[]> {
  return (await sql`
    select id, name, aliases, whatsapp, active, note
    from members
    order by active desc, lower(name)
  `) as Member[];
}

export async function getActiveMemberCount(): Promise<number> {
  const rows = (await sql`select count(*)::int as n from members where active`) as { n: number }[];
  return rows[0]?.n ?? 0;
}

export async function getItems(includeInactive = false): Promise<Item[]> {
  return (includeInactive
    ? await sql`select id, name, cost, backup_cost, sort_order, active from items order by sort_order, id`
    : await sql`select id, name, cost, backup_cost, sort_order, active from items where active order by sort_order, id`) as Item[];
}

export async function getQueues(): Promise<ItemWithQueue[]> {
  const items = await getItems();
  const rows = (await sql`
    select q.id, q.item_id, q.member_id, q.position, q.note,
           m.name as member_name, m.whatsapp as member_whatsapp, m.active as member_active
    from queue_entries q
    join members m on m.id = q.member_id
    order by q.item_id, q.position
  `) as QueueRow[];

  return items.map((item) => ({ ...item, queue: rows.filter((r) => r.item_id === item.id) }));
}

export async function getAuctions(): Promise<Auction[]> {
  return (await sql`
    select id, date::text as date, day_type, starts_at, status, notes
    from auctions
    order by date desc
  `) as Auction[];
}

export async function getAuction(id: number): Promise<Auction | null> {
  const rows = (await sql`
    select id, date::text as date, day_type, starts_at, status, notes
    from auctions where id = ${id}
  `) as Auction[];
  return rows[0] ?? null;
}

/** The soonest auction that has not been completed or archived. */
export async function getUpcomingAuction(): Promise<Auction | null> {
  const rows = (await sql`
    select id, date::text as date, day_type, starts_at, status, notes
    from auctions
    where status = 'planned'
    order by date asc
    limit 1
  `) as Auction[];
  return rows[0] ?? null;
}

export async function getResults(auctionId: number): Promise<ResultRow[]> {
  return (await sql`
    select r.id, r.auction_id, r.item_id, r.member_id, r.outcome, r.bullets, r.note,
           i.name as item_name, i.cost as item_cost, m.name as member_name
    from results r
    join items i on i.id = r.item_id
    left join members m on m.id = r.member_id
    where r.auction_id = ${auctionId}
    order by i.sort_order, i.id, r.id
  `) as ResultRow[];
}

export type HistoryRow = ResultRow & { date: string; day_type: string; status: string };

export async function getHistory(limit = 300): Promise<HistoryRow[]> {
  return (await sql`
    select r.id, r.auction_id, r.item_id, r.member_id, r.outcome, r.bullets, r.note,
           i.name as item_name, i.cost as item_cost, m.name as member_name,
           a.date::text as date, a.day_type, a.status
    from results r
    join auctions a on a.id = r.auction_id
    join items i on i.id = r.item_id
    left join members m on m.id = r.member_id
    order by a.date desc, i.sort_order, i.id
    limit ${limit}
  `) as HistoryRow[];
}

export type MemberStat = { member_id: number; name: string; wins: number; bullets: number; last_win: string | null };

export async function getMemberStats(): Promise<MemberStat[]> {
  return (await sql`
    select m.id as member_id, m.name,
           count(r.id)::int as wins,
           coalesce(sum(coalesce(r.bullets, i.cost)), 0)::int as bullets,
           max(a.date)::text as last_win
    from members m
    left join results r on r.member_id = m.id and r.outcome = 'won'
    left join auctions a on a.id = r.auction_id
    left join items i on i.id = r.item_id
    where m.active
    group by m.id, m.name
    order by wins desc, lower(m.name)
  `) as MemberStat[];
}
