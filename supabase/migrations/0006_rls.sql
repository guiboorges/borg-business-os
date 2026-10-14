-- Single-user RLS: full access for any authenticated user.
-- Public sign-ups are disabled in the dashboard, so "authenticated" = the founder.
-- The sync scripts use the service_role key, which bypasses RLS by design.

do $$
declare
  t text;
begin
  foreach t in array array[
    'leads', 'deals', 'activities', 'invoices',
    'goals', 'roadmap_items', 'agent_memory', 'conversations', 'messages'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "authenticated_all" on %I for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;
