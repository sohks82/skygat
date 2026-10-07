-- Run once against an existing database. Safe to re-run.
-- Settings an admin can change from inside the app, without a redeploy.
-- Environment variables stay as the defaults when no row is present.

create table if not exists settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);
