-- Every ledger row must belong to a user: rows with a null user_id are invisible to everyone
-- and are skipped by any per-user operation (listing, export, moving data between users).
-- Stops with a clear error (and rolls back) if orphaned rows still exist; assign or delete them first.
do $$
declare
  v_orphans text;
begin
  select string_agg(format('%s=%s', tbl, cnt), ', ')
    into v_orphans
  from (
    select 'funds' as tbl, count(*) as cnt from funds where user_id is null
    union all select 'accounts', count(*) from accounts where user_id is null
    union all select 'transactions', count(*) from transactions where user_id is null
    union all select 'scheduled_topups', count(*) from scheduled_topups where user_id is null
  ) counts
  where cnt > 0;

  if v_orphans is not null then
    raise exception 'Rows without user_id must be assigned or removed before this migration: %', v_orphans;
  end if;
end $$;

alter table funds            alter column user_id set not null;
alter table accounts         alter column user_id set not null;
alter table transactions     alter column user_id set not null;
alter table scheduled_topups alter column user_id set not null;

-- Rollback:
--   alter table funds            alter column user_id drop not null;
--   alter table accounts         alter column user_id drop not null;
--   alter table transactions     alter column user_id drop not null;
--   alter table scheduled_topups alter column user_id drop not null;
