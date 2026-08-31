import { Produto, ProdutoDetalhado } from "../../entities/Produto";

export interface CriarProdutoDTO {
  codigoUnico: string;
  descricao: string;
  idCor: string;
  idTamanho: string;
  idSetorAtual: string;
}

export interface ProdutoRepository {
  criar(dados: CriarProdutoDTO): Promise<Produto>;
  buscarPorCodigo(codigoUnico: string): Promise<Produto | null>;
  buscarPorId(id: string): Promise<Produto | null>;
  atualizarSetor(id: string, idSetorAtual: string): Promise<Produto>;
  excluir(id: string): Promise<void>;
  listarTodosDetalhado(): Promise<ProdutoDetalhado[]>;
}
