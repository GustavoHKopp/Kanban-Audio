import { MoverProdutoUseCase, MoverProdutoInput } from "../ports/in/MoverProdutoUseCase";
import { ProdutoRepository } from "../ports/out/ProdutoRepository";
import { SetorRepository } from "../ports/out/SetorRepository";
import { RealtimeNotifier } from "../ports/out/RealtimeNotifier";
import { ProdutoDetalhado } from "../entities/Produto";

export class MoverProduto implements MoverProdutoUseCase {
  constructor(
    private readonly produtoRepository: ProdutoRepository,
    private readonly setorRepository: SetorRepository,
    private readonly notifier: RealtimeNotifier
  ) {}

  async executar(input: MoverProdutoInput): Promise<ProdutoDetalhado> {
    const codigoUnico = input.codigoUnico.trim().toUpperCase();

    const produto = await this.produtoRepository.buscarPorCodigo(codigoUnico);
    if (!produto) {
      throw new Error(`Produto com codigo '${codigoUnico}' nao encontrado.`);
    }

    const setorDestino = await this.setorRepository.buscarPorNome(input.nomeSetorDestino);
    if (!setorDestino) {
      throw new Error(`Setor de destino '${input.nomeSetorDestino}' nao encontrado.`);
    }

    if (produto.idSetorAtual === setorDestino.id) {
      throw new Error(`Produto '${codigoUnico}' ja esta no setor '${input.nomeSetorDestino}'.`);
    }

    const setorOrigemId = produto.idSetorAtual;
    await this.produtoRepository.atualizarSetor(produto.id, setorDestino.id);

    const produtos = await this.produtoRepository.listarTodosDetalhado();
    const produtoAtualizado = produtos.find((p) => p.id === produto.id);
    if (!produtoAtualizado) {
      throw new Error("Falha ao recuperar produto atualizado.");
    }

    this.notifier.notificarProdutoMovido(produtoAtualizado, setorOrigemId);
    return produtoAtualizado;
  }
}
