-- =============================================================================
-- SOLAREVO ENERTRACK | MIGRATION ESC-001
-- Índices de ownership e remoção de índices duplicados
-- -----------------------------------------------------------------------------
-- Origem ........ Fase 0 / Item 2 — REVALIDACAO_SEGURANCA_FASE0_ITEM2_2026-09-24
-- Achados ....... ESC-01, ESC-02
-- Escopo ........ Somente índices. Nenhuma tabela, policy ou função é alterada.
-- Estado ........ PROPOSTA — aguardando revisão (Gemini/Copilot) e homologação
-- Rollback ...... supabase/rollback/20260924140100_esc001_rollback.sql
-- Observação .... As tabelas atuais são pequenas; CREATE INDEX comum (sem
--                 CONCURRENTLY) é adequado e compatível com transação.
-- =============================================================================

begin;

-- ESC-01: todas as policies de ownership filtram por projetos.user_id.
create index if not exists idx_projetos_user_id
  on public.projetos using btree (user_id);

-- ESC-02: as policies de arquivos_projeto fazem join por projeto_id.
create index if not exists idx_arquivos_projeto_projeto_id
  on public.arquivos_projeto using btree (projeto_id);

-- ESC-02: duplicado de idx_os_instaladores_instalador_id (mesma coluna, mesmo tipo).
drop index if exists public.idx_os_instalador_id;

-- ESC-02: duplicado do índice único projetos_acompanhamento_token_key.
drop index if exists public.idx_projetos_token;

commit;
