import { Tamanho } from "../../entities/Tamanho";

export interface CriarTamanhoUseCase {
  executar(nomeTamanho: string): Promise<Tamanho>;
}
