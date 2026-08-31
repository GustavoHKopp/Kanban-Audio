import { ProdutoDetalhado } from "../entities/Produto";

export interface DadosParciaisProduto {
  codigoUnico?: string;
  descricao?: string;
  nomeCor?: string;
  nomeTamanho?: string;
  nomeSetorInicial?: string;
}

export type AcaoResultadoComandoVoz =
  | "MOVER_PRODUTO"
  | "CRIAR_PRODUTO"
  | "EXCLUIR_PRODUTO"
  | "CRIAR_COR"
  | "CRIAR_TAMANHO"
  | "ABRIR_MODAL_CADASTRO"
  | "INFORMACAO_INCOMPLETA";

export interface ResultadoComandoVoz {
  sucesso: boolean;
  acao: AcaoResultadoComandoVoz;
  mensagem: string;
  produto?: ProdutoDetalhado;
  dadosParciais?: DadosParciaisProduto;
  missingFields?: string[];
}

export interface ProcessarComandoVoz {
  executar(transcricao: string): Promise<ResultadoComandoVoz>;
}

export const ACOES_EXECUTAVEIS = new Set<AcaoResultadoComandoVoz>([
  "MOVER_PRODUTO",
  "CRIAR_PRODUTO",
  "EXCLUIR_PRODUTO",
  "CRIAR_COR",
  "CRIAR_TAMANHO",
]);
