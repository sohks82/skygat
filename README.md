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

Run any new migration once against your Neon database — paste into Neon's SQL
Editor, or run `npm run db:migrate`. All of these are safe to re-run and add
columns only, touching no existing data.

```sql
-- 001, WhatsApp announcement
alter table members add column if not exists whatsapp text;
alter table items add column if not exists backup_cost integer;

-- 002, item icons
alter table items add column if not exists icon text;
alter table items add column if not exists icon_updated_at timestamptz;
```

## Item icons

Each item can carry a small icon, shown on the Items page and on every queue
card. Click the square next to an item on the Items page to pick a file; the ✕
beside it removes one.

Images are resized to 128px square in your browser before upload, so a large
screenshot still lands as a few KB. They are stored in Postgres rather than on
disk, because Vercel's filesystem is wiped on every deploy and uploaded files
would disappear. Pages carry only a short URL — the image itself is served
separately and cached hard, with a version stamp so a replacement shows up
immediately.

PNG with a transparent background looks best against the dark panels.

## Exporting to CSV

Admins get an **Export CSV** button on two pages.

**Queues** gives the live state of every queue: item, both costs, position,
member, WhatsApp handle, note. One row per person waiting.

**History** gives every recorded result, newest night first: date, day type,
status, item, cost, member, outcome, bullets, note.

Both open as a download. Files are UTF-8 with a byte-order mark, so names like
冰仔 survive opening in Excel.

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

## Running a second alliance

One codebase serves any number of alliances. Each gets its own Vercel project,
its own Neon database and its own settings, so a fix made once reaches all of
them — there is no second repo to keep in step.

To add SkyGat2:

1. **New Neon database.** In Neon, create a second project (or a second database
   in the same project). Do not reuse the first — the two alliances must not
   share a roster.
2. **New Vercel project.** Import the *same* GitHub repo again at
   [vercel.com/new](https://vercel.com/new), naming it `skygat2`. Leave Root
   Directory blank. It gets its own URL.
3. **Attach the new database** via Storage, so `DATABASE_URL` points at it.
4. **Set the environment variables** below, for Production.
5. **Create the tables** by pasting `db/schema.sql` into Neon's SQL Editor for
   the new database. Skip `db:import` — that loads the first alliance's sheet.

| Variable | SkyGat | SkyGat2 |
| --- | --- | --- |
| `DATABASE_URL` | first Neon database | **second** Neon database |
| `ADMIN_PIN` | its own | its own |
| `AUTH_SECRET` | its own | its own |
| `ALLIANCE_NAME` | `SkyGat` (or unset) | `SkyGat2` |
| `THEME` | `brass` (or unset) | `jade` |
| `MEMBER_LIMIT` | `25` (or unset) | whatever that alliance runs |

Pushing to `main` now rebuilds both projects. Each reads its own variables, so
the same commit produces a steel-and-brass SkyGat and an indigo-and-jade SkyGat2
against separate data.

## Themes

`THEME` picks one of seven. An unrecognised value falls back to `brass`. Visit
**/themes** in the running app to see them all side by side.

| `THEME` | Look | Display face |
| --- | --- | --- |
| `brass` | Deep steel with warm amber (default) | Barlow Condensed |
| `jade` | Night indigo with jade and violet | Space Grotesk |
| `crimson` | Warm charcoal with ember and raspberry | Oswald |
| `azure` | Deep navy with electric blue | Rajdhani |
| `orchid` | Plum with magenta and teal | Archivo |
| `sand` | Sepia with pale gold | Saira Condensed |
| `slate` | Graphite with silver, near monochrome | IBM Plex Sans Condensed |

Each theme sets eleven colour tokens plus its own display type, so the themes
read as different products rather than one app recoloured. Only the active
theme's font is downloaded.

Every text colour in every theme clears WCAG AA contrast against its background,
and each theme keeps its accent and its danger colour at least 30° apart in hue
so an alert never reads as a highlight.

To add an eighth: copy a block in `src/app/globals.css`, change the tokens, then
add the name to `THEMES` and a font and `themeColor` entry in
`src/app/layout.tsx`.

## Changing the URL

Your address is the Vercel **project name** plus `.vercel.app`, so renaming the
project renames the site.

Vercel → **Settings → General → Project Name** → set it to `skygateauction` →
Save. The site is then at `skygateauction.vercel.app`.

Subdomains are lowercase; `skygateAuction` becomes `skygateauction`. If the name
is taken, pick another — it is global across all of Vercel.

The old `*.vercel.app` address stops working, so send the new link round. Nothing
else needs changing: the database, environment variables and deployments all
carry over.

For a real domain (`skygat.gg`, say), buy it anywhere and add it under
**Settings → Domains**. Vercel shows the DNS records to set. Free on the Hobby
plan; you only pay the registrar.

## Switching database provider

The app talks to any Postgres through `postgres.js`, so moving between providers
is a `DATABASE_URL` change and nothing else. Neon and Supabase both work, as does
anything else that speaks Postgres.

Neon is fine for this workload and there is no technical reason to move. If you
want Supabase anyway:

1. **Create the project** at [supabase.com](https://supabase.com) → New Project.
   Save the database password it shows you; it is not shown again.
2. **Copy the pooled connection string.** Project Settings → Database →
   Connection string → **Transaction pooler**, port **6543**. Use the pooler, not
   the direct connection on 5432 — serverless functions open and drop
   connections constantly and will exhaust a direct database.
3. **Create the tables.** With that URL in `.env` locally:
   ```bash
   npm run db:setup
   npm run db:migrate
   ```
   Or paste `db/schema.sql` into Supabase's SQL Editor.
4. **Move the data.** From a machine with `pg_dump`:
   ```bash
   pg_dump --data-only --no-owner "<neon-url>" > data.sql
   psql "<supabase-pooler-url>" < data.sql
   ```
   Or, with no data worth keeping, re-run `npm run db:import` and re-enter the
   WhatsApp handles and icons.
5. **Point Vercel at it.** Replace `DATABASE_URL` with the Supabase pooler URL,
   then redeploy.
6. **Check it.** Open the site and confirm the queues look right before deleting
   anything in Neon. Keep the Neon database for a week as a fallback.

Supabase pauses a free project after a week of no traffic; it wakes on the next
request, with the first one slow. At an auction every 2–3 days you will not hit
it.

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
