import { Cor } from "../../entities/Cor";

export interface CriarCorUseCase {
  executar(nomeCor: string): Promise<Cor>;
}
