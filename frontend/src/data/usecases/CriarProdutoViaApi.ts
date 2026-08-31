import { CriarProduto, CriarProdutoParams } from "../../domain/usecases/CriarProduto";
import { ProdutoDetalhado } from "../../domain/entities/Produto";
import { HttpClient } from "../protocols/HttpClient";

export class CriarProdutoViaApi implements CriarProduto {
  constructor(private readonly httpClient: HttpClient) {}

  async executar(params: CriarProdutoParams): Promise<ProdutoDetalhado> {
    const resposta = await this.httpClient.post<ProdutoDetalhado | { mensagem: string }>(
      "/produtos",
      params
    );
    if (resposta.statusCode >= 400) {
      throw new Error((resposta.body as { mensagem: string }).mensagem);
    }
    return resposta.body as ProdutoDetalhado;
  }
}
