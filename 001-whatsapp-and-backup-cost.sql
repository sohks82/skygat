-- Run once against an existing database. New installs get these from schema.sql.
-- Safe to re-run.

-- WhatsApp handle, used to @mention people in the auction announcement.
alter table members add column if not exists whatsapp text;

-- Optional second-slot cost. When null, the announcement reuses the main cost.
alter table items add column if not exists backup_cost integer;
