import { Server } from "socket.io";
import { RealtimeNotifier } from "../../../domain/ports/out/RealtimeNotifier";
import { ProdutoDetalhado } from "../../../domain/entities/Produto";
import { Cor } from "../../../domain/entities/Cor";
import { Tamanho } from "../../../domain/entities/Tamanho";

export class SocketIoNotifier implements RealtimeNotifier {
  constructor(private readonly io: Server) {}

  notificarProdutoCriado(produto: ProdutoDetalhado): void {
    this.io.emit("produto_criado", produto);
  }

  notificarProdutoMovido(produto: ProdutoDetalhado, setorOrigemId: string): void {
    this.io.emit("produto_movido", { produto, setorOrigemId });
  }

  notificarProdutoExcluido(produtoId: string): void {
    this.io.emit("produto_excluido", { produtoId });
  }

  notificarCorCriada(cor: Cor): void {
    this.io.emit("cor_criada", cor);
  }

  notificarTamanhoCriado(tamanho: Tamanho): void {
    this.io.emit("tamanho_criado", tamanho);
  }
}
