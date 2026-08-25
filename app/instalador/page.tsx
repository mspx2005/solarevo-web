import { redirect } from "next/navigation";

// =============================================================================
// SPRINT 2 — MÓDULO INSTALADOR
// Rota: /instalador
// Tipo: Server Component (Next.js App Router)
//
// Este arquivo substitui integralmente o fluxo legado client-side.
// A rota /instalador agora atua exclusivamente como ponto de entrada,
// redirecionando de forma imediata e server-side (HTTP 307) para o
// fluxo oficial do instalador em /instalador/dashboard.
//
// Conforme DOCUMENTO 4 (Arquitetura Consolidada):
// - Nenhuma consulta ao banco de dados é realizada neste arquivo.
// - Nenhum código é executado no client (zero JavaScript enviado ao browser).
// - A autenticação, autorização (role + ativo) e carga de dados permanecem
//   sob responsabilidade exclusiva de /instalador/dashboard (100% server-side).
// =============================================================================

export const dynamic = "force-dynamic";

export default function InstaladorPage() {
  redirect("/instalador/dashboard");
}
