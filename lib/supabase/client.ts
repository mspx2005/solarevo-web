import { garantirAmbienteSupabase } from "@/lib/supabase/guarda-ambiente";
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  garantirAmbienteSupabase();
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storageKey: "solarevo-auth",
      },
    }
  );
}
