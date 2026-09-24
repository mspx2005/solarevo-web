-- =============================================================================
-- SOLAREVO ENERTRACK | VERIFICAÇÃO SEC-001 e ESC-001 (somente leitura)
-- Executar ANTES (linha de base) e DEPOIS da aplicação, em cada ambiente.
-- =============================================================================

-- 1) Permissões das funções afetadas
-- Esperado DEPOIS: anon_executa = false nas três; authenticated_executa = true
--                  em get_os_instalador e get_instaladores.
select p.proname as funcao,
       has_function_privilege('anon', p.oid, 'EXECUTE')          as anon_executa,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_executa,
       has_function_privilege('service_role', p.oid, 'EXECUTE')  as service_role_executa
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('get_os_instalador', 'get_instaladores', 'teste_fase6a',
                    'get_acompanhamento_publico', 'registrar_conclusao_os',
                    'get_os_operacional_instalador')
order by 1;
-- Controle: get_acompanhamento_publico deve permanecer anon_executa = true.

-- 2) Índices
-- Esperado DEPOIS: presentes idx_projetos_user_id e idx_arquivos_projeto_projeto_id;
--                  ausentes idx_os_instalador_id e idx_projetos_token;
--                  preservados idx_os_instaladores_instalador_id e
--                  projetos_acompanhamento_token_key.
select tablename, indexname
from pg_indexes
where schemaname = 'public'
  and tablename in ('projetos', 'arquivos_projeto', 'os_instaladores')
order by 1, 2;

-- 3) Uso do índice de ownership (confirmação de plano)
explain select id from public.projetos
where user_id = '00000000-0000-0000-0000-000000000000'::uuid;

-- =============================================================================
-- TESTES FUNCIONAIS (pela aplicação, com sessões reais)
-- SEC-T01  Instalador logado abre /instalador/dashboard ....... lista as OS
-- SEC-T02  Integrador abre /painel/projetos/[id]/atribuir-instalador ... lista instaladores
-- SEC-T03  Chamada anônima a get_os_instalador via REST ........ erro de permissão (42501)
-- SEC-T04  Chamada anônima a get_acompanhamento_publico ........ continua funcionando
-- SEC-T05  Regressão: atribuir instalador, criar OS, concluir OS, avaliação automática
-- =============================================================================
