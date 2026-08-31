import { Tamanho } from "../../entities/Tamanho";

export interface TamanhoRepository {
  listarTodos(): Promise<Tamanho[]>;
  buscarPorNome(nomeTamanho: string): Promise<Tamanho | null>;
  criar(nomeTamanho: string): Promise<Tamanho>;
}
