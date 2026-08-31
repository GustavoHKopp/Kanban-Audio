export type AcaoComandoVoz =
  | "MOVER_PRODUTO"
  | "CRIAR_PRODUTO"
  | "EXCLUIR_PRODUTO"
  | "CRIAR_COR"
  | "CRIAR_TAMANHO"
  | "ABRIR_MODAL_CADASTRO"
  | "INFORMACAO_INCOMPLETA";

export interface DadosExtraidosComandoVoz {
  codigo: string | null;
  setorDestino: string | null;
  descricao: string | null;
  cor: string | null;
  tamanho: string | null;
}

export interface IntencaoComandoVoz {
  action: AcaoComandoVoz;
  data: DadosExtraidosComandoVoz;
  missingFields: string[];
  replyText: string;
}

export interface AiGateway {
  interpretarComando(transcricao: string, contexto: ContextoIA): Promise<IntencaoComandoVoz>;
}

export interface ContextoIA {
  setoresDisponiveis: string[];
  coresDisponiveis: string[];
  tamanhosDisponiveis: string[];
}
