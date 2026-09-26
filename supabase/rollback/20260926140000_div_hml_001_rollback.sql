-- =============================================================================
-- SOLAREVO ENERTRACK | ROLLBACK DIV-HML-001
-- Restaura, em HOMOLOGAÇÃO, os privilégios efetivos anteriores à migration
-- 20260926140000 (anon = true nas quatro funções).
-- -----------------------------------------------------------------------------
-- PROIBIDO EM PRODUÇÃO: em produção este script ABRIRIA a execução anônima de
-- quatro RPCs (três delas de escrita). Usar somente no teste de rollback em
-- enertrack-homologacao (mndakmmskvqtdndqromg).
-- Não colocar este arquivo em supabase/migrations.
--
-- Pré-condição: a M0 de homologação registrou public_executa = false nas
-- quatro funções; por isso este rollback não concede EXECUTE a PUBLIC.
-- Critério: após o rollback (M2), as colunas anon, authenticated, service_role
-- e public_executa das dez funções devem ser idênticas às da M0 de homologação.
-- =============================================================================

begin;

grant execute on function public.get_os_operacional_instalador(bigint) to anon;
grant execute on function public.atualizar_status_instalacao(bigint, text) to anon;
grant execute on function public.atualizar_etapas_instalacao(bigint, text) to anon;
grant execute on function public.registrar_evidencia_instalacao(bigint, text, text) to anon;

commit;
