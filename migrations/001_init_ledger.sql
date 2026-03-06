create extension if not exists "pgcrypto";

create table if not exists funds (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  monthly_amount numeric(14,2),
  cycle_type text not null default 'monthly',
  cycle_day int not null default 1 check (cycle_day between 1 and 31),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references funds(id),
  account_id uuid not null references accounts(id),
  type text not null check (type in ('TOP_UP', 'EXPENSE', 'ADJUST', 'TRANSFER')),
  amount numeric(14,2) not null check (amount <> 0),
  description text,
  occurred_at timestamptz not null,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_fund_occurred
  on transactions(fund_id, occurred_at);

create index if not exists idx_transactions_account_occurred
  on transactions(account_id, occurred_at);

create index if not exists idx_transactions_type_occurred
  on transactions(type, occurred_at);

create table if not exists scheduled_topups (
  id uuid primary key default gen_random_uuid(),
  fund_id uuid not null references funds(id),
  account_id uuid not null references accounts(id),
  amount numeric(14,2) not null check (amount > 0),
  cycle_day int not null check (cycle_day between 1 and 31),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists scheduled_topup_runs (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references scheduled_topups(id),
  run_date date not null,
  created_at timestamptz not null default now(),
  unique (schedule_id, run_date)
);
