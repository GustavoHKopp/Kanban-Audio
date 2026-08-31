import { ProdutoDetalhado } from "../../entities/Produto";
import { Cor } from "../../entities/Cor";
import { Tamanho } from "../../entities/Tamanho";

export interface RealtimeNotifier {
  notificarProdutoCriado(produto: ProdutoDetalhado): void;
  notificarProdutoMovido(produto: ProdutoDetalhado, setorOrigemId: string): void;
  notificarProdutoExcluido(produtoId: string): void;
  notificarCorCriada(cor: Cor): void;
  notificarTamanhoCriado(tamanho: Tamanho): void;
}
