import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ROLE_PERMITIDA, TABELA_PERFIS } from "./constantes";

export type ClienteSupabaseServidor = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export interface ContextoIntegrador {
  supabase: ClienteSupabaseServidor;
  userId: string;
}

/**
 * Guarda de autenticação: exige sessão válida, role = 'integrador' e ativo = true.
 * Retorna null em qualquer falha (sem vazar o motivo ao cliente).
 */
export async function obterIntegradorAtivo(): Promise<ContextoIntegrador | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: erroUsuario,
  } = await supabase.auth.getUser();
  if (erroUsuario || !user) return null;

  const { data: perfil, error: erroPerfil } = await supabase
    .from(TABELA_PERFIS)
    .select("role, ativo")
    .eq("id", user.id)
    .maybeSingle();

  if (erroPerfil || !perfil) return null;
  if (perfil.role !== ROLE_PERMITIDA || perfil.ativo !== true) return null;

  return { supabase, userId: user.id };
}
