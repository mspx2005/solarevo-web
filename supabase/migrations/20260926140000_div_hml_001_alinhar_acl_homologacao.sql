-- =============================================================================
-- SOLAREVO ENERTRACK | MIGRATION DIV-HML-001
-- Alinhamento da ACL de homologação à de produção: revogação de EXECUTE para
-- anon nas quatro RPCs operacionais do instalador
-- -----------------------------------------------------------------------------
-- Origem ........ Fase 0 / Item 0.4 — DIV-HML-001
-- Evidência ..... M0 comparativa de 26/09/2026 (homologação × produção):
--                 10 funções no schema public; corpo (md5), SECURITY DEFINER e
--                 search_path idênticos nos dois ambientes; única diferença:
--                 anon = true em homologação e anon = false em produção nas
--                 quatro funções abaixo.
-- Causa raiz .... A baseline 20260911113000 (dump de produção) não contém
--                 GRANT para anon nessas funções, mas também não contém REVOKE
--                 de anon. Ao recriar as funções em homologação, os privilégios
--                 padrão do Supabase no schema public concederam EXECUTE a
--                 anon, e o REVOKE ALL ... FROM PUBLIC da baseline não o retira.
-- Escopo ........ SOMENTE permissões. Nenhum corpo de função é alterado.
-- Ambiente ...... Aplicar SOMENTE em enertrack-homologacao (mndakmmskvqtdndqromg).
--                 Em produção o resultado já é o estado atual (idempotente),
--                 e a aplicação não é necessária.
-- Estado ........ PROPOSTA — aguardando autorização do Decisor
-- Rollback ...... supabase/rollback/20260926140000_div_hml_001_rollback.sql
-- Verificação ... supabase/verificacao/20260926_div_hml_001_paridade_acl.sql
-- -----------------------------------------------------------------------------
-- Chamadores na aplicação, todos com sessão autenticada do instalador:
--   app/instalador/os/[id]/page.tsx -> get_os_operacional_instalador,
--     atualizar_status_instalacao, atualizar_etapas_instalacao,
--     registrar_evidencia_instalacao
-- =============================================================================

begin;

revoke execute on function public.get_os_operacional_instalador(bigint) from public;
revoke execute on function public.get_os_operacional_instalador(bigint) from anon;
grant  execute on function public.get_os_operacional_instalador(bigint) to authenticated;
grant  execute on function public.get_os_operacional_instalador(bigint) to service_role;

revoke execute on function public.atualizar_status_instalacao(bigint, text) from public;
revoke execute on function public.atualizar_status_instalacao(bigint, text) from anon;
grant  execute on function public.atualizar_status_instalacao(bigint, text) to authenticated;
grant  execute on function public.atualizar_status_instalacao(bigint, text) to service_role;

revoke execute on function public.atualizar_etapas_instalacao(bigint, text) from public;
revoke execute on function public.atualizar_etapas_instalacao(bigint, text) from anon;
grant  execute on function public.atualizar_etapas_instalacao(bigint, text) to authenticated;
grant  execute on function public.atualizar_etapas_instalacao(bigint, text) to service_role;

revoke execute on function public.registrar_evidencia_instalacao(bigint, text, text) from public;
revoke execute on function public.registrar_evidencia_instalacao(bigint, text, text) from anon;
grant  execute on function public.registrar_evidencia_instalacao(bigint, text, text) to authenticated;
grant  execute on function public.registrar_evidencia_instalacao(bigint, text, text) to service_role;

commit;
