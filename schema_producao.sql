


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."atualizar_etapas_instalacao"("p_projeto_id" bigint, "p_etapas_instalacao" "text") RETURNS TABLE("projeto_id" bigint, "etapas_instalacao" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_atual_text text;
  v_atual_json jsonb;
  v_novo_json jsonb;
  v_resultado jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Acesso nao autorizado.'
      USING ERRCODE = '42501';
  END IF;

  IF p_projeto_id IS NULL OR p_projeto_id <= 0 THEN
    RAISE EXCEPTION 'Parametro p_projeto_id invalido.'
      USING ERRCODE = '22023';
  END IF;

  IF p_etapas_instalacao IS NULL
     OR btrim(p_etapas_instalacao) = '' THEN
    RAISE EXCEPTION 'Etapas da instalacao obrigatorias.'
      USING ERRCODE = '22023';
  END IF;

  BEGIN
    v_novo_json := p_etapas_instalacao::jsonb;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'JSON das etapas invalido.'
        USING ERRCODE = '22023';
  END;

  IF jsonb_typeof(v_novo_json) <> 'array'
     OR jsonb_array_length(v_novo_json) = 0 THEN
    RAISE EXCEPTION 'Etapas devem ser um array JSON nao vazio.'
      USING ERRCODE = '22023';
  END IF;

  SELECT p.etapas_instalacao
  INTO v_atual_text
  FROM public.projetos AS p
  WHERE p.id = p_projeto_id
    AND (
      EXISTS (
        SELECT 1
        FROM public.os_instaladores AS o
        WHERE o.projeto_id = p.id
          AND o.instalador_id = v_uid
      )
      OR (
        public.is_integrador()
        AND p.user_id = v_uid
      )
    )
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Recurso nao encontrado ou acesso nao autorizado.'
      USING ERRCODE = '42501';
  END IF;

  BEGIN
    v_atual_json := v_atual_text::jsonb;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Etapas atuais possuem formato invalido.'
        USING ERRCODE = '22023';
  END;

  IF jsonb_typeof(v_atual_json) <> 'array' THEN
    RAISE EXCEPTION 'Etapas atuais possuem formato invalido.'
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(v_novo_json) AS n(etapa)
    WHERE jsonb_typeof(n.etapa) <> 'object'
       OR NULLIF(btrim(n.etapa->>'id'), '') IS NULL
       OR NULLIF(btrim(n.etapa->>'label'), '') IS NULL
       OR jsonb_typeof(n.etapa->'concluida') <> 'boolean'
  ) THEN
    RAISE EXCEPTION 'Estrutura das etapas invalida.'
      USING ERRCODE = '22023';
  END IF;

  IF (
    SELECT count(*)
    FROM jsonb_array_elements(v_novo_json)
  ) <> (
    SELECT count(DISTINCT etapa->>'id')
    FROM jsonb_array_elements(v_novo_json) AS n(etapa)
  ) THEN
    RAISE EXCEPTION 'Existem identificadores de etapas duplicados.'
      USING ERRCODE = '22023';
  END IF;

  IF jsonb_array_length(v_novo_json)
     <> jsonb_array_length(v_atual_json) THEN
    RAISE EXCEPTION 'Nao e permitido adicionar ou remover etapas.'
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(v_atual_json) AS a(etapa)
    LEFT JOIN jsonb_array_elements(v_novo_json) AS n(etapa)
      ON n.etapa->>'id' = a.etapa->>'id'
    WHERE n.etapa IS NULL
       OR n.etapa->>'label'
          IS DISTINCT FROM a.etapa->>'label'
       OR n.etapa->>'data_prevista'
          IS DISTINCT FROM a.etapa->>'data_prevista'
  ) THEN
    RAISE EXCEPTION
      'Nao e permitido alterar id, label ou data prevista.'
      USING ERRCODE = '22023';
  END IF;

  SELECT jsonb_agg(
    jsonb_set(
      jsonb_set(
        a.etapa,
        '{concluida}',
        n.etapa->'concluida',
        true
      ),
      '{data_conclusao}',
      CASE
        WHEN (n.etapa->>'concluida')::boolean = false
          THEN 'null'::jsonb
        WHEN (a.etapa->>'concluida')::boolean = true
             AND a.etapa->'data_conclusao' IS NOT NULL
             AND a.etapa->'data_conclusao' <> 'null'::jsonb
          THEN a.etapa->'data_conclusao'
        ELSE to_jsonb(clock_timestamp())
      END,
      true
    )
    ORDER BY a.ordem
  )
  INTO v_resultado
  FROM jsonb_array_elements(v_atual_json)
    WITH ORDINALITY AS a(etapa, ordem)
  JOIN jsonb_array_elements(v_novo_json) AS n(etapa)
    ON n.etapa->>'id' = a.etapa->>'id';

  UPDATE public.projetos
  SET etapas_instalacao = v_resultado::text
  WHERE id = p_projeto_id;

  RETURN QUERY
  SELECT
    p_projeto_id,
    v_resultado::text;
END;
$$;


ALTER FUNCTION "public"."atualizar_etapas_instalacao"("p_projeto_id" bigint, "p_etapas_instalacao" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."atualizar_status_instalacao"("p_projeto_id" bigint, "p_novo_status" "text") RETURNS TABLE("projeto_id" bigint, "status_anterior" "text", "status_atual" "text", "data_inicio_instalacao" "text", "data_fim_instalacao" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_status_anterior text;
  v_status_normalizado text;
  v_data_inicio text;
  v_data_fim text;
  v_etapas_text text;
  v_etapas_json jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Acesso nao autorizado.'
      USING ERRCODE = '42501';
  END IF;

  IF p_projeto_id IS NULL OR p_projeto_id <= 0 THEN
    RAISE EXCEPTION 'Parametro p_projeto_id invalido.'
      USING ERRCODE = '22023';
  END IF;

  IF p_novo_status IS NULL
     OR p_novo_status NOT IN (
       'Pendente',
       'Em Andamento',
       'Concluído'
     )
  THEN
    RAISE EXCEPTION 'Status de instalacao invalido.'
      USING ERRCODE = '22023';
  END IF;

  SELECT
    p.status_instalacao,
    p.data_inicio_instalacao,
    p.data_fim_instalacao,
    p.etapas_instalacao
  INTO
    v_status_anterior,
    v_data_inicio,
    v_data_fim,
    v_etapas_text
  FROM public.projetos AS p
  WHERE p.id = p_projeto_id
    AND (
      EXISTS (
        SELECT 1
        FROM public.os_instaladores AS o
        WHERE o.projeto_id = p.id
          AND o.instalador_id = v_uid
      )
      OR (
        public.is_integrador()
        AND p.user_id = v_uid
      )
    )
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Recurso nao encontrado ou acesso nao autorizado.'
      USING ERRCODE = '42501';
  END IF;

  v_status_normalizado :=
    COALESCE(NULLIF(BTRIM(v_status_anterior), ''), 'Pendente');

  IF v_status_normalizado = p_novo_status THEN
    RETURN QUERY
    SELECT
      p_projeto_id,
      v_status_anterior,
      v_status_normalizado,
      v_data_inicio,
      v_data_fim;

    RETURN;
  END IF;

  IF NOT (
    (
      v_status_normalizado = 'Pendente'
      AND p_novo_status = 'Em Andamento'
    )
    OR (
      v_status_normalizado = 'Em Andamento'
      AND p_novo_status = 'Concluído'
    )
  ) THEN
    RAISE EXCEPTION
      'Transicao de status nao permitida: % para %.',
      v_status_normalizado,
      p_novo_status
      USING ERRCODE = 'P0001';
  END IF;

  IF p_novo_status = 'Concluído' THEN
    IF v_etapas_text IS NULL OR BTRIM(v_etapas_text) = '' THEN
      RAISE EXCEPTION
        'Nao e possivel concluir: etapas da instalacao ausentes.'
        USING ERRCODE = 'P0001';
    END IF;

    BEGIN
      v_etapas_json := v_etapas_text::jsonb;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION
          'Nao e possivel concluir: formato das etapas invalido.'
          USING ERRCODE = '22023';
    END;

    IF jsonb_typeof(v_etapas_json) <> 'array'
       OR jsonb_array_length(v_etapas_json) = 0
       OR EXISTS (
         SELECT 1
         FROM jsonb_array_elements(v_etapas_json) AS e(etapa)
         WHERE e.etapa->>'concluida' IS DISTINCT FROM 'true'
       )
    THEN
      RAISE EXCEPTION
        'Nao e possivel concluir: existem etapas pendentes.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  UPDATE public.projetos AS p
  SET
    status_instalacao = p_novo_status,
    data_inicio_instalacao =
      CASE
        WHEN p_novo_status = 'Em Andamento'
        THEN COALESCE(
          NULLIF(BTRIM(p.data_inicio_instalacao), ''),
          CURRENT_DATE::text
        )
        ELSE p.data_inicio_instalacao
      END,
    data_fim_instalacao =
      CASE
        WHEN p_novo_status = 'Concluído'
        THEN COALESCE(
          NULLIF(BTRIM(p.data_fim_instalacao), ''),
          CURRENT_DATE::text
        )
        ELSE p.data_fim_instalacao
      END
  WHERE p.id = p_projeto_id
  RETURNING
    p.status_instalacao,
    p.data_inicio_instalacao,
    p.data_fim_instalacao
  INTO
    v_status_normalizado,
    v_data_inicio,
    v_data_fim;

  RETURN QUERY
  SELECT
    p_projeto_id,
    v_status_anterior,
    v_status_normalizado,
    v_data_inicio,
    v_data_fim;
END;
$$;


ALTER FUNCTION "public"."atualizar_status_instalacao"("p_projeto_id" bigint, "p_novo_status" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."atualizar_status_instalacao"("p_projeto_id" bigint, "p_novo_status" "text") IS 'FASE 6A.5 - Atualizacao controlada do status operacional da instalacao';



CREATE OR REPLACE FUNCTION "public"."get_acompanhamento_publico"("p_token" "uuid") RETURNS TABLE("cliente_nome" "text", "potencia_kwp" numeric, "modulo_potencia_w" integer, "status_instalacao" "text", "seguro_equipamento_status" "text", "doc_diagrama_unifilar" "text", "etapa_homologacao_plataforma" "text")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT
    p.cliente_nome,
    p.potencia_kwp,
    p.modulo_potencia_w,
    p.status_instalacao,
    p.seguro_equipamento_status,
    p.doc_diagrama_unifilar,
    p.etapa_homologacao_plataforma
  FROM public.projetos p
  WHERE p.acompanhamento_token = p_token
  LIMIT 1;
$$;


ALTER FUNCTION "public"."get_acompanhamento_publico"("p_token" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_instaladores"() RETURNS TABLE("id" "uuid", "nome" "text", "email" "text", "telefone" "text", "ativo" boolean)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if not public.is_integrador() then
    raise exception 'Acesso negado: apenas integradores podem listar instaladores.'
      using errcode = '42501';
  end if;

  return query
    select p.id, p.nome, p.email, p.telefone, p.ativo
    from public.profiles p
    where p.role = 'instalador'
      and p.ativo = true
    order by p.nome;
end;
$$;


ALTER FUNCTION "public"."get_instaladores"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_os_instalador"("p_instalador_id" "uuid") RETURNS TABLE("id" "uuid", "projeto_id" bigint, "titulo" "text", "descricao" "text", "data_prevista_conclusao" "date", "data_real_conclusao" "date", "status" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF auth.uid() <> p_instalador_id
     AND NOT public.is_integrador()
  THEN
    RAISE EXCEPTION
      'Acesso negado: você não tem permissão para visualizar estas OS.'
      USING errcode = '42501';
  END IF;

  RETURN QUERY
    SELECT
      o.id,
      o.projeto_id,
      o.titulo,
      o.descricao,
      o.data_prevista_conclusao,
      o.data_real_conclusao,
      o.status,
      o.created_at
    FROM public.os_instaladores o
    WHERE o.instalador_id = p_instalador_id
    ORDER BY o.data_prevista_conclusao ASC;
END;
$$;


ALTER FUNCTION "public"."get_os_instalador"("p_instalador_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_os_operacional_instalador"("p_projeto_id" bigint) RETURNS TABLE("os_id" "uuid", "projeto_id" bigint, "titulo" "text", "descricao" "text", "status_os" "text", "cliente_nome" "text", "cliente_endereco" "text", "cliente_numero" "text", "cliente_bairro" "text", "cliente_cidade" "text", "cliente_estado" "text", "os_mesmo_endereco" boolean, "os_endereco" "text", "os_numero" "text", "os_bairro" "text", "os_cidade" "text", "os_estado" "text", "potencia_kwp" numeric, "modulo_potencia_w" numeric, "status_instalacao" "text", "etapas_instalacao" "text", "data_inicio_instalacao" "text", "data_fim_instalacao" "text", "seguro_obra_status" "text", "seguro_equipamento_status" "text")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := auth.uid();

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Acesso nao autorizado.'
      USING ERRCODE = '42501';
  END IF;

  IF p_projeto_id IS NULL OR p_projeto_id <= 0 THEN
    RAISE EXCEPTION 'Parametro p_projeto_id invalido.'
      USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT
    o.id,
    p.id,
    o.titulo,
    o.descricao,
    o.status,
    p.cliente_nome,
    p.cliente_endereco,
    p.cliente_numero,
    p.cliente_bairro,
    p.cliente_cidade,
    p.cliente_estado,
    p.os_mesmo_endereco,
    p.os_endereco,
    p.os_numero,
    p.os_bairro,
    p.os_cidade,
    p.os_estado,
    p.potencia_kwp,
    p.modulo_potencia_w,
    p.status_instalacao,
    p.etapas_instalacao,
    p.data_inicio_instalacao,
    p.data_fim_instalacao,
    p.seguro_obra_status,
    p.seguro_equipamento_status
  FROM public.projetos AS p
  INNER JOIN public.os_instaladores AS o
    ON o.projeto_id = p.id
  WHERE p.id = p_projeto_id
    AND (
      o.instalador_id = v_uid
      OR (
        public.is_integrador()
        AND p.user_id = v_uid
      )
    )
  ORDER BY o.created_at DESC NULLS LAST
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Recurso nao encontrado ou acesso nao autorizado.'
      USING ERRCODE = '42501';
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_os_operacional_instalador"("p_projeto_id" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_os_operacional_instalador"("p_projeto_id" bigint) IS 'FASE 6A.1 - RPC operacional do instalador com DTO minimo e validacao MultiTenant';



CREATE OR REPLACE FUNCTION "public"."is_integrador"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'integrador'
  );
$$;


ALTER FUNCTION "public"."is_integrador"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."registrar_conclusao_os"("p_os_id" "uuid") RETURNS TABLE("os_id" "uuid", "data_real_conclusao" "date", "dias_atraso" integer, "no_prazo" boolean, "conceito" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$declare
  v_instalador  uuid;
  v_prevista    date;
  v_status      text;
  v_real        date := current_date;
  v_atraso      integer;
  v_no_prazo    boolean;
  v_conceito    text;
begin
  -- Bloqueia a linha para evitar conclusão concorrente duplicada
  select o.instalador_id, o.data_prevista_conclusao, o.status
    into v_instalador, v_prevista, v_status
  from public.os_instaladores o
  where o.id = p_os_id
  for update;

  if not found then
    raise exception 'OS não encontrada.' using errcode = 'P0002';
  end if;

  -- Apenas o instalador responsável (ou integrador) pode concluir
  if auth.uid() <> v_instalador and not public.is_integrador() then
    raise exception 'Acesso negado: você não é o responsável por esta OS.'
      using errcode = '42501';
  end if;

  if v_status = 'concluida' then
    raise exception 'Esta OS já foi concluída anteriormente.' using errcode = 'P0001';
  end if;

  -- Cálculo automático de atraso (data_real > data_prevista)
  v_atraso   := greatest(0, v_real - v_prevista);
  v_no_prazo := (v_real <= v_prevista);
  v_conceito := case
                  when v_atraso = 0 then 'Excelente'
                  when v_atraso <= 2 then 'Bom'
                  when v_atraso <= 5 then 'Atenção'
                  else 'Crítico'
                end;

  update public.os_instaladores
     set data_real_conclusao = v_real,
         status = 'concluida'
   where id = p_os_id;

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
end;$$;


ALTER FUNCTION "public"."registrar_conclusao_os"("p_os_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."registrar_evidencia_instalacao"("p_projeto_id" bigint, "p_nome_arquivo" "text", "p_url_arquivo" "text") RETURNS TABLE("arquivo_id" bigint, "projeto_id" bigint, "categoria" "text", "modulo_origem" "text", "url_arquivo" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_arquivo_id bigint;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Acesso nao autorizado.'
      USING ERRCODE = '42501';
  END IF;

  IF p_projeto_id IS NULL OR p_projeto_id <= 0 THEN
    RAISE EXCEPTION 'Projeto invalido.'
      USING ERRCODE = '22023';
  END IF;

  IF p_nome_arquivo IS NULL
     OR btrim(p_nome_arquivo) = '' THEN
    RAISE EXCEPTION 'Nome do arquivo obrigatorio.'
      USING ERRCODE = '22023';
  END IF;

  IF p_url_arquivo IS NULL
     OR btrim(p_url_arquivo) = '' THEN
    RAISE EXCEPTION 'URL do arquivo obrigatoria.'
      USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.os_instaladores o
    WHERE o.projeto_id = p_projeto_id
      AND (
        o.instalador_id = v_uid
        OR (
          public.is_integrador()
          AND EXISTS (
            SELECT 1
            FROM public.projetos p
            WHERE p.id = o.projeto_id
              AND p.user_id = v_uid
          )
        )
      )
  ) THEN
    RAISE EXCEPTION
      'Recurso nao encontrado ou acesso nao autorizado.'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.arquivos_projeto (
    projeto_id,
    nome_arquivo,
    url_arquivo,
    categoria,
    modulo_origem
  )
  VALUES (
    p_projeto_id,
    p_nome_arquivo,
    p_url_arquivo,
    'evidencia_instalacao',
    'instalador_operacional'
  )
  RETURNING id
  INTO v_arquivo_id;

  RETURN QUERY
  SELECT
    v_arquivo_id,
    p_projeto_id,
    'evidencia_instalacao',
    'instalador_operacional',
    p_url_arquivo;
END;
$$;


ALTER FUNCTION "public"."registrar_evidencia_instalacao"("p_projeto_id" bigint, "p_nome_arquivo" "text", "p_url_arquivo" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."teste_fase6a"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN 'OK';
END;
$$;


ALTER FUNCTION "public"."teste_fase6a"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."_bkp_os_instaladores_f4a002" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "projeto_id" "uuid" NOT NULL,
    "instalador_id" "uuid" NOT NULL,
    "titulo" "text" NOT NULL,
    "descricao" "text",
    "data_prevista_conclusao" "date" NOT NULL,
    "data_real_conclusao" "date",
    "status" "text" DEFAULT 'pendente'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "os_instaladores_status_check" CHECK (("status" = ANY (ARRAY['pendente'::"text", 'em_andamento'::"text", 'concluida'::"text"])))
);


ALTER TABLE "public"."_bkp_os_instaladores_f4a002" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."_bkp_os_instaladores_f4a002_meta" (
    "id" bigint NOT NULL,
    "categoria" "text" NOT NULL,
    "nome" "text" NOT NULL,
    "ddl" "text" NOT NULL,
    "capturado_em" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."_bkp_os_instaladores_f4a002_meta" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."_bkp_os_instaladores_f4a002_meta_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."_bkp_os_instaladores_f4a002_meta_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."_bkp_os_instaladores_f4a002_meta_id_seq" OWNED BY "public"."_bkp_os_instaladores_f4a002_meta"."id";



CREATE TABLE IF NOT EXISTS "public"."arquivos_projeto" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "nome_arquivo" "text",
    "url_arquivo" "text",
    "categoria" "text",
    "modulo_origem" "text",
    "projeto_id" bigint
);


ALTER TABLE "public"."arquivos_projeto" OWNER TO "postgres";


ALTER TABLE "public"."arquivos_projeto" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."arquivos_projeto_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."avaliacoes_instalador" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "os_id" "uuid" NOT NULL,
    "instalador_id" "uuid" NOT NULL,
    "data_prevista_conclusao" "date" NOT NULL,
    "data_real_conclusao" "date" NOT NULL,
    "dias_atraso" integer DEFAULT 0 NOT NULL,
    "no_prazo" boolean DEFAULT true NOT NULL,
    "conceito" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "avaliacoes_instalador_conceito_check" CHECK (("conceito" = ANY (ARRAY['Excelente'::"text", 'Bom'::"text", 'Atenção'::"text", 'Crítico'::"text"])))
);


ALTER TABLE "public"."avaliacoes_instalador" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "nome" "text",
    "email" "text",
    "whatsapp" "text",
    "cpf" "text",
    "status" "text"
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


ALTER TABLE "public"."leads" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."leads_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."os_instaladores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "projeto_id" bigint NOT NULL,
    "instalador_id" "uuid" NOT NULL,
    "titulo" "text" NOT NULL,
    "descricao" "text",
    "data_prevista_conclusao" "date" NOT NULL,
    "data_real_conclusao" "date",
    "status" "text" DEFAULT 'pendente'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "os_instaladores_status_check" CHECK (("status" = ANY (ARRAY['pendente'::"text", 'em_andamento'::"text", 'concluida'::"text"])))
);


ALTER TABLE "public"."os_instaladores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "nome" "text" NOT NULL,
    "email" "text",
    "telefone" "text",
    "role" "text" DEFAULT 'NULL'::"text" NOT NULL,
    "ativo" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['integrador'::"text", 'instalador'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projetos" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" DEFAULT "gen_random_uuid"(),
    "cliente_nome" "text",
    "potencia_kwp" numeric,
    "tipo_sistema" "text",
    "possui_bateria" boolean DEFAULT false,
    "status" "text" DEFAULT '''Em análise'''::"text",
    "consumo_mensal_kwh" numeric DEFAULT '0'::numeric,
    "endereco" "text",
    "tipo_conexao" "text",
    "classe" "text",
    "cliente_id" bigint,
    "inversor_modelo" "text",
    "inversor_qtde" bigint,
    "inversor_potencia_w" numeric,
    "modulo_modelo" "text",
    "modulo_qtde" bigint,
    "modulo_potencia_w" numeric,
    "bateria_modelo" "text",
    "bateria_qtde" bigint,
    "bateria_potencia_w" numeric,
    "cliente_cnpj_cpf" "text",
    "cliente_endereco" "text",
    "cliente_numero" "text",
    "cliente_bairro" "text",
    "cliente_cidade" "text",
    "cliente_estado" "text",
    "cliente_cep" "text",
    "preco_venda" numeric,
    "tarifa_energia" numeric,
    "doc_art" "text",
    "doc_diagrama_unifilar" "text",
    "doc_memorial" "text",
    "doc_relatorio_ensaio" "text",
    "doc_planilha_compartilhamento" "text",
    "etapa_homologacao_plataforma" "text",
    "data_entrega_kit" "text",
    "data_inicio_instalacao" "text",
    "data_fim_instalacao" "text",
    "data_vistoria" "text",
    "tipo_telhado" "text",
    "status_instalacao" "text",
    "seguro_obra_status" "text",
    "seguro_equipamento_status" "text",
    "os_cep" "text",
    "os_endereco" "text",
    "os_numero" "text",
    "os_bairro" "text",
    "os_cidade" "text",
    "os_estado" "text",
    "os_mesmo_endereco" boolean,
    "projetos" "text",
    "etapas_instalacao" "text",
    "acompanhamento_token" "uuid" DEFAULT "gen_random_uuid"(),
    "data_prevista_conclusao" timestamp with time zone,
    "data_real_conclusao" timestamp with time zone,
    "fatura_url" "text",
    "proposta_url" "text"
);


ALTER TABLE "public"."projetos" OWNER TO "postgres";


COMMENT ON TABLE "public"."projetos" IS 'Projetos fotovoltaicos dos integradores';



ALTER TABLE "public"."projetos" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."projetos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."_bkp_os_instaladores_f4a002_meta" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."_bkp_os_instaladores_f4a002_meta_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."_bkp_os_instaladores_f4a002_meta"
    ADD CONSTRAINT "_bkp_os_instaladores_f4a002_meta_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."_bkp_os_instaladores_f4a002"
    ADD CONSTRAINT "_bkp_os_instaladores_f4a002_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."arquivos_projeto"
    ADD CONSTRAINT "arquivos_projeto_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."avaliacoes_instalador"
    ADD CONSTRAINT "avaliacoes_instalador_os_id_key" UNIQUE ("os_id");



ALTER TABLE ONLY "public"."avaliacoes_instalador"
    ADD CONSTRAINT "avaliacoes_instalador_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."os_instaladores"
    ADD CONSTRAINT "os_instaladores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projetos"
    ADD CONSTRAINT "projetos_acompanhamento_token_key" UNIQUE ("acompanhamento_token");



ALTER TABLE ONLY "public"."projetos"
    ADD CONSTRAINT "projetos_pkey" PRIMARY KEY ("id");



CREATE INDEX "_bkp_os_instaladores_f4a002_instalador_id_idx" ON "public"."_bkp_os_instaladores_f4a002" USING "btree" ("instalador_id");



CREATE INDEX "_bkp_os_instaladores_f4a002_projeto_id_idx" ON "public"."_bkp_os_instaladores_f4a002" USING "btree" ("projeto_id");



CREATE INDEX "idx_os_instalador_id" ON "public"."os_instaladores" USING "btree" ("instalador_id");



CREATE INDEX "idx_os_instaladores_instalador_id" ON "public"."os_instaladores" USING "btree" ("instalador_id");



CREATE INDEX "idx_os_instaladores_projeto_id" ON "public"."os_instaladores" USING "btree" ("projeto_id");



CREATE INDEX "idx_projetos_token" ON "public"."projetos" USING "btree" ("acompanhamento_token");



ALTER TABLE ONLY "public"."avaliacoes_instalador"
    ADD CONSTRAINT "avaliacoes_instalador_instalador_id_fkey" FOREIGN KEY ("instalador_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."avaliacoes_instalador"
    ADD CONSTRAINT "avaliacoes_instalador_os_id_fkey" FOREIGN KEY ("os_id") REFERENCES "public"."os_instaladores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."arquivos_projeto"
    ADD CONSTRAINT "fk_arquivos_projeto_projetos" FOREIGN KEY ("projeto_id") REFERENCES "public"."projetos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."os_instaladores"
    ADD CONSTRAINT "os_instaladores_instalador_id_fkey" FOREIGN KEY ("instalador_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."os_instaladores"
    ADD CONSTRAINT "os_instaladores_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "public"."projetos"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projetos"
    ADD CONSTRAINT "projetos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE "public"."_bkp_os_instaladores_f4a002" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."_bkp_os_instaladores_f4a002_meta" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "arquivos_delete_owner" ON "public"."arquivos_projeto" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projetos" "p"
  WHERE (("p"."id" = "arquivos_projeto"."projeto_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "arquivos_insert_owner" ON "public"."arquivos_projeto" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projetos" "p"
  WHERE (("p"."id" = "arquivos_projeto"."projeto_id") AND ("p"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."arquivos_projeto" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "arquivos_select_owner" ON "public"."arquivos_projeto" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projetos" "p"
  WHERE (("p"."id" = "arquivos_projeto"."projeto_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "arquivos_update_owner" ON "public"."arquivos_projeto" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projetos" "p"
  WHERE (("p"."id" = "arquivos_projeto"."projeto_id") AND ("p"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projetos" "p"
  WHERE (("p"."id" = "arquivos_projeto"."projeto_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "aval_select_integrador" ON "public"."avaliacoes_instalador" FOR SELECT TO "authenticated" USING ("public"."is_integrador"());



ALTER TABLE "public"."avaliacoes_instalador" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "leads_insert_public" ON "public"."leads" FOR INSERT WITH CHECK (true);



CREATE POLICY "leads_select_integrador" ON "public"."leads" FOR SELECT TO "authenticated" USING ("public"."is_integrador"());



CREATE POLICY "leads_update_integrador" ON "public"."leads" FOR UPDATE TO "authenticated" USING ("public"."is_integrador"()) WITH CHECK ("public"."is_integrador"());



CREATE POLICY "os_delete_integrador" ON "public"."os_instaladores" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projetos" "p"
  WHERE (("p"."id" = "os_instaladores"."projeto_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "os_insert_integrador" ON "public"."os_instaladores" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."profiles" "pr"
  WHERE (("pr"."id" = "auth"."uid"()) AND ("pr"."role" = 'integrador'::"text") AND ("pr"."ativo" = true)))) AND (EXISTS ( SELECT 1
   FROM "public"."projetos" "p"
  WHERE (("p"."id" = "os_instaladores"."projeto_id") AND ("p"."user_id" = "auth"."uid"()))))));



ALTER TABLE "public"."os_instaladores" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "os_select" ON "public"."os_instaladores" FOR SELECT TO "authenticated" USING ((("instalador_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."projetos" "p"
  WHERE (("p"."id" = "os_instaladores"."projeto_id") AND ("p"."user_id" = "auth"."uid"()))))));



CREATE POLICY "os_update_integrador" ON "public"."os_instaladores" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projetos" "p"
  WHERE (("p"."id" = "os_instaladores"."projeto_id") AND ("p"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projetos" "p"
  WHERE (("p"."id" = "os_instaladores"."projeto_id") AND ("p"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_select" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR "public"."is_integrador"()));



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



ALTER TABLE "public"."projetos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "projetos_delete_owner" ON "public"."projetos" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "projetos_insert_owner" ON "public"."projetos" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "projetos_select_owner" ON "public"."projetos" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "projetos_update_owner" ON "public"."projetos" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."atualizar_etapas_instalacao"("p_projeto_id" bigint, "p_etapas_instalacao" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."atualizar_etapas_instalacao"("p_projeto_id" bigint, "p_etapas_instalacao" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."atualizar_etapas_instalacao"("p_projeto_id" bigint, "p_etapas_instalacao" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."atualizar_status_instalacao"("p_projeto_id" bigint, "p_novo_status" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."atualizar_status_instalacao"("p_projeto_id" bigint, "p_novo_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."atualizar_status_instalacao"("p_projeto_id" bigint, "p_novo_status" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_acompanhamento_publico"("p_token" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_acompanhamento_publico"("p_token" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_acompanhamento_publico"("p_token" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_acompanhamento_publico"("p_token" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_instaladores"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_instaladores"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_instaladores"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_instaladores"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_os_instalador"("p_instalador_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_os_instalador"("p_instalador_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_os_instalador"("p_instalador_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_os_operacional_instalador"("p_projeto_id" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_os_operacional_instalador"("p_projeto_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_os_operacional_instalador"("p_projeto_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_integrador"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_integrador"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_integrador"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."registrar_conclusao_os"("p_os_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."registrar_conclusao_os"("p_os_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."registrar_conclusao_os"("p_os_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."registrar_conclusao_os"("p_os_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."registrar_evidencia_instalacao"("p_projeto_id" bigint, "p_nome_arquivo" "text", "p_url_arquivo" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."registrar_evidencia_instalacao"("p_projeto_id" bigint, "p_nome_arquivo" "text", "p_url_arquivo" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."registrar_evidencia_instalacao"("p_projeto_id" bigint, "p_nome_arquivo" "text", "p_url_arquivo" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."teste_fase6a"() TO "anon";
GRANT ALL ON FUNCTION "public"."teste_fase6a"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."teste_fase6a"() TO "service_role";



GRANT ALL ON TABLE "public"."_bkp_os_instaladores_f4a002" TO "anon";
GRANT ALL ON TABLE "public"."_bkp_os_instaladores_f4a002" TO "authenticated";
GRANT ALL ON TABLE "public"."_bkp_os_instaladores_f4a002" TO "service_role";



GRANT ALL ON TABLE "public"."_bkp_os_instaladores_f4a002_meta" TO "service_role";



GRANT ALL ON SEQUENCE "public"."_bkp_os_instaladores_f4a002_meta_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."_bkp_os_instaladores_f4a002_meta_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."_bkp_os_instaladores_f4a002_meta_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."arquivos_projeto" TO "anon";
GRANT ALL ON TABLE "public"."arquivos_projeto" TO "authenticated";
GRANT ALL ON TABLE "public"."arquivos_projeto" TO "service_role";



GRANT ALL ON SEQUENCE "public"."arquivos_projeto_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."arquivos_projeto_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."arquivos_projeto_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."avaliacoes_instalador" TO "anon";
GRANT ALL ON TABLE "public"."avaliacoes_instalador" TO "authenticated";
GRANT ALL ON TABLE "public"."avaliacoes_instalador" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON SEQUENCE "public"."leads_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."leads_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."leads_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."os_instaladores" TO "anon";
GRANT ALL ON TABLE "public"."os_instaladores" TO "authenticated";
GRANT ALL ON TABLE "public"."os_instaladores" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."projetos" TO "anon";
GRANT ALL ON TABLE "public"."projetos" TO "authenticated";
GRANT ALL ON TABLE "public"."projetos" TO "service_role";



GRANT ALL ON SEQUENCE "public"."projetos_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."projetos_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."projetos_id_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







