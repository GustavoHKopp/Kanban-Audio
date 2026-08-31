import { ProdutoDetalhado } from "../entities/Produto";

export interface MoverCardParams {
  codigoUnico: string;
  nomeSetorDestino: string;
}

export interface MoverCard {
  executar(params: MoverCardParams): Promise<ProdutoDetalhado>;
}
