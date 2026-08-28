-- SkyGat alliance auction manager — schema

create table if not exists members (
  id          serial primary key,
  name        text not null,
  aliases     text[] not null default '{}',
  whatsapp    text,
  active      boolean not null default true,
  note        text,
  created_at  timestamptz not null default now()
);
create unique index if not exists members_name_key on members (lower(name));

create table if not exists items (
  id          serial primary key,
  name        text not null,
  cost        integer not null default 0,
  backup_cost integer,
  sort_order  integer not null default 0,
  active      boolean not null default true
);
create unique index if not exists items_name_key on items (lower(name));

create table if not exists queue_entries (
  id          serial primary key,
  item_id     integer not null references items(id) on delete cascade,
  member_id   integer not null references members(id) on delete cascade,
  position    integer not null,
  note        text,
  created_at  timestamptz not null default now(),
  unique (item_id, member_id)
);
create index if not exists queue_entries_item_pos on queue_entries (item_id, position);

create table if not exists auctions (
  id          serial primary key,
  date        date not null unique,
  day_type    text not null default 'War',      -- War | League | Glory | Other
  starts_at   text,                              -- 'HH:MM', 22:00 on war days
  status      text not null default 'planned',   -- planned | completed | archived
  notes       text,
  created_at  timestamptz not null default now()
);
create index if not exists auctions_date_desc on auctions (date desc);

create table if not exists results (
  id          serial primary key,
  auction_id  integer not null references auctions(id) on delete cascade,
  item_id     integer not null references items(id) on delete cascade,
  member_id   integer references members(id) on delete set null,
  outcome     text not null default 'won',       -- won | missed | no_bid
  bullets     integer,
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists results_auction on results (auction_id);
create index if not exists results_member on results (member_id);
