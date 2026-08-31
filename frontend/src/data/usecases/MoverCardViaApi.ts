import { MoverCard, MoverCardParams } from "../../domain/usecases/MoverCard";
import { ProdutoDetalhado } from "../../domain/entities/Produto";
import { HttpClient } from "../protocols/HttpClient";

export class MoverCardViaApi implements MoverCard {
  constructor(private readonly httpClient: HttpClient) {}

  async executar(params: MoverCardParams): Promise<ProdutoDetalhado> {
    const resposta = await this.httpClient.patch<ProdutoDetalhado | { mensagem: string }>(
      `/produtos/${params.codigoUnico}/mover`,
      { nomeSetorDestino: params.nomeSetorDestino }
    );
    if (resposta.statusCode >= 400) {
      throw new Error((resposta.body as { mensagem: string }).mensagem);
    }
    return resposta.body as ProdutoDetalhado;
  }
}
