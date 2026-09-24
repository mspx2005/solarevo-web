-- =====================================================================
-- SOLAREVO ENERTRACK — ADR-001 — RPC public.registrar_conclusao_os(uuid)
-- SQL PROPOSTO v1.2 (DEFINITIVO, ATÔMICO) — ESTADO: PROPOSTA. NÃO EXECUTAR.
-- Retorna ao Copilot para auditoria e autorização humana.
--
-- Base: definição real do Preflight (pg_get_functiondef) + Snapshot Bloco A:
--   owner = postgres (BYPASSRLS = true); EXECUTE atual: anon, authenticated,
--   service_role, postgres; public.is_integrador() valida apenas
--   profiles.role = 'integrador'; frontend chama com sessão autenticada.
--
-- Alterações v1.1 -> v1.2: atomicidade transacional — BEGIN; antes do CREATE OR
--   REPLACE e COMMIT; após o último GRANT. Função e grants inalterados.
--   Consultas de verificação permanecem comentadas, após o COMMIT.
-- Alterações v1.0 -> v1.1 (decisões aprovadas pela Governança):
--   AJUSTE 1 — Autorização estrita ROLE + OWNERSHIP:
--              instalador atribuído  OU  (public.is_integrador() AND projetos.user_id = auth.uid())
--   AJUSTE 2 — Revogação obrigatória de EXECUTE para anon e PUBLIC;
--              GRANT explícito para authenticated (bloco após a função).
--
-- Único objeto afetado: public.registrar_conclusao_os(uuid) (corpo, proconfig e ACL).
-- Assinatura, nome do parâmetro (p_os_id) e RETURNS TABLE preservados
-- (CREATE OR REPLACE sem DROP: owner e ACL existentes não são descartados).
-- =====================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.registrar_conclusao_os(p_os_id uuid)
 RETURNS TABLE(os_id uuid, data_real_conclusao date, dias_atraso integer, no_prazo boolean, conceito text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = pg_catalog, public
AS $function$
declare
  v_uid        uuid := auth.uid();   -- identidade do chamador (NULL sem JWT: anon / service_role)
  v_instalador uuid;                 -- os_instaladores.instalador_id (uuid NOT NULL — Preflight)
  v_owner      uuid;                 -- projetos.user_id (uuid NULL — Preflight) — ADR-001
  v_prevista   date;
  v_status     text;
  v_real       date := current_date;
  v_atraso     integer;
  v_no_prazo   boolean;
  v_conceito   text;
begin
  -- [ADR-001 / Bloqueio 1] Sessão sem identidade (auth.uid() NULL).
  -- Mantido mesmo após a revogação de EXECUTE para anon: defesa em profundidade
  -- (service_role permanece com EXECUTE e também não carrega auth.uid()).
  if v_uid is null then
    raise exception 'Acesso negado: sessão não autenticada.'
      using errcode = '42501';
  end if;

  -- Bloqueia a linha da OS para evitar conclusão concorrente duplicada (PRESERVADO)
  -- e captura o proprietário do projeto (ADR-001). Tipos comprovados no Preflight:
  -- projetos.id BIGINT = os_instaladores.projeto_id BIGINT (FK os_instaladores_projeto_id_fkey).
  -- LEFT JOIN + FOR UPDATE OF o: bloqueia somente a OS; nenhuma linha de projetos é bloqueada.
  select o.instalador_id, o.data_prevista_conclusao, o.status, p.user_id
    into v_instalador, v_prevista, v_status, v_owner
    from public.os_instaladores o
    left join public.projetos p on p.id = o.projeto_id
   where o.id = p_os_id
     for update of o;

  if not found then
    raise exception 'OS não encontrada.' using errcode = 'P0002';
  end if;

  -- [ADR-001 / Bloqueio 2 — AJUSTE 1] Autorização estrita: Capacidade (role) E Fronteira (ownership).
  -- Regra homologada: instalador atribuído
  --                   OU (integrador com role válida E proprietário do projeto).
  -- v_uid é não nulo neste ponto; se projetos.user_id for NULL, "v_uid = v_owner"
  -- resulta NULL (falso no ELSIF) e o acesso é negado — nunca concedido por omissão.
  if v_uid = v_instalador then
    null; -- Instalador atribuído autorizado (baseline preservada)
  elsif public.is_integrador() and v_uid = v_owner then
    null; -- Integrador com role válida E proprietário do projeto autorizado
  else
    raise exception 'Acesso negado: você não é o responsável por esta OS.'
      using errcode = '42501';
  end if;

  if v_status = 'concluida' then
    raise exception 'Esta OS já foi concluída anteriormente.' using errcode = 'P0001';
  end if;

  -- Cálculo automático de atraso (data_real > data_prevista) — PRESERVADO
  v_atraso   := greatest(0, v_real - v_prevista);
  v_no_prazo := (v_real <= v_prevista);
  v_conceito := case
                  when v_atraso = 0 then 'Excelente'
                  when v_atraso <= 2 then 'Bom'
                  when v_atraso <= 5 then 'Atenção'
                  else 'Crítico'
                end;

  -- Atualização de status — PRESERVADO
  update public.os_instaladores
     set data_real_conclusao = v_real,
         status = 'concluida'
   where id = p_os_id;

  -- Avaliação automática única por OS — PRESERVADO (UPSERT homologado FASE 6A.8/6A.9)
  insert into public.avaliacoes_instalador
  (
    os_id,
    instalador_id,
    data_prevista_conclusao,
    data_real_conclusao,
    dias_atraso,
    no_prazo,
    conceito
  )
  values
  (
    p_os_id,
    v_instalador,
    v_prevista,
    v_real,
    v_atraso,
    v_no_prazo,
    v_conceito
  )
  on conflict on constraint avaliacoes_instalador_os_id_key
  do update
  set
    data_real_conclusao     = excluded.data_real_conclusao,
    data_prevista_conclusao = excluded.data_prevista_conclusao,
    dias_atraso             = excluded.dias_atraso,
    no_prazo                = excluded.no_prazo,
    conceito                = excluded.conceito;

  return query select p_os_id, v_real, v_atraso, v_no_prazo, v_conceito;
end;
$function$;

-- =====================================================================
-- AJUSTE 2 — GRANTS (OBRIGATÓRIO). Evidência do Snapshot: anon possui EXECUTE.
-- Ordem: revogar primeiro, conceder depois. Idempotente.
-- =====================================================================
REVOKE EXECUTE ON FUNCTION public.registrar_conclusao_os(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.registrar_conclusao_os(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.registrar_conclusao_os(uuid) TO authenticated;

-- PONTO DE ATENÇÃO (preservação do estado evidenciado — sujeito à decisão do Copilot):
-- O Snapshot registrou EXECUTE para service_role. Se esse privilégio derivava apenas
-- de PUBLIC (e não de um GRANT explícito), o REVOKE FROM PUBLIC acima o removeria
-- silenciosamente. A linha abaixo apenas preserva o estado comprovado no Snapshot;
-- não amplia privilégios. Remover a linha caso a Governança decida restringir service_role.
GRANT  EXECUTE ON FUNCTION public.registrar_conclusao_os(uuid) TO service_role;

COMMIT;

-- =====================================================================
-- VERIFICAÇÃO IMEDIATA (somente leitura; fora da transação, após o COMMIT) — esperado:
--   grantee ∈ {authenticated, service_role, postgres}; SEM anon; SEM PUBLIC.
-- =====================================================================
-- SELECT grantee, privilege_type
--   FROM information_schema.routine_privileges
--  WHERE routine_schema = 'public' AND routine_name = 'registrar_conclusao_os'
--  ORDER BY grantee;
-- SELECT prosecdef, proconfig FROM pg_proc
--  WHERE oid = 'public.registrar_conclusao_os(uuid)'::regprocedure;
--   -- esperado: true | {"search_path=pg_catalog, public"}
