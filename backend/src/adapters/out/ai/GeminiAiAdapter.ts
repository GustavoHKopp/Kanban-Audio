import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import {
  AiGateway,
  ContextoIA,
  IntencaoComandoVoz,
} from "../../../domain/ports/out/AiGateway";
import { construirSystemPrompt, extrairJson, paraIntencao } from "./PromptComandoVoz";

const ESQUEMA_RESPOSTA = {
  type: SchemaType.OBJECT,
  properties: {
    action: {
      type: SchemaType.STRING,
      format: "enum",
      enum: [
        "MOVER_PRODUTO",
        "CRIAR_PRODUTO",
        "EXCLUIR_PRODUTO",
        "CRIAR_COR",
        "CRIAR_TAMANHO",
        "ABRIR_MODAL_CADASTRO",
        "INFORMACAO_INCOMPLETA",
      ],
    },
    data: {
      type: SchemaType.OBJECT,
      properties: {
        codigo: { type: SchemaType.STRING, nullable: true },
        setor_destino: { type: SchemaType.STRING, nullable: true },
        descricao: { type: SchemaType.STRING, nullable: true },
        cor: { type: SchemaType.STRING, nullable: true },
        tamanho: { type: SchemaType.STRING, nullable: true },
      },
      required: ["codigo", "setor_destino", "descricao", "cor", "tamanho"],
    },
    missing_fields: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    reply_text: { type: SchemaType.STRING },
  },
  required: ["action", "data", "missing_fields", "reply_text"],
} as Schema;

export class GeminiAiAdapter implements AiGateway {
  private readonly client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async interpretarComando(
    transcricao: string,
    contexto: ContextoIA
  ): Promise<IntencaoComandoVoz> {
    const model = this.client.getGenerativeModel({
      model: "gemini-3.6-flash",
      systemInstruction: construirSystemPrompt(contexto),
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: ESQUEMA_RESPOSTA,
      },
    });

    const resultado = await model.generateContent(transcricao);
    const texto = resultado.response.text();
    const json = extrairJson(texto);
    return paraIntencao(json);
  }
}
