import { DatabaseSync } from "node:sqlite";
import path from "path";
import fs from "fs";

const DATA_DIR = path.join(__dirname, "..", "..", "..", "..", "data");
const DB_PATH = path.join(DATA_DIR, "kanban.sqlite");

export function criarConexao(): DatabaseSync {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  return db;
}

export function executarMigrations(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS setores (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL UNIQUE,
      ordem INTEGER NOT NULL,
      data_criacao TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cores (
      id TEXT PRIMARY KEY,
      nome_cor TEXT NOT NULL UNIQUE,
      hex_code TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tamanhos (
      id TEXT PRIMARY KEY,
      nome_tamanho TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS fluxos (
      id TEXT PRIMARY KEY,
      setor_origem_id TEXT NOT NULL REFERENCES setores(id),
      setor_destino_id TEXT NOT NULL REFERENCES setores(id),
      UNIQUE(setor_origem_id, setor_destino_id)
    );

    CREATE TABLE IF NOT EXISTS produtos (
      id TEXT PRIMARY KEY,
      codigo_unico TEXT NOT NULL UNIQUE,
      descricao TEXT NOT NULL,
      id_cor TEXT NOT NULL REFERENCES cores(id),
      id_tamanho TEXT NOT NULL REFERENCES tamanhos(id),
      id_setor_atual TEXT NOT NULL REFERENCES setores(id),
      data_criacao TEXT NOT NULL DEFAULT (datetime('now')),
      data_atualizacao TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}
