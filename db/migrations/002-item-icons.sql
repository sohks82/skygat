-- Run once against an existing database. Safe to re-run.
-- Icons are stored in Postgres as small data URLs rather than on disk, because
-- Vercel's filesystem is ephemeral and uploads would vanish on the next deploy.

alter table items add column if not exists icon text;
alter table items add column if not exists icon_updated_at timestamptz;
