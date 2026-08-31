import { CriarTamanhoUseCase } from "../ports/in/CriarTamanhoUseCase";
import { TamanhoRepository } from "../ports/out/TamanhoRepository";
import { RealtimeNotifier } from "../ports/out/RealtimeNotifier";
import { Tamanho } from "../entities/Tamanho";

export class CriarTamanho implements CriarTamanhoUseCase {
  constructor(
    private readonly tamanhoRepository: TamanhoRepository,
    private readonly notifier: RealtimeNotifier
  ) {}

  async executar(nomeTamanho: string): Promise<Tamanho> {
    const nome = nomeTamanho.trim().toUpperCase();
    if (!nome) {
      throw new Error("Nome do tamanho e obrigatorio.");
    }

    const existente = await this.tamanhoRepository.buscarPorNome(nome);
    if (existente) {
      return existente;
    }

    const tamanho = await this.tamanhoRepository.criar(nome);
    this.notifier.notificarTamanhoCriado(tamanho);
    return tamanho;
  }
}
