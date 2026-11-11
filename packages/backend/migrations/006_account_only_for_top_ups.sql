-- An account records where a top-up's money came from. Once money is in a fund, expenses and
-- fund-to-fund transfers only concern funds, so they no longer need an account.
-- Existing rows keep the account they already have.
alter table transactions alter column account_id drop not null;

alter table transactions drop constraint if exists transactions_top_up_account_check;
alter table transactions add constraint transactions_top_up_account_check
  check (type <> 'TOP_UP' or account_id is not null);

-- Rollback (rows saved without an account must be given one first, or set not null fails):
--   alter table transactions drop constraint if exists transactions_top_up_account_check;
--   alter table transactions alter column account_id set not null;
