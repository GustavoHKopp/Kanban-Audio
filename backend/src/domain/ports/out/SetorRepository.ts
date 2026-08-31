import { Setor } from "../../entities/Setor";

export interface SetorRepository {
  listarTodos(): Promise<Setor[]>;
  buscarPorId(id: string): Promise<Setor | null>;
  buscarPorNome(nome: string): Promise<Setor | null>;
}
