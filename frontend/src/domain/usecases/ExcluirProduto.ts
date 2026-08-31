export interface ExcluirProduto {
  executar(codigoUnico: string): Promise<void>;
}
