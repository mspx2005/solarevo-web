/**
 * StatusBadge — tag de status do projeto.
 *
 * Acentos harmônicos sobre fundo escuro (tints translúcidos para legibilidade):
 *  - Laranja Secundário → estados de atenção/entrada (NOVO, ANÁLISE DE FATURA)
 *  - Azul Acento        → estados informativos/homologação
 *  - Verde Sucesso      → estados concluídos/ativos
 *
 * Nota de contraste: o "Azul Escuro" (#162456) não é usado como cor de TEXTO
 * sobre fundo escuro por falhar em contraste (WCAG). Para a camada de texto das
 * tags, usa-se o Azul Acento (#3080ff); o Azul Escuro permanece disponível para
 * superfícies sólidas, caso necessário.
 */

const STATUS_STYLES: Record<string, string> = {
  NOVO:
    "bg-enertrack-orange-secondary/15 text-enertrack-orange-secondary ring-enertrack-orange-secondary/30",
  "ANÁLISE DE FATURA":
    "bg-enertrack-blue-accent/15 text-enertrack-blue-accent ring-enertrack-blue-accent/30",
  "ANALISE DE FATURA":
    "bg-enertrack-blue-accent/15 text-enertrack-blue-accent ring-enertrack-blue-accent/30",
  "EM ANDAMENTO":
    "bg-enertrack-orange-main/15 text-enertrack-orange-main ring-enertrack-orange-main/30",
  HOMOLOGADO:
    "bg-enertrack-blue-accent/15 text-enertrack-blue-accent ring-enertrack-blue-accent/30",
  HOMOLOGAÇÃO:
    "bg-enertrack-blue-accent/15 text-enertrack-blue-accent ring-enertrack-blue-accent/30",
  "CONCLUÍDO":
    "bg-enertrack-green-success/15 text-enertrack-green-success ring-enertrack-green-success/30",
  CONCLUIDO:
    "bg-enertrack-green-success/15 text-enertrack-green-success ring-enertrack-green-success/30",
  ATIVO:
    "bg-enertrack-green-success/15 text-enertrack-green-success ring-enertrack-green-success/30",
};

const DEFAULT_STYLE =
  "bg-enertrack-slate-800 text-enertrack-gray-light/80 ring-white/10";

export function StatusBadge({ status }: { status: string }) {
  const chave = (status ?? "").trim().toUpperCase();
  const estilo = STATUS_STYLES[chave] ?? DEFAULT_STYLE;

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ${estilo}`}
    >
      {status}
    </span>
  );
}
