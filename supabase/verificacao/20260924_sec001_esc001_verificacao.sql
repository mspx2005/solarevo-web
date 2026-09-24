-- =============================================================================
-- SOLAREVO ENERTRACK | VERIFICAÇÃO SEC-001 e ESC-001 (somente leitura)
-- Revisão 2 (PR #1): resultados esperados explícitos por papel e por índice;
-- inclusão de PUBLIC e da ACL textual (ressalvas do Copilot, item 6).
-- Revisão 3 (PR #1): PUBLIC comprovado por dois métodos independentes
--   public_executa .. has_function_privilege('public', ...): forma documentada
--                     pelo PostgreSQL para o pseudo-papel PUBLIC
--   public_na_acl ... leitura direta da ACL via aclexplode (grantee = 0 é
--                     PUBLIC), incluindo a ACL padrão quando proacl é nula
--   As duas colunas devem sempre concordar.
-- -----------------------------------------------------------------------------
-- Executar e guardar o resultado em três momentos, em cada ambiente:
--   M0  LINHA DE BASE ... antes da migration
--   M1  APÓS MIGRATION .. depois da migration
--   M2  APÓS ROLLBACK ... somente no teste de rollback (homologação)
-- =============================================================================

-- 1) Privilégios efetivos das funções
select p.proname                                                  as funcao,
       has_function_privilege('public',        p.oid, 'EXECUTE') as public_executa,
       exists (select 1
               from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
               where a.grantee = 0 and a.privilege_type = 'EXECUTE')  as public_na_acl,
       has_function_privilege('anon',          p.oid, 'EXECUTE') as anon_executa,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_executa,
       has_function_privilege('service_role',  p.oid, 'EXECUTE') as service_role_executa,
       coalesce(p.proacl::text, '(padrão)')                       as acl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('get_os_instalador', 'get_instaladores', 'teste_fase6a',
                    'get_acompanhamento_publico', 'registrar_conclusao_os',
                    'get_os_operacional_instalador')
order by 1;

-- Resultado esperado em M1 (após migration):
--   (public = public_executa e public_na_acl, que devem concordar)
--   funcao                         public  anon   authenticated  service_role
--   get_os_instalador              false   false  true           true
--   get_instaladores               false   false  true           true
--   teste_fase6a                   false   false  igual a M0     igual a M0
--   get_acompanhamento_publico     igual a M0 em todas as colunas (anon = true)
--   registrar_conclusao_os         igual a M0 em todas as colunas (anon = false)
--   get_os_operacional_instalador  igual a M0 em todas as colunas (anon = false)
--
-- Resultado esperado em M2 (após rollback):
--   public_executa, public_na_acl, anon, authenticated e service_role idênticos
--   a M0 nas seis funções.

-- 2) Índices: definição completa (coluna, método e unicidade)
select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('projetos', 'arquivos_projeto', 'os_instaladores')
order by 1, 2;

-- Resultado esperado em M1 (após migration):
--   PRESENTES (novos):
--     idx_projetos_user_id ............. CREATE INDEX ... ON public.projetos USING btree (user_id)
--     idx_arquivos_projeto_projeto_id .. CREATE INDEX ... ON public.arquivos_projeto USING btree (projeto_id)
--   AUSENTES (removidos):
--     idx_os_instalador_id
--     idx_projetos_token
--   PRESERVADOS, com definição idêntica a M0:
--     idx_os_instaladores_instalador_id  CREATE INDEX ... ON public.os_instaladores USING btree (instalador_id)
--     projetos_acompanhamento_token_key  CREATE UNIQUE INDEX ... ON public.projetos USING btree (acompanhamento_token)
--     idx_os_instaladores_projeto_id, projetos_pkey, arquivos_projeto_pkey, os_instaladores_pkey
--
-- Resultado esperado em M2 (após rollback): lista e definições idênticas a M0.

-- 3) Uso do índice de ownership (somente em M1)
-- Esperado: plano com "Index Scan" ou "Bitmap Index Scan" em idx_projetos_user_id.
-- Em tabelas muito pequenas o planejador pode preferir "Seq Scan"; nesse caso,
-- registrar o plano e considerar o item atendido pela presença do índice.
explain select id from public.projetos
where user_id = '00000000-0000-0000-0000-000000000000'::uuid;

-- =============================================================================
-- TESTES FUNCIONAIS (pela aplicação, com sessões reais) — após M1
-- SEC-T01  Instalador logado abre /instalador/dashboard ........ lista as OS
-- SEC-T02  Integrador abre /painel/projetos/[id]/atribuir-instalador ... lista instaladores
-- SEC-T03  Chamada anônima a get_os_instalador via REST ......... erro de permissão
-- SEC-T04  Chamada anônima a get_acompanhamento_publico ......... continua funcionando
-- SEC-T05  Regressão: atribuir instalador, criar OS, concluir OS, avaliação automática
-- =============================================================================
