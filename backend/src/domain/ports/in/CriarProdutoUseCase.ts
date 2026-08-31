import { ProdutoDetalhado } from "../../entities/Produto";

export interface CriarProdutoInput {
  codigoUnico: string;
  descricao: string;
  nomeCor: string;
  nomeTamanho: string;
  nomeSetorInicial: string;
}

export interface CriarProdutoUseCase {
  executar(input: CriarProdutoInput): Promise<ProdutoDetalhado>;
}
