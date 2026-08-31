export interface SpeechGatewayCallbacks {
  onResultado: (transcricao: string) => void;
  onErro: (mensagem: string) => void;
  onFim: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognition;

const MENSAGENS_ERRO: Record<string, string> = {
  "no-speech": "Nenhuma fala detectada. Tente falar logo apos clicar no microfone.",
  "audio-capture": "Nenhum microfone encontrado. Verifique se ha um microfone conectado.",
  "not-allowed": "Permissao de microfone negada. Libere o acesso ao microfone nas configuracoes do navegador.",
  network: "Falha de rede no reconhecimento de voz. Verifique sua conexao com a internet.",
  aborted: "Reconhecimento de voz cancelado.",
};

function traduzirErro(codigo: string): string {
  return MENSAGENS_ERRO[codigo] ?? `Erro no reconhecimento de voz: ${codigo}`;
}

function obterSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  const janela = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return janela.SpeechRecognition ?? janela.webkitSpeechRecognition ?? null;
}

export class WebSpeechGateway {
  private reconhecimento: SpeechRecognition | null = null;

  disponivel(): boolean {
    return obterSpeechRecognitionCtor() !== null;
  }

  iniciar(callbacks: SpeechGatewayCallbacks): void {
    const Ctor = obterSpeechRecognitionCtor();
    if (!Ctor) {
      callbacks.onErro("Reconhecimento de voz nao suportado neste navegador.");
      return;
    }

    this.reconhecimento = new Ctor();
    this.reconhecimento.lang = "pt-BR";
    this.reconhecimento.continuous = false;
    this.reconhecimento.interimResults = false;
    this.reconhecimento.maxAlternatives = 1;

    this.reconhecimento.onstart = () => {
      console.log("[voz] reconhecimento iniciado, pode falar");
    };

    this.reconhecimento.onaudiostart = () => {
      console.log("[voz] captura de audio iniciada (microfone ativo)");
    };

    this.reconhecimento.onspeechstart = () => {
      console.log("[voz] fala detectada");
    };

    this.reconhecimento.onspeechend = () => {
      console.log("[voz] fim da fala detectado, processando...");
    };

    this.reconhecimento.onresult = (evento: SpeechRecognitionEvent) => {
      const transcricao = evento.results[0]?.[0]?.transcript ?? "";
      console.log("[voz] transcricao recebida:", JSON.stringify(transcricao));
      callbacks.onResultado(transcricao);
    };

    this.reconhecimento.onnomatch = () => {
      console.warn("[voz] audio capturado mas nao foi possivel reconhecer nenhuma fala");
    };

    this.reconhecimento.onerror = (evento: SpeechRecognitionErrorEvent) => {
      console.error("[voz] erro no reconhecimento:", evento.error, evento);
      if (evento.error === "aborted") return;
      callbacks.onErro(traduzirErro(evento.error));
    };

    this.reconhecimento.onend = () => {
      console.log("[voz] reconhecimento encerrado");
      callbacks.onFim();
    };

    console.log("[voz] chamando start()...");
    this.reconhecimento.start();
  }

  parar(): void {
    this.reconhecimento?.stop();
  }
}
