import { Cor } from "../../entities/Cor";

export interface CorRepository {
  listarTodos(): Promise<Cor[]>;
  buscarPorNome(nomeCor: string): Promise<Cor | null>;
  criar(nomeCor: string, hexCode: string): Promise<Cor>;
}
