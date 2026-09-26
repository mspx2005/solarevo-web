-- =============================================================================
-- SOLAREVO ENERTRACK | VERIFICAÇÃO DIV-HML-001 — paridade de ACL (somente leitura)
-- -----------------------------------------------------------------------------
-- Executar em cada ambiente, conferindo o ref do projeto na barra de endereço:
--   homologação ... mndakmmskvqtdndqromg
--   produção ...... fmfxuxolnifcvhjsavwh
-- Momentos (homologação): M0 antes da migration; M1 após; M2 após rollback;
-- M3 após reaplicação. Produção: apenas a leitura de referência (M0).
-- =============================================================================

select p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as funcao,
       has_function_privilege('anon',          p.oid, 'EXECUTE') as anon,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated,
       has_function_privilege('service_role',  p.oid, 'EXECUTE') as service_role,
       exists (select 1
               from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
               where a.grantee = 0 and a.privilege_type = 'EXECUTE')  as public_executa,
       p.prosecdef                                                    as security_definer,
       coalesce(array_to_string(p.proconfig, ','), '')                as config,
       md5(pg_get_functiondef(p.oid))                                 as hash_corpo
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prokind = 'f'
order by 1;

-- -----------------------------------------------------------------------------
-- Referência: M0 de produção (26/09/2026) = resultado esperado em homologação
-- após a migration (M1 e M3). As dez linhas devem ser idênticas em todas as
-- colunas.
--
-- funcao                                  anon   auth  srv   public secdef
-- atualizar_etapas_instalacao(...)        false  true  true  false  true
-- atualizar_status_instalacao(...)        false  true  true  false  true
-- get_acompanhamento_publico(p_token)     true   true  true  false  true
-- get_instaladores()                      false  true  true  false  true
-- get_os_instalador(p_instalador_id)      false  true  true  false  true
-- get_os_operacional_instalador(...)      false  true  true  false  true
-- is_integrador()                         true   true  true  true   true
-- registrar_conclusao_os(p_os_id)         false  true  true  false  true
-- registrar_evidencia_instalacao(...)     false  true  true  false  true
-- teste_fase6a()                          false  true  true  false  false
--
-- Hash do corpo (md5), idêntico nos dois ambientes em 26/09/2026:
--   atualizar_etapas_instalacao ...... 54e4a2a133558b176e58b63f70532346
--   atualizar_status_instalacao ...... 02d19c0a87752717ae6f4c667b5a45a8
--   get_acompanhamento_publico ....... 0f797d199a0662e86932d7aace3df57a
--   get_instaladores ................. ec6c50fda2252563770ec1f938c3bcf5
--   get_os_instalador ................ e051eddfbb817ad9ced500624971341d
--   get_os_operacional_instalador .... 191c91efb1f6c5d25b8f264d03d60fe0
--   is_integrador .................... 61e0b4e3b44b9f6455656aca94d068cb
--   registrar_conclusao_os ........... 05e5d305cb7ceeda84f0494a0c49662d
--   registrar_evidencia_instalacao ... 86ae518502781801b98e8a46a9175843
--   teste_fase6a ..................... f610b478a8c2908d449364ee13b1ea04
--
-- Resultado esperado em M2 (após rollback, somente homologação): igual à M0 de
-- homologação, isto é, anon = true nas quatro funções da migration e demais
-- colunas inalteradas.
-- =============================================================================
