-- RLS single-user: acesso total a qualquer utilizador autenticado.
-- Os signups públicos estão desativados no painel, portanto "autenticado" = o fundador.
-- Scripts de sync usam a service_role key, que contorna RLS por design.

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
