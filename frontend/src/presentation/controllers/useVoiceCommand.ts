import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WebSpeechGateway } from "../../infrastructure/gateways/WebSpeechGateway";
import { processarComandoVoz } from "../../infrastructure/config/factories";
import { ACOES_EXECUTAVEIS, ResultadoComandoVoz } from "../../domain/usecases/ProcessarComandoVoz";

export type EstadoVoz = "inativo" | "ouvindo" | "processando" | "sucesso" | "erro" | "aviso";

interface UltimoResultado {
  mensagem: string;
}

const PAUSA_ENTRE_CICLOS_MS = 2200;
const PAUSA_ANTES_DE_REESCUTAR_MS = 350;

export function useVoiceCommand(aoResultado: (resultado: ResultadoComandoVoz) => void) {
  const [estado, setEstado] = useState<EstadoVoz>("inativo");
  const [ultimoResultado, setUltimoResultado] = useState<UltimoResultado | null>(null);
  const gateway = useMemo(() => new WebSpeechGateway(), []);

  const ativoRef = useRef(false);
  const recebeuEventoRef = useRef(false);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const escutarRef = useRef<() => void>(() => {});

  const limparTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const finalizarCiclo = useCallback((tom: EstadoVoz, mensagem: string) => {
    setUltimoResultado({ mensagem });
    setEstado(tom);
    const t = setTimeout(() => {
      if (ativoRef.current) {
        const t2 = setTimeout(() => escutarRef.current(), PAUSA_ANTES_DE_REESCUTAR_MS);
        timeoutsRef.current.push(t2);
      } else {
        setEstado("inativo");
      }
    }, PAUSA_ENTRE_CICLOS_MS);
    timeoutsRef.current.push(t);
  }, []);

  const escutar = useCallback(() => {
    if (!gateway.disponivel()) {
      ativoRef.current = false;
      setUltimoResultado({
        mensagem: "Reconhecimento de voz nao suportado neste navegador. Use o Chrome ou Edge.",
      });
      setEstado("erro");
      return;
    }

    recebeuEventoRef.current = false;
    setEstado("ouvindo");
    gateway.iniciar({
      onResultado: async (transcricao) => {
        recebeuEventoRef.current = true;
        const texto = transcricao.trim();
        if (!texto) {
          finalizarCiclo("aviso", "Nao entendi nada. Tente falar mais perto do microfone.");
          return;
        }

        setEstado("processando");
        console.log("[voz] enviando ao backend:", texto);
        try {
          const resultado = await processarComandoVoz.executar(texto);
          console.log("[voz] resposta do backend:", resultado);
          aoResultado(resultado);
          const tom: EstadoVoz = ACOES_EXECUTAVEIS.has(resultado.acao)
            ? resultado.sucesso
              ? "sucesso"
              : "erro"
            : "aviso";
          finalizarCiclo(tom, resultado.mensagem);
        } catch (erro) {
          console.error("[voz] falha ao chamar /comando-voz:", erro);
          finalizarCiclo("erro", "Falha ao processar comando de voz. Veja o console (F12) para detalhes.");
        }
      },
      onErro: (mensagem) => {
        recebeuEventoRef.current = true;
        finalizarCiclo("erro", mensagem);
      },
      onFim: () => {
        if (!recebeuEventoRef.current) {
          finalizarCiclo("aviso", "Nenhum audio foi capturado. Verifique o microfone e tente novamente.");
        }
      },
    });
  }, [gateway, aoResultado, finalizarCiclo]);

  useEffect(() => {
    escutarRef.current = escutar;
  }, [escutar]);

  const desativar = useCallback(() => {
    ativoRef.current = false;
    limparTimeouts();
    gateway.parar();
    setEstado("inativo");
  }, [gateway, limparTimeouts]);

  const alternar = useCallback(() => {
    if (ativoRef.current) {
      desativar();
      return;
    }
    ativoRef.current = true;
    escutar();
  }, [escutar, desativar]);

  useEffect(() => {
    return () => {
      ativoRef.current = false;
      limparTimeouts();
    };
  }, [limparTimeouts]);

  return { estado, ultimoResultado, alternar, desativar };
}
