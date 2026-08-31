import {
  ProcessarComandoVoz,
  ResultadoComandoVoz,
} from "../../domain/usecases/ProcessarComandoVoz";
import { HttpClient } from "../protocols/HttpClient";

export class ProcessarComandoVozViaApi implements ProcessarComandoVoz {
  constructor(private readonly httpClient: HttpClient) {}

  async executar(transcricao: string): Promise<ResultadoComandoVoz> {
    const resposta = await this.httpClient.post<ResultadoComandoVoz>("/comando-voz", {
      transcricao,
    });
    return resposta.body;
  }
}
