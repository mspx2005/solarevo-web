export type ResultadoAcao<T> =
  | { ok: true; dados: T }
  | { ok: false; erro: string };

/** Retorno da Server Action de envio da fatura ao Storage. */
export interface FaturaEnviada {
  projetoId: string;
  storagePath: string;
  fileUrl: string;
}

/** Contrato de saída de app/api/analisar-fatura/route.ts (valores podem chegar nulos ou como string). */
export interface RespostaAnaliseFatura {
  cliente_nome?: string | null;
  cpf_cliente?: string | null;
  endereco?: string | null;
  tipo_conexao?: string | null;
  classe?: string | null;
  media_consumo_kwh?: number | string | null;
}

/** Estado do formulário de conferência (strings para permitir edição livre). */
export interface DadosConferencia {
  cliente_nome: string;
  cliente_cnpj_cpf: string;
  cliente_endereco: string;
  tipo_conexao: string;
  classe: string;
  consumo_mensal_kwh: string;
  potencia_kwp: string;
}

/** Payload validado enviado à Server Action de criação do projeto. */
export interface CriarProjetoInput {
  projetoId: string;
  storagePath: string;
  cliente_nome: string;
  cliente_cnpj_cpf: string;
  cliente_endereco: string;
  tipo_conexao: string;
  classe: string;
  consumo_mensal_kwh: number;
  potencia_kwp: number;
}

export interface ProjetoCriado {
  projetoId: string;
}
