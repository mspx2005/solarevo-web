-- =============================================================================
-- SOLAREVO ENERTRACK | ROLLBACK ESC-001
-- Restaura exatamente o conjunto de índices anterior à migration 20260924140100.
-- Não colocar este arquivo em supabase/migrations.
-- =============================================================================

begin;

drop index if exists public.idx_projetos_user_id;
drop index if exists public.idx_arquivos_projeto_projeto_id;

create index if not exists idx_os_instalador_id
  on public.os_instaladores using btree (instalador_id);

create index if not exists idx_projetos_token
  on public.projetos using btree (acompanhamento_token);

commit;
