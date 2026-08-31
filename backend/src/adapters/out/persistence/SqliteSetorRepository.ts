import { DatabaseSync } from "node:sqlite";
import { SetorRepository } from "../../../domain/ports/out/SetorRepository";
import { Setor } from "../../../domain/entities/Setor";

interface SetorRow {
  id: string;
  nome: string;
  ordem: number;
  data_criacao: string;
}

function paraEntidade(row: SetorRow): Setor {
  return { id: row.id, nome: row.nome, ordem: row.ordem, dataCriacao: row.data_criacao };
}

export class SqliteSetorRepository implements SetorRepository {
  constructor(private readonly db: DatabaseSync) {}

  async listarTodos(): Promise<Setor[]> {
    const rows = this.db
      .prepare("SELECT * FROM setores ORDER BY ordem ASC")
      .all() as unknown as SetorRow[];
    return rows.map(paraEntidade);
  }

  async buscarPorId(id: string): Promise<Setor | null> {
    const row = this.db.prepare("SELECT * FROM setores WHERE id = ?").get(id) as unknown as
      | SetorRow
      | undefined;
    return row ? paraEntidade(row) : null;
  }

  async buscarPorNome(nome: string): Promise<Setor | null> {
    const row = this.db
      .prepare("SELECT * FROM setores WHERE LOWER(nome) = LOWER(?)")
      .get(nome.trim()) as unknown as SetorRow | undefined;
    return row ? paraEntidade(row) : null;
  }
}
