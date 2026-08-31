import { ExcluirProduto } from "../../domain/usecases/ExcluirProduto";
import { HttpClient } from "../protocols/HttpClient";

export class ExcluirProdutoViaApi implements ExcluirProduto {
  constructor(private readonly httpClient: HttpClient) {}

  async executar(codigoUnico: string): Promise<void> {
    const resposta = await this.httpClient.delete<{ mensagem?: string }>(`/produtos/${codigoUnico}`);
    if (resposta.statusCode >= 400) {
      throw new Error(resposta.body?.mensagem ?? "Nao foi possivel excluir o produto.");
    }
  }
}
