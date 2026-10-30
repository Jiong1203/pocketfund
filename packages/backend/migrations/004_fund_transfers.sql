-- Fund-to-fund transfers are stored as two TRANSFER rows (negative in the source fund,
-- positive in the destination fund) that share one transfer_group_id.
alter table transactions
  add column if not exists transfer_group_id uuid;

-- Every TRANSFER row belongs to a group, and only TRANSFER rows do.
alter table transactions drop constraint if exists transactions_transfer_group_check;
alter table transactions add constraint transactions_transfer_group_check
  check ((type = 'TRANSFER') = (transfer_group_id is not null));

create index if not exists idx_transactions_transfer_group
  on transactions(transfer_group_id)
  where transfer_group_id is not null;

-- Rollback:
--   drop index if exists idx_transactions_transfer_group;
--   alter table transactions drop constraint if exists transactions_transfer_group_check;
--   alter table transactions drop column if exists transfer_group_id;
