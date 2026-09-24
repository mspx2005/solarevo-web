-- =============================================================================
-- SOLAREVO ENERTRACK | MIGRATION SEC-001
-- Revogação de EXECUTE para anon em RPCs que não devem ser públicas
-- -----------------------------------------------------------------------------
-- Origem ........ Fase 0 / Item 2 — REVALIDACAO_SEGURANCA_FASE0_ITEM2_2026-09-24
-- Achados ....... SEG-01 (ALTA), SEG-08 (BAIXA); grant desnecessário em get_instaladores
-- Escopo ........ SOMENTE permissões. Nenhum corpo de função é alterado.
-- Estado ........ PROPOSTA — aguardando revisão (Gemini/Copilot) e homologação
-- Ordem ......... 1) enertrack-homologacao  2) HT e regressão  3) produção após GO
-- Rollback ...... supabase/rollback/20260924140000_sec001_rollback.sql
-- Verificação ... supabase/verificacao/20260924_sec001_esc001_verificacao.sql
-- -----------------------------------------------------------------------------
-- Chamadores na aplicação (commit c0a93f3), ambos com sessão autenticada:
--   get_os_instalador  -> app/instalador/dashboard/page.tsx
--   get_instaladores   -> app/painel/projetos/[id]/atribuir-instalador/page.tsx
--   teste_fase6a       -> nenhum
-- =============================================================================

begin;

-- SEG-01: com auth.uid() nulo, a verificação interna resulta em NULL e não bloqueia.
revoke execute on function public.get_os_instalador(uuid) from public;
revoke execute on function public.get_os_instalador(uuid) from anon;
grant  execute on function public.get_os_instalador(uuid) to authenticated;
grant  execute on function public.get_os_instalador(uuid) to service_role;

-- Grant desnecessário: o corpo já nega não integradores.
revoke execute on function public.get_instaladores() from public;
revoke execute on function public.get_instaladores() from anon;
grant  execute on function public.get_instaladores() to authenticated;
grant  execute on function public.get_instaladores() to service_role;

-- SEG-08: função de teste da FASE 6A sem uso na aplicação.
revoke execute on function public.teste_fase6a() from public;
revoke execute on function public.teste_fase6a() from anon;

commit;
