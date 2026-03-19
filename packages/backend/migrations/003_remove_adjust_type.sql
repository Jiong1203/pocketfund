-- Remove ADJUST from transaction type constraint
alter table transactions drop constraint if exists transactions_type_check;
alter table transactions add constraint transactions_type_check
  check (type in ('TOP_UP', 'EXPENSE', 'TRANSFER'));
