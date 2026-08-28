/**
 * One-off import of the old Google Sheet.
 *
 *   node scripts/import-csv.mjs db/seed-source.csv
 *
 * Safe to re-run: it clears queues, auctions and results first, then rebuilds
 * them. Members and items are upserted, so anything you have already edited by
 * hand in the app keeps its id.
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const file = args.find((a) => !a.startsWith("--")) ?? "db/seed-source.csv";

// --dry parses the sheet and reports what it found without writing anything.
let fakeId = 0;
const sql = dry ? async () => [{ id: ++fakeId }] : neon(process.env.DATABASE_URL);

/* ------------------------------- csv parsing ------------------------------ */

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (c !== "\r") cell += c;
  }
  row.push(cell);
  rows.push(row);
  return rows;
}

/* ------------------------------ name handling ----------------------------- */

// Every spelling seen in the sheet, mapped to one canonical member.
const ALIASES = {
  anewb: "AnewB",
  bing: "Bing",
  "xuan bing": "Xuanbing",
  xuanbing: "Xuanbing",
  xuan: "Xuanbing",
  "冰仔": "冰仔",
  tango: "Tango",
  tango1: "Tango",
  tango2: "Tango2",
  cp: "CPxEX",
  cpxex: "CPxEX",
  "干林": "干林老师",
  "干林老师": "干林老师",
  "gan lin lao shi": "干林老师",
  "gan lin teacher": "干林老师",
  ganlin: "干林老师",
  hunter: "James Hunter",
  "james hunter": "James Hunter",
  stryder: "S7RYD3R",
  s7ryd3: "S7RYD3R",
  s7ryder: "S7RYD3R",
  s7ryd3r: "S7RYD3R",
  s7ryd3r666: "S7RYD3R",
  lacan: "Lacan",
  dan_da: "Dan_da",
  "dan da": "Dan_da",
  dan_dan: "Dan_da",
  wee: "Wee",
  jmark: "Jmark",
  taemin: "Taemin",
  green: "Green",
  newbie: "Newbie",
  moochi: "Moochi",
  pigu: "Pigu",
  inori: "Inori",
  lucky6: "Lucky6",
  all: "All",
  zee: "Zee",
  blizz: "Blizz",
  benjamin: "Benjamin",
  giggz: "Giggz",
  wishy: "Wishy",
  easyl: "EasyL",
  ssyy: "SSYY",
  tcy: "TCY",
  dlareg: "Dlareg",
  abc: "ABC",
};

const IGNORE = new Set(["1", "", "-"]);

// Every spelling actually seen in the sheet, keyed by canonical name, so the
// alias list in the app shows real variants with their original casing.
const SPELLINGS = {};

/** Splits a messy cell into { name, note, missed } entries. */
function parseCell(raw) {
  const text = (raw ?? "").trim();
  if (!text) return [];

  const missed = /missed/i.test(text);
  const body = missed ? text.replace(/missed/i, "").trim() : text;

  return body
    .split(/[,/\n]+/)
    .map((piece) => {
      let note = null;
      const withoutParens = piece
        .replace(/\(([^)]*)\)/g, (_, inner) => {
          note = note ? `${note}; ${inner.trim()}` : inner.trim();
          return "";
        })
        .replace(/[()]/g, "")
        .trim();

      const key = withoutParens.toLowerCase();
      if (IGNORE.has(key)) return null;

      const name = ALIASES[key];
      if (!name) {
        if (withoutParens) console.warn(`  ? unrecognised name "${withoutParens}" — skipped`);
        return null;
      }
      (SPELLINGS[name] ??= new Set()).add(withoutParens);
      return { name, note, missed };
    })
    .filter(Boolean);
}

/* ------------------------------ date handling ----------------------------- */

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/** "25 Aug" + "Tue" -> "2026-08-25". Picks the year whose weekday matches. */
function parseDate(dateCell, dayCell) {
  const m = /^(\d{1,2})\s+([A-Za-z]{3})/.exec(dateCell.trim());
  if (!m) return null;
  const day = Number(m[1]);
  const month = MONTHS[m[2].toLowerCase()];
  if (month === undefined) return null;

  const wanted = DAY_NAMES.indexOf(dayCell.trim().slice(0, 3).toLowerCase());
  const thisYear = new Date().getFullYear();

  for (const year of [thisYear, thisYear - 1, thisYear - 2]) {
    const d = new Date(Date.UTC(year, month, day));
    if (wanted < 0 || d.getUTCDay() === wanted) return d.toISOString().slice(0, 10);
  }
  return new Date(Date.UTC(thisYear, month, day)).toISOString().slice(0, 10);
}

function normaliseDayType(raw) {
  const t = (raw ?? "").trim().toLowerCase();
  if (t.startsWith("war")) return "War";
  if (t.startsWith("league")) return "League";
  if (t.startsWith("glory")) return "Glory";
  return "Other";
}

/* --------------------------------- items ---------------------------------- */

const ITEMS = [
  { name: "Costume", cost: 2200 },
  { name: "Mech", cost: 2200 },
  { name: "Glory Mech", cost: 1650 },
  { name: "Mole", cost: 800 },
  { name: "Weapon Component", cost: 2000 },
  { name: "Adv Costume Disc", cost: 3000 },
  { name: "Adv Costume Frag", cost: 4000 },
  { name: "Lucky Charm", cost: 0 },
];

// Sheet column -> item name. Left block is results, right block is the live queue.
const RESULT_COLS = {
  3: "Costume",
  4: "Mech",
  5: "Adv Costume Disc",
  6: "Weapon Component",
  7: "Adv Costume Frag",
  8: "Mole",
};
const QUEUE_COLS = {
  10: "Costume",
  11: "Mech",
  12: "Glory Mech",
  13: "Mole",
  14: "Adv Costume Disc",
  15: "Adv Costume Frag",
  16: "Weapon Component",
  17: "Lucky Charm",
};

/* --------------------------------- import --------------------------------- */

const rows = parseCsv(readFileSync(file, "utf8")).slice(1); // drop header

console.log("Reading sheet…");

// Pass 1 — collect everyone and every queue, in order.
const queues = Object.fromEntries(Object.values(QUEUE_COLS).map((n) => [n, []]));
const nights = [];
const seen = new Set();

for (const row of rows) {
  for (const [col, item] of Object.entries(QUEUE_COLS)) {
    for (const e of parseCell(row[col])) {
      if (!queues[item].some((q) => q.name === e.name)) queues[item].push(e);
      seen.add(e.name);
    }
  }

  const date = parseDate(row[0] ?? "", row[1] ?? "");
  if (!date) continue;

  const lines = [];
  for (const [col, item] of Object.entries(RESULT_COLS)) {
    const entries = parseCell(row[col]);
    const wasMissed = /missed/i.test(row[col] ?? "");
    if (wasMissed && entries.length === 0) {
      lines.push({ item, name: null, outcome: "missed", note: (row[col] ?? "").trim() });
      continue;
    }
    for (const e of entries) {
      lines.push({ item, name: e.name, outcome: e.missed ? "missed" : "won", note: e.note });
      seen.add(e.name);
    }
  }
  nights.push({ date, dayType: normaliseDayType(row[2]), lines });
}

const inQueue = new Set(Object.values(queues).flatMap((q) => q.map((e) => e.name)));

console.log(`  ${seen.size} people, ${inQueue.size} currently queued, ${nights.length} nights`);

// Reset the volatile tables.
await sql`delete from results`;
await sql`delete from auctions`;
await sql`delete from queue_entries`;

// Items.
const itemId = {};
for (const [i, item] of ITEMS.entries()) {
  const [r] = await sql`
    insert into items (name, cost, sort_order) values (${item.name}, ${item.cost}, ${(i + 1) * 10})
    on conflict (lower(name)) do update set cost = excluded.cost, sort_order = excluded.sort_order
    returning id
  `;
  itemId[item.name] = r.id;
}
console.log(`✓ ${ITEMS.length} items`);

// Members. Active = currently sitting in at least one queue.
const memberId = {};
// Only variants that differ by more than casing are worth showing.
const aliasesFor = (canonical) =>
  [...(SPELLINGS[canonical] ?? [])]
    .filter((s) => s.toLowerCase() !== canonical.toLowerCase())
    .sort((a, b) => a.localeCompare(b));

for (const name of [...seen].sort()) {
  const [r] = await sql`
    insert into members (name, aliases, active)
    values (${name}, ${aliasesFor(name)}, ${inQueue.has(name)})
    on conflict (lower(name)) do update set aliases = excluded.aliases
    returning id
  `;
  memberId[name] = r.id;
}
console.log(`✓ ${seen.size} members (${inQueue.size} active, rest retired)`);

// Queues.
let queued = 0;
for (const [item, list] of Object.entries(queues)) {
  for (const [i, entry] of list.entries()) {
    await sql`
      insert into queue_entries (item_id, member_id, position, note)
      values (${itemId[item]}, ${memberId[entry.name]}, ${i + 1}, ${entry.note})
      on conflict (item_id, member_id) do nothing
    `;
    queued++;
  }
}
console.log(`✓ ${queued} queue positions`);

// Nights and results, all archived.
let lineCount = 0;
for (const night of nights) {
  const [a] = await sql`
    insert into auctions (date, day_type, starts_at, status)
    values (${night.date}, ${night.dayType}, ${night.dayType === "War" ? "22:00" : null}, 'archived')
    on conflict (date) do update set day_type = excluded.day_type
    returning id
  `;
  for (const line of night.lines) {
    await sql`
      insert into results (auction_id, item_id, member_id, outcome, bullets, note)
      values (
        ${a.id}, ${itemId[line.item]}, ${line.name ? memberId[line.name] : null},
        ${line.outcome},
        ${line.outcome === "won" ? (ITEMS.find((i) => i.name === line.item)?.cost ?? null) : null},
        ${line.note}
      )
    `;
    lineCount++;
  }
}
console.log(`✓ ${nights.length} nights, ${lineCount} result lines`);
console.log("\nImport complete.");
