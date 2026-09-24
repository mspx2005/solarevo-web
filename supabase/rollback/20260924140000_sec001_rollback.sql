-- =============================================================================
-- SOLAREVO ENERTRACK | ROLLBACK SEC-001
-- Restaura os grants existentes antes da migration 20260924140000.
-- ATENÇÃO: reabre a exposição anônima do SEG-01. Usar somente em regressão.
-- Não colocar este arquivo em supabase/migrations.
-- =============================================================================

begin;

grant execute on function public.get_os_instalador(uuid) to anon;
grant execute on function public.get_instaladores() to anon;
grant execute on function public.teste_fase6a() to anon;

commit;
