import { ProdutoDetalhado } from "../../entities/Produto";

export interface MoverProdutoInput {
  codigoUnico: string;
  nomeSetorDestino: string;
  nomeCor?: string | null;
  nomeTamanho?: string | null;
}

export interface MoverProdutoUseCase {
  executar(input: MoverProdutoInput): Promise<ProdutoDetalhado>;
}
