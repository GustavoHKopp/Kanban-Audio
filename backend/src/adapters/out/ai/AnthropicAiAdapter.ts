import Anthropic from "@anthropic-ai/sdk";
import {
  AiGateway,
  ContextoIA,
  IntencaoComandoVoz,
} from "../../../domain/ports/out/AiGateway";
import { construirSystemPrompt, paraIntencao } from "./PromptComandoVoz";

const NOME_FERRAMENTA = "registrar_intencao_kanban";

function construirFerramenta(contexto: ContextoIA) {
  return {
    name: NOME_FERRAMENTA,
    description:
      "Registra a intencao estruturada extraida do comando de voz do operador de fabrica.",
    input_schema: {
      type: "object" as const,
      properties: {
        action: {
          type: "string",
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
          type: "object",
          properties: {
            codigo: { type: ["string", "null"], description: "Codigo do produto." },
            setor_destino: {
              type: ["string", "null"],
              description: `Setor de destino/inicial. Um de: ${contexto.setoresDisponiveis.join(", ")}`,
            },
            descricao: { type: ["string", "null"], description: "Descricao livre do produto." },
            cor: {
              type: ["string", "null"],
              description: `Uma das cores disponiveis: ${contexto.coresDisponiveis.join(", ")}`,
            },
            tamanho: {
              type: ["string", "null"],
              description: `Um dos tamanhos disponiveis: ${contexto.tamanhosDisponiveis.join(", ")}`,
            },
          },
          required: ["codigo", "setor_destino", "descricao", "cor", "tamanho"],
        },
        missing_fields: {
          type: "array",
          items: { type: "string" },
          description: "Campos obrigatorios de cadastro que ainda faltam (codigo, descricao, cor, tamanho).",
        },
        reply_text: {
          type: "string",
          description: "Frase curta, amigavel e em portugues, para mostrar ao usuario.",
        },
      },
      required: ["action", "data", "missing_fields", "reply_text"],
    },
  };
}

export class AnthropicAiAdapter implements AiGateway {
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async interpretarComando(
    transcricao: string,
    contexto: ContextoIA
  ): Promise<IntencaoComandoVoz> {
    const resposta = await this.client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 512,
      system: construirSystemPrompt(contexto),
      tools: [construirFerramenta(contexto)],
      tool_choice: { type: "tool", name: NOME_FERRAMENTA },
      messages: [{ role: "user", content: transcricao }],
    });

    const toolUse = resposta.content.find((bloco) => bloco.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return {
        action: "INFORMACAO_INCOMPLETA",
        data: { codigo: null, setorDestino: null, descricao: null, cor: null, tamanho: null },
        missingFields: [],
        replyText: "A IA nao retornou uma intencao estruturada.",
      };
    }

    return paraIntencao(toolUse.input as Record<string, unknown>);
  }
}
