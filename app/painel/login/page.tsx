"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginIntegradorPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  // ===========================================================================
  // LÓGICA DE AUTENTICAÇÃO — PRESERVADA (Documento 4 §3).
  // Não alterada nesta tarefa. Mantém storageKey, validação de role e de `ativo`.
  // ===========================================================================
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });

    if (error || !data.user) {
      setErro("Credenciais inválidas. Verifique o e-mail e a senha.");
      setCarregando(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, ativo")
      .eq("id", data.user.id)
      .single();

    if (!profile || !profile.ativo) {
      await supabase.auth.signOut();
      setErro("Usuário inativo ou sem perfil associado.");
      setCarregando(false);
      return;
    }

    if (profile.role !== "integrador") {
      await supabase.auth.signOut();
      setErro("Acesso restrito ao perfil de Integrador.");
      setCarregando(false);
      return;
    }

    if (profile.role !== "integrador") {
  await supabase.auth.signOut();
  setErro("Acesso restrito ao perfil de Integrador.");
  setCarregando(false);
  return;
}

window.location.href = "/painel";
  }
  // =========================== FIM — não alterar =============================

  return (
    <main className="flex min-h-screen items-center justify-center bg-enertrack-slate-950 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-white/5 bg-enertrack-slate-800 p-8 shadow-2xl shadow-black/40">
        {/* Marca */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-enertrack-white">
            Ener<span className="text-enertrack-orange-main">Track</span>
          </h1>
          <p className="mt-1 text-sm text-enertrack-gray-light/70">
            Painel do Integrador
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-enertrack-gray-light"
            >
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full rounded-lg border border-white/10 bg-enertrack-slate-900 px-4 py-2.5 text-enertrack-white placeholder:text-enertrack-gray-light/40 outline-none transition focus:border-enertrack-orange-main focus:ring-2 focus:ring-enertrack-orange-main/40"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="senha"
              className="block text-sm font-medium text-enertrack-gray-light"
            >
              Senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-white/10 bg-enertrack-slate-900 px-4 py-2.5 text-enertrack-white placeholder:text-enertrack-gray-light/40 outline-none transition focus:border-enertrack-orange-main focus:ring-2 focus:ring-enertrack-orange-main/40"
            />
          </div>

          {erro && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-lg bg-enertrack-orange-main px-4 py-2.5 font-semibold text-enertrack-white transition-colors hover:bg-enertrack-orange-secondary focus:outline-none focus:ring-2 focus:ring-enertrack-orange-main/50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
