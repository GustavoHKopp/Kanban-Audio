import { ProdutoDetalhado } from "../entities/Produto";

export interface CriarProdutoParams {
  codigoUnico: string;
  descricao: string;
  nomeCor: string;
  nomeTamanho: string;
  nomeSetorInicial: string;
}

export interface CriarProduto {
  executar(params: CriarProdutoParams): Promise<ProdutoDetalhado>;
}
