import { DatabaseSync } from "node:sqlite";
import { v4 as uuidv4 } from "uuid";
import { CorRepository } from "../../../domain/ports/out/CorRepository";
import { Cor } from "../../../domain/entities/Cor";

interface CorRow {
  id: string;
  nome_cor: string;
  hex_code: string;
}

function paraEntidade(row: CorRow): Cor {
  return { id: row.id, nomeCor: row.nome_cor, hexCode: row.hex_code };
}

export class SqliteCorRepository implements CorRepository {
  constructor(private readonly db: DatabaseSync) {}

  async listarTodos(): Promise<Cor[]> {
    const rows = this.db.prepare("SELECT * FROM cores ORDER BY nome_cor ASC").all() as unknown as CorRow[];
    return rows.map(paraEntidade);
  }

  async buscarPorNome(nomeCor: string): Promise<Cor | null> {
    const row = this.db
      .prepare("SELECT * FROM cores WHERE LOWER(nome_cor) = LOWER(?)")
      .get(nomeCor.trim()) as unknown as CorRow | undefined;
    return row ? paraEntidade(row) : null;
  }

  async criar(nomeCor: string, hexCode: string): Promise<Cor> {
    const id = uuidv4();
    this.db
      .prepare("INSERT INTO cores (id, nome_cor, hex_code) VALUES (?, ?, ?)")
      .run(id, nomeCor, hexCode);
    return { id, nomeCor, hexCode };
  }
}
