import { QuadroCompleto } from "../entities/QuadroCompleto";

export interface CarregarQuadro {
  executar(): Promise<QuadroCompleto>;
}
