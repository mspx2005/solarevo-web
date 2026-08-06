// types/enertrack.ts
export type StatusOs = 'pendente' | 'em_andamento' | 'concluida'
export type ConceitoAvaliacao = 'Excelente' | 'Bom' | 'Atenção' | 'Crítico'

export interface OsInstalador {
  id: string
  projeto_id: string
  titulo: string
  descricao: string | null
  data_prevista_conclusao: string
  data_real_conclusao: string | null
  status: StatusOs
  created_at: string
}

export interface InstaladorAtivo {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  ativo: boolean
}

export interface AvaliacaoInstaladorDados {
  conceito: ConceitoAvaliacao
  dias_atraso: number
  no_prazo: boolean
  data_prevista_conclusao: string
  data_real_conclusao: string
}