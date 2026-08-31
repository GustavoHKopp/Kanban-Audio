import { Setor } from "./Setor";
import { Cor } from "./Cor";
import { Tamanho } from "./Tamanho";
import { ProdutoDetalhado } from "./Produto";

export interface QuadroCompleto {
  setores: Setor[];
  cores: Cor[];
  tamanhos: Tamanho[];
  produtos: ProdutoDetalhado[];
}
