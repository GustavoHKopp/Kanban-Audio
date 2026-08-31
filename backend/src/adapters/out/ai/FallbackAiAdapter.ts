import { AiGateway, ContextoIA, IntencaoComandoVoz } from "../../../domain/ports/out/AiGateway";

const TIMEOUT_POR_ADAPTER_MS = 6000;

function comTimeout<T>(promessa: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const temporizador = setTimeout(
      () => reject(new Error(`Tempo limite de ${ms}ms excedido`)),
      ms
    );
    promessa.then(
      (valor) => {
        clearTimeout(temporizador);
        resolve(valor);
      },
      (erro) => {
        clearTimeout(temporizador);
        reject(erro);
      }
    );
  });
}

export class FallbackAiAdapter implements AiGateway {
  constructor(private readonly adaptadores: AiGateway[]) {
    if (adaptadores.length === 0) {
      throw new Error("FallbackAiAdapter precisa de pelo menos um adapter.");
    }
  }

  async interpretarComando(
    transcricao: string,
    contexto: ContextoIA
  ): Promise<IntencaoComandoVoz> {
    let ultimoErro: unknown;

    for (const adaptador of this.adaptadores) {
      const inicio = Date.now();
      try {
        const resultado = await comTimeout(
          adaptador.interpretarComando(transcricao, contexto),
          TIMEOUT_POR_ADAPTER_MS
        );
        console.log(`[ia] ${adaptador.constructor.name} respondeu em ${Date.now() - inicio}ms`);
        return resultado;
      } catch (erro) {
        ultimoErro = erro;
        console.warn(
          `[ia] ${adaptador.constructor.name} falhou apos ${Date.now() - inicio}ms, tentando proximo. Motivo: ${
            (erro as Error).message
          }`
        );
      }
    }

    return {
      action: "INFORMACAO_INCOMPLETA",
      data: { codigo: null, setorDestino: null, descricao: null, cor: null, tamanho: null },
      missingFields: [],
      replyText: `Todos os provedores de IA falharam. Ultimo erro: ${
        (ultimoErro as Error)?.message ?? "desconhecido"
      }`,
    };
  }
}
