-- Apartments table
create table if not exists apartments (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  neighborhood text not null,
  address_label text not null,
  rent_monthly integer not null,
  beds numeric(3,1) not null,
  baths numeric(3,1) not null,
  sqft integer not null,
  photo_url text not null,
  created_at timestamptz default now()
);

-- Daily pairs table
create table if not exists daily_pairs (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  round_number smallint not null default 1,
  apartment_a_id uuid not null references apartments(id),
  apartment_b_id uuid not null references apartments(id),
  created_at timestamptz default now(),
  unique (date, round_number)
);

-- Votes table
create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null references daily_pairs(id),
  choice text not null check (choice in ('A', 'B')),
  created_at timestamptz default now()
);

-- Indexes
create index if not exists daily_pairs_date_idx on daily_pairs(date);
create index if not exists votes_pair_id_idx on votes(pair_id);

-- RLS Policies
alter table apartments enable row level security;
alter table daily_pairs enable row level security;
alter table votes enable row level security;

-- Apartments: public read, public insert (MVP - no auth)
create policy "apartments_select" on apartments for select using (true);
create policy "apartments_insert" on apartments for insert with check (true);

-- Daily pairs: public read, public insert (MVP - no auth)
create policy "daily_pairs_select" on daily_pairs for select using (true);
create policy "daily_pairs_insert" on daily_pairs for insert with check (true);

-- Votes: public read, public insert only
create policy "votes_select" on votes for select using (true);
create policy "votes_insert" on votes for insert with check (true);
