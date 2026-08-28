# SkyGat — Auction Control

Queue, item and auction-result management for the SkyGat alliance. Replaces the
shared spreadsheet.

- **Roster** capped at 25 active members, enforced on save.
- **Queues** per item, ordered. Position 1 is next in line.
- **Auction nights** typed War / League / Glory / Other. War nights default to 22:00.
- **Results** recorded per night, then completed and archived.
- **Winning an item removes that member from its queue automatically** and closes the gap.
  This is the step that used to get missed in the sheet.

Everyone can read the board. Editing needs an admin PIN.

---

## Deploy (about 15 minutes, free tier throughout)

### 1. Put the code on GitHub

```bash
cd skygat
git init && git add -A && git commit -m "SkyGat auction control"
gh repo create skygat --private --source=. --push
```

(Or create an empty repo on github.com and push to it.)

### 2. Create the Vercel project

1. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
2. Framework preset is detected as Next.js. Leave the build settings alone.
3. Deploy. The first build will succeed but the app will error on data — no database yet.

### 3. Attach a Neon database

1. In your Vercel project: **Storage → Create Database → Neon**.
2. Accept the free plan and connect it to the project.

Vercel injects `DATABASE_URL` automatically. You do not need to copy it by hand.

### 4. Set the two remaining environment variables

**Settings → Environment Variables**, for all environments:

| Name          | Value                                                     |
| ------------- | --------------------------------------------------------- |
| `ADMIN_PIN`   | Whatever you and your co-admins will type. Treat it as a password. |
| `AUTH_SECRET` | A long random string — run `openssl rand -hex 32`.         |

Redeploy so the new variables take effect.

### 5. Create the tables and load the sheet

Locally, with your Neon connection string (Neon dashboard → Connection Details):

```bash
cp .env.example .env
# paste DATABASE_URL into .env
npm install
npm run db:setup          # creates the tables
npm run db:import         # loads db/seed-source.csv
```

Expected output:

```
✓ 8 items
✓ 32 members (24 active, rest retired)
✓ 55 queue positions
✓ 76 nights, 165 result lines
```

Preview the import without writing anything:

```bash
node scripts/import-csv.mjs db/seed-source.csv --dry
```

`db:import` is safe to re-run — it clears queues, auctions and results and
rebuilds them, while members and items are upserted so hand-edits keep their ids.
Once you are live and editing in the app, stop running it.

If `db:setup` reports an error, the message names the exact statement that
failed — paste that, not just "it broke".

### 6. Unlock and check

Open the deployment, click **Unlock**, enter the PIN. Editing controls appear.

---

## Running it locally

```bash
npm install
npm run dev     # http://localhost:3000
```

Needs `.env` with `DATABASE_URL`, `ADMIN_PIN` and `AUTH_SECRET`.

---

## Using it

**Before the night.** Check the board. The next scheduled auction shows at the
top with a countdown. Each item card shows who is at the front of its queue.

**On the night.** Open the auction. Each item with a queue gets an **Award**
button next to whoever is first — one tap records the win, charges the listed
bullet cost and pulls them out of the queue. Use the row underneath for anything
irregular: split wins, items nobody took, a winner who was not at the front.

**After.** Mark completed, then archive. Archiving locks the night against
accidental edits. It stays in History and still counts toward member totals.
Reopen it if you need to correct something.

**Roster changes.** Retire a member to free a slot — this clears their queue
positions but keeps their result history. Reinstate them later if they come back.

**Item changes.** Names and bullet costs are editable at any time. Hiding an item
takes it off the board and the results form but keeps its queue and history, so a
rotating item can come back without retyping anything.

---

## What the import did to your sheet

Your spreadsheet used several spellings per person. These were merged:

| Kept          | Also seen as                                              |
| ------------- | --------------------------------------------------------- |
| `干林老师`     | 干林, Gan Lin Lao Shi, Gan Lin Teacher, GANLIN             |
| `S7RYD3R`     | Stryder, S7RYD3, S7RYDER, S7RYD3R666                       |
| `James Hunter`| Hunter                                                     |
| `CPxEX`       | CP                                                         |
| `AnewB`       | Anewb                                                      |
| `Dan_da`      | Dan da, Dan_dan                                            |
| `Tango`       | Tango1                                                     |
| `Xuanbing`    | Xuan Bing, Xuan                                            |

**`Bing`, `Xuanbing` and `冰仔` were kept as three separate people.** All three sit
in the Costume queue at the same time, and nobody can hold two positions in one
queue — so they cannot be the same person.

After merging, exactly 24 distinct people appear across your queues, against a
25-member cap. That is strong evidence the merge is right, but check the Members
page and correct anything wrong before you start using it in anger.

Members who have not appeared in any queue are imported as **retired** — history
intact, not occupying a roster slot. Reinstate anyone still active.

Every historical night was imported as **archived**. Dates were resolved by
matching the day-of-week in your `Day` column, so `25 Aug` + `Tue` lands on the
year where that is actually a Tuesday.

### Two costs to confirm

`Weapon Component` was set to **2000** from your column header. `Lucky Charm` has
never been auctioned and no cost appears anywhere, so it is set to **0** — fix it
on the Items page.

---

## Upgrading an existing deployment

New columns were added for the WhatsApp announcement. Run this once against your
Neon database — paste it into Neon's SQL Editor, or run `npm run db:migrate`:

```sql
alter table members add column if not exists whatsapp text;
alter table items add column if not exists backup_cost integer;
```

Safe to re-run. It adds columns only and touches no existing data.

## The WhatsApp announcement

On any auction night that is not yet archived, an announcement block sits above
the results form. It lists the first two people in every queue, skips items with
nobody waiting, and drops into a textarea you can edit before copying.

For it to name people correctly, set each member's **WhatsApp handle** on the
Members page — that is the `ZapZoom-SkyGat-pigu` part, not the in-game name.
Anyone without a handle falls back to their in-game name and is flagged in red
above the box.

The **backup cost** field on the Items page sets the price quoted to the second
person. Leave it blank and the main cost is used for both slots.

## Stack

Next.js 15 (App Router, server actions) · Neon Postgres · Tailwind v4 · Vercel.

At under 10 users and an auction every 2–3 days, this sits far inside the free
tiers of both Vercel and Neon. Neon's free tier idles an inactive database but
resumes on the next request, and your usage pattern will not hit it.

```
src/
  app/          pages and server actions
  components/   nav, queue board, shared UI
  lib/          db client, auth, queries, types
db/schema.sql   tables
scripts/        db:setup and db:import
```

Admin auth is a single shared PIN checked against `ADMIN_PIN`, held in a signed
httpOnly cookie for 30 days. It is a lock on a shared tool, not per-person
identity — anyone with the PIN is an admin, and actions are not attributed. If
you later want to know who changed what, that needs real accounts.
