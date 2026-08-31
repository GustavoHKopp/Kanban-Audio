import { ListarQuadroUseCase, QuadroCompleto } from "../ports/in/ListarQuadroUseCase";
import { ProdutoRepository } from "../ports/out/ProdutoRepository";
import { SetorRepository } from "../ports/out/SetorRepository";
import { CorRepository } from "../ports/out/CorRepository";
import { TamanhoRepository } from "../ports/out/TamanhoRepository";

export class ListarQuadro implements ListarQuadroUseCase {
  constructor(
    private readonly produtoRepository: ProdutoRepository,
    private readonly setorRepository: SetorRepository,
    private readonly corRepository: CorRepository,
    private readonly tamanhoRepository: TamanhoRepository
  ) {}

  async executar(): Promise<QuadroCompleto> {
    const [setores, cores, tamanhos, produtos] = await Promise.all([
      this.setorRepository.listarTodos(),
      this.corRepository.listarTodos(),
      this.tamanhoRepository.listarTodos(),
      this.produtoRepository.listarTodosDetalhado(),
    ]);

    return { setores, cores, tamanhos, produtos };
  }
}
