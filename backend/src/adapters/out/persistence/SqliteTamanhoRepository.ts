import { DatabaseSync } from "node:sqlite";
import { v4 as uuidv4 } from "uuid";
import { TamanhoRepository } from "../../../domain/ports/out/TamanhoRepository";
import { Tamanho } from "../../../domain/entities/Tamanho";

interface TamanhoRow {
  id: string;
  nome_tamanho: string;
}

function paraEntidade(row: TamanhoRow): Tamanho {
  return { id: row.id, nomeTamanho: row.nome_tamanho };
}

export class SqliteTamanhoRepository implements TamanhoRepository {
  constructor(private readonly db: DatabaseSync) {}

  async listarTodos(): Promise<Tamanho[]> {
    const rows = this.db
      .prepare("SELECT * FROM tamanhos ORDER BY rowid ASC")
      .all() as unknown as TamanhoRow[];
    return rows.map(paraEntidade);
  }

  async buscarPorNome(nomeTamanho: string): Promise<Tamanho | null> {
    const row = this.db
      .prepare("SELECT * FROM tamanhos WHERE LOWER(nome_tamanho) = LOWER(?)")
      .get(nomeTamanho.trim()) as unknown as TamanhoRow | undefined;
    return row ? paraEntidade(row) : null;
  }

  async criar(nomeTamanho: string): Promise<Tamanho> {
    const id = uuidv4();
    this.db.prepare("INSERT INTO tamanhos (id, nome_tamanho) VALUES (?, ?)").run(id, nomeTamanho);
    return { id, nomeTamanho };
  }
}
