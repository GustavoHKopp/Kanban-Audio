import { CarregarQuadro } from "../../domain/usecases/CarregarQuadro";
import { QuadroCompleto } from "../../domain/entities/QuadroCompleto";
import { HttpClient } from "../protocols/HttpClient";

export class CarregarQuadroViaApi implements CarregarQuadro {
  constructor(private readonly httpClient: HttpClient) {}

  async executar(): Promise<QuadroCompleto> {
    const resposta = await this.httpClient.get<QuadroCompleto>("/quadro");
    return resposta.body;
  }
}
