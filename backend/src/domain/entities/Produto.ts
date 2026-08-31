export interface Produto {
  id: string;
  codigoUnico: string;
  descricao: string;
  idCor: string;
  idTamanho: string;
  idSetorAtual: string;
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface ProdutoDetalhado extends Produto {
  nomeCor: string;
  hexCode: string;
  nomeTamanho: string;
  nomeSetorAtual: string;
}
