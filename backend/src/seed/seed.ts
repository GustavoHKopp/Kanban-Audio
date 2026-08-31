import { v4 as uuidv4 } from "uuid";
import { criarConexao, executarMigrations } from "../adapters/out/persistence/Database";

const SETORES = ["Entrada", "Corte", "Costura", "Acabamento", "Expedicao"];

const CORES: Array<{ nome: string; hex: string }> = [
  { nome: "Branco", hex: "#FFFFFF" },
  { nome: "Preto", hex: "#0B0B0C" },
  { nome: "Azul", hex: "#2563EB" },
  { nome: "Vermelho", hex: "#DC2626" },
  { nome: "Verde", hex: "#16A34A" },
  { nome: "Amarelo", hex: "#EAB308" },
  { nome: "Cinza", hex: "#6B7280" },
];

const TAMANHOS = ["PP", "P", "M", "G", "GG", "XG"];

function seed(): void {
  const db = criarConexao();
  executarMigrations(db);

  const inserirSetor = db.prepare(
    "INSERT OR IGNORE INTO setores (id, nome, ordem) VALUES (?, ?, ?)"
  );
  const setorIds: Record<string, string> = {};
  SETORES.forEach((nome, index) => {
    const existente = db.prepare("SELECT id FROM setores WHERE nome = ?").get(nome) as
      | { id: string }
      | undefined;
    const id = existente?.id ?? uuidv4();
    inserirSetor.run(id, nome, index);
    setorIds[nome] = id;
  });

  const inserirCor = db.prepare(
    "INSERT OR IGNORE INTO cores (id, nome_cor, hex_code) VALUES (?, ?, ?)"
  );
  CORES.forEach((cor) => inserirCor.run(uuidv4(), cor.nome, cor.hex));

  const inserirTamanho = db.prepare(
    "INSERT OR IGNORE INTO tamanhos (id, nome_tamanho) VALUES (?, ?)"
  );
  TAMANHOS.forEach((tamanho) => inserirTamanho.run(uuidv4(), tamanho));

  const inserirFluxo = db.prepare(
    "INSERT OR IGNORE INTO fluxos (id, setor_origem_id, setor_destino_id) VALUES (?, ?, ?)"
  );
  const transicoesLineares: Array<[string, string]> = [
    ["Entrada", "Corte"],
    ["Corte", "Costura"],
    ["Costura", "Acabamento"],
    ["Acabamento", "Expedicao"],
  ];
  transicoesLineares.forEach(([origem, destino]) => {
    inserirFluxo.run(uuidv4(), setorIds[origem], setorIds[destino]);
  });

  console.log("Seed executado com sucesso.");
  console.log(`Setores: ${SETORES.join(", ")}`);
  console.log(`Cores: ${CORES.map((c) => c.nome).join(", ")}`);
  console.log(`Tamanhos: ${TAMANHOS.join(", ")}`);
  db.close();
}

seed();
