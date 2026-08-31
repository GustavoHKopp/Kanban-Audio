import { AiGateway, ContextoIA, IntencaoComandoVoz } from "../../../domain/ports/out/AiGateway";

export class NullAiAdapter implements AiGateway {
  async interpretarComando(_transcricao: string, _contexto: ContextoIA): Promise<IntencaoComandoVoz> {
    return {
      action: "INFORMACAO_INCOMPLETA",
      data: { codigo: null, setorDestino: null, descricao: null, cor: null, tamanho: null },
      missingFields: [],
      replyText:
        "Nenhum provedor de IA configurado. Defina GEMINI_API_KEY ou GROQ_API_KEY no backend para habilitar o comando de voz.",
    };
  }
}
