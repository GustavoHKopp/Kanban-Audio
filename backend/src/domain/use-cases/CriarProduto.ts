import { CriarProdutoUseCase, CriarProdutoInput } from "../ports/in/CriarProdutoUseCase";
import { ProdutoRepository } from "../ports/out/ProdutoRepository";
import { SetorRepository } from "../ports/out/SetorRepository";
import { CorRepository } from "../ports/out/CorRepository";
import { TamanhoRepository } from "../ports/out/TamanhoRepository";
import { RealtimeNotifier } from "../ports/out/RealtimeNotifier";
import { ProdutoDetalhado } from "../entities/Produto";

export class CriarProduto implements CriarProdutoUseCase {
  constructor(
    private readonly produtoRepository: ProdutoRepository,
    private readonly setorRepository: SetorRepository,
    private readonly corRepository: CorRepository,
    private readonly tamanhoRepository: TamanhoRepository,
    private readonly notifier: RealtimeNotifier
  ) {}

  async executar(input: CriarProdutoInput): Promise<ProdutoDetalhado> {
    const codigoUnico = input.codigoUnico.trim().toUpperCase();
    if (!codigoUnico) {
      throw new Error("Codigo do produto e obrigatorio.");
    }

    const existente = await this.produtoRepository.buscarPorCodigo(codigoUnico);
    if (existente) {
      throw new Error(`Ja existe um produto com o codigo ${codigoUnico}.`);
    }

    const cor = await this.corRepository.buscarPorNome(input.nomeCor);
    if (!cor) {
      throw new Error(`Cor '${input.nomeCor}' nao encontrada.`);
    }

    const tamanho = await this.tamanhoRepository.buscarPorNome(input.nomeTamanho);
    if (!tamanho) {
      throw new Error(`Tamanho '${input.nomeTamanho}' nao encontrado.`);
    }

    const setor = await this.setorRepository.buscarPorNome(input.nomeSetorInicial);
    if (!setor) {
      throw new Error(`Setor '${input.nomeSetorInicial}' nao encontrado.`);
    }

    await this.produtoRepository.criar({
      codigoUnico,
      descricao: input.descricao?.trim() || codigoUnico,
      idCor: cor.id,
      idTamanho: tamanho.id,
      idSetorAtual: setor.id,
    });

    const produtos = await this.produtoRepository.listarTodosDetalhado();
    const produtoCriado = produtos.find((p) => p.codigoUnico === codigoUnico);
    if (!produtoCriado) {
      throw new Error("Falha ao recuperar produto recem-criado.");
    }

    this.notifier.notificarProdutoCriado(produtoCriado);
    return produtoCriado;
  }
}
