export interface ExcluirProdutoUseCase {
  executar(codigoUnico: string): Promise<void>;
}
