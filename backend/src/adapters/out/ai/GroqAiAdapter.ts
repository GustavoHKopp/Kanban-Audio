import Groq from "groq-sdk";
import {
  AiGateway,
  ContextoIA,
  IntencaoComandoVoz,
} from "../../../domain/ports/out/AiGateway";
import { construirSystemPrompt, extrairJson, paraIntencao } from "./PromptComandoVoz";

export class GroqAiAdapter implements AiGateway {
  private readonly client: Groq;

  constructor(apiKey: string) {
    this.client = new Groq({ apiKey });
  }

  async interpretarComando(
    transcricao: string,
    contexto: ContextoIA
  ): Promise<IntencaoComandoVoz> {
    const resposta = await this.client.chat.completions.create({
      model: "openai/gpt-oss-120b",
      response_format: { type: "json_object" },
      temperature: 0,
      messages: [
        { role: "system", content: construirSystemPrompt(contexto) },
        { role: "user", content: transcricao },
      ],
    });

    const texto = resposta.choices[0]?.message?.content ?? "";
    const json = extrairJson(texto);
    return paraIntencao(json);
  }
}
