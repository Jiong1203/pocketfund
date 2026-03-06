create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

alter table funds
  add column if not exists user_id uuid references users(id);

alter table accounts
  add column if not exists user_id uuid references users(id);

alter table transactions
  add column if not exists user_id uuid references users(id);

alter table scheduled_topups
  add column if not exists user_id uuid references users(id);

create index if not exists idx_funds_user_id on funds(user_id);
create index if not exists idx_accounts_user_id on accounts(user_id);
create index if not exists idx_transactions_user_fund_occurred on transactions(user_id, fund_id, occurred_at);
create index if not exists idx_scheduled_topups_user_id on scheduled_topups(user_id);
