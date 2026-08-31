import { DatabaseSync } from "node:sqlite";
import { v4 as uuidv4 } from "uuid";
import {
  ProdutoRepository,
  CriarProdutoDTO,
} from "../../../domain/ports/out/ProdutoRepository";
import { Produto, ProdutoDetalhado } from "../../../domain/entities/Produto";

interface ProdutoRow {
  id: string;
  codigo_unico: string;
  descricao: string;
  id_cor: string;
  id_tamanho: string;
  id_setor_atual: string;
  data_criacao: string;
  data_atualizacao: string;
}

interface ProdutoDetalhadoRow extends ProdutoRow {
  nome_cor: string;
  hex_code: string;
  nome_tamanho: string;
  nome_setor_atual: string;
}

function paraEntidade(row: ProdutoRow): Produto {
  return {
    id: row.id,
    codigoUnico: row.codigo_unico,
    descricao: row.descricao,
    idCor: row.id_cor,
    idTamanho: row.id_tamanho,
    idSetorAtual: row.id_setor_atual,
    dataCriacao: row.data_criacao,
    dataAtualizacao: row.data_atualizacao,
  };
}

function paraEntidadeDetalhada(row: ProdutoDetalhadoRow): ProdutoDetalhado {
  return {
    ...paraEntidade(row),
    nomeCor: row.nome_cor,
    hexCode: row.hex_code,
    nomeTamanho: row.nome_tamanho,
    nomeSetorAtual: row.nome_setor_atual,
  };
}

const SELECT_DETALHADO = `
  SELECT
    p.*,
    c.nome_cor AS nome_cor,
    c.hex_code AS hex_code,
    t.nome_tamanho AS nome_tamanho,
    s.nome AS nome_setor_atual
  FROM produtos p
  JOIN cores c ON c.id = p.id_cor
  JOIN tamanhos t ON t.id = p.id_tamanho
  JOIN setores s ON s.id = p.id_setor_atual
`;

export class SqliteProdutoRepository implements ProdutoRepository {
  constructor(private readonly db: DatabaseSync) {}

  async criar(dados: CriarProdutoDTO): Promise<Produto> {
    const id = uuidv4();
    this.db
      .prepare(
        `INSERT INTO produtos (id, codigo_unico, descricao, id_cor, id_tamanho, id_setor_atual)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(id, dados.codigoUnico, dados.descricao, dados.idCor, dados.idTamanho, dados.idSetorAtual);

    const row = this.db.prepare("SELECT * FROM produtos WHERE id = ?").get(id) as unknown as ProdutoRow;
    return paraEntidade(row);
  }

  async buscarPorCodigo(codigoUnico: string): Promise<Produto | null> {
    const row = this.db
      .prepare("SELECT * FROM produtos WHERE UPPER(codigo_unico) = UPPER(?)")
      .get(codigoUnico) as unknown as ProdutoRow | undefined;
    return row ? paraEntidade(row) : null;
  }

  async buscarPorId(id: string): Promise<Produto | null> {
    const row = this.db.prepare("SELECT * FROM produtos WHERE id = ?").get(id) as unknown as
      | ProdutoRow
      | undefined;
    return row ? paraEntidade(row) : null;
  }

  async atualizarSetor(id: string, idSetorAtual: string): Promise<Produto> {
    this.db
      .prepare(
        "UPDATE produtos SET id_setor_atual = ?, data_atualizacao = datetime('now') WHERE id = ?"
      )
      .run(idSetorAtual, id);
    const row = this.db.prepare("SELECT * FROM produtos WHERE id = ?").get(id) as unknown as ProdutoRow;
    return paraEntidade(row);
  }

  async excluir(id: string): Promise<void> {
    this.db.prepare("DELETE FROM produtos WHERE id = ?").run(id);
  }

  async listarTodosDetalhado(): Promise<ProdutoDetalhado[]> {
    const rows = this.db
      .prepare(`${SELECT_DETALHADO} ORDER BY p.data_criacao DESC`)
      .all() as unknown as ProdutoDetalhadoRow[];
    return rows.map(paraEntidadeDetalhada);
  }
}
