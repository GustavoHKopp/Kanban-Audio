import { Setor } from "../../entities/Setor";
import { Cor } from "../../entities/Cor";
import { Tamanho } from "../../entities/Tamanho";
import { ProdutoDetalhado } from "../../entities/Produto";

export interface QuadroCompleto {
  setores: Setor[];
  cores: Cor[];
  tamanhos: Tamanho[];
  produtos: ProdutoDetalhado[];
}

export interface ListarQuadroUseCase {
  executar(): Promise<QuadroCompleto>;
}
