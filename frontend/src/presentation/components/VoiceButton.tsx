import { Mic, Square, Loader2, Check, AlertTriangle, Info } from "lucide-react";
import { EstadoVoz } from "../controllers/useVoiceCommand";

interface VoiceButtonProps {
  estado: EstadoVoz;
  onClick: () => void;
}

const CORES: Record<EstadoVoz, string> = {
  inativo: "bg-onyx text-volt hover:bg-onyx/90",
  ouvindo: "bg-volt text-volt-ink animate-pulse-mic",
  processando: "bg-ink-soft text-canvas",
  sucesso: "bg-success text-canvas",
  erro: "bg-danger text-canvas",
  aviso: "bg-amber-500 text-canvas",
};

function Icone({ estado }: { estado: EstadoVoz }) {
  switch (estado) {
    case "ouvindo":
      return <Square className="h-5 w-5" strokeWidth={2.25} fill="currentColor" />;
    case "processando":
      return <Loader2 className="h-6 w-6 animate-spin" strokeWidth={2.25} />;
    case "sucesso":
      return <Check className="h-6 w-6" strokeWidth={2.5} />;
    case "erro":
      return <AlertTriangle className="h-6 w-6" strokeWidth={2.25} />;
    case "aviso":
      return <Info className="h-6 w-6" strokeWidth={2.25} />;
    default:
      return <Mic className="h-6 w-6" strokeWidth={2.25} />;
  }
}

const LEGENDA: Record<EstadoVoz, string> = {
  inativo: "Ativar escuta continua",
  ouvindo: "Ouvindo -- clique para parar",
  processando: "Processando comando -- clique para parar",
  sucesso: "Comando executado -- clique para parar",
  erro: "Erro no comando -- clique para parar",
  aviso: "Preciso de mais informacoes -- clique para parar",
};

export function VoiceButton({ estado, onClick }: VoiceButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={LEGENDA[estado]}
      title={LEGENDA[estado]}
      className={`fixed bottom-8 right-8 flex h-16 w-16 items-center justify-center rounded-full shadow-float transition-all duration-200 hover:scale-105 ${CORES[estado]}`}
    >
      <Icone estado={estado} />
    </button>
  );
}
