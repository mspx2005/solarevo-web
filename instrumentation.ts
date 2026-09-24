import { garantirAmbienteSupabase } from "@/lib/supabase/guarda-ambiente";

/** Executado uma única vez na inicialização do servidor Next.js. */
export function register(): void {
  garantirAmbienteSupabase();
}
