-- =============================================================================
-- SOLAREVO ENERTRACK | ROLLBACK SEC-001
-- Restaura os privilégios efetivos existentes antes da migration 20260924140000.
-- ATENÇÃO: reabre a exposição anônima do SEG-01. Usar somente em regressão.
-- Não colocar este arquivo em supabase/migrations.
-- -----------------------------------------------------------------------------
-- Revisão 2 (PR #1): a migration revoga EXECUTE de PUBLIC e de anon; este
-- rollback restaura ambos (ressalva do Copilot e do Gemini, item 5).
--
-- Pré-condição obrigatória: a linha de base do roteiro de verificação
-- (seção 1, coluna public_executa) deve ter registrado public_executa = true
-- nas três funções. Se a linha de base registrou false para alguma função,
-- remover a linha "to public" correspondente antes de executar.
--
-- Critério de restauração exata: após o rollback, as colunas public_executa,
-- anon_executa, authenticated_executa e service_role_executa do roteiro de
-- verificação devem ser idênticas às da linha de base. (O texto de proacl
-- pode mudar de forma, de ACL implícita para explícita, sem alterar o
-- privilégio efetivo.)
-- =============================================================================

begin;

grant execute on function public.get_os_instalador(uuid) to public;
grant execute on function public.get_os_instalador(uuid) to anon;

grant execute on function public.get_instaladores() to public;
grant execute on function public.get_instaladores() to anon;

grant execute on function public.teste_fase6a() to public;
grant execute on function public.teste_fase6a() to anon;

commit;
