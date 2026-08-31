import { ExcluirProdutoUseCase } from "../ports/in/ExcluirProdutoUseCase";
import { ProdutoRepository } from "../ports/out/ProdutoRepository";
import { RealtimeNotifier } from "../ports/out/RealtimeNotifier";

export class ExcluirProduto implements ExcluirProdutoUseCase {
  constructor(
    private readonly produtoRepository: ProdutoRepository,
    private readonly notifier: RealtimeNotifier
  ) {}

  async executar(codigoUnico: string): Promise<void> {
    const produto = await this.produtoRepository.buscarPorCodigo(codigoUnico.trim().toUpperCase());
    if (!produto) {
      throw new Error(`Produto com codigo '${codigoUnico}' nao encontrado.`);
    }

    await this.produtoRepository.excluir(produto.id);
    this.notifier.notificarProdutoExcluido(produto.id);
  }
}
