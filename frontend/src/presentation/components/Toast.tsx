import { CheckCircle2, XCircle, Info } from "lucide-react";

interface ToastProps {
  mensagem: string;
  tipo: "sucesso" | "erro" | "aviso";
}

const ESTILOS: Record<ToastProps["tipo"], string> = {
  sucesso: "border-success/30 bg-success/10 text-success",
  erro: "border-danger/30 bg-danger/10 text-danger",
  aviso: "border-amber-500/30 bg-amber-500/10 text-amber-600",
};

const ICONES: Record<ToastProps["tipo"], typeof CheckCircle2> = {
  sucesso: CheckCircle2,
  erro: XCircle,
  aviso: Info,
};

export function Toast({ mensagem, tipo }: ToastProps) {
  const Icone = ICONES[tipo];

  return (
    <div
      className={`fixed bottom-28 right-8 flex max-w-xs items-start gap-2 rounded-lg border px-4 py-3 text-sm font-medium shadow-float ${ESTILOS[tipo]}`}
      role="status"
    >
      <Icone className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.25} />
      <span>{mensagem}</span>
    </div>
  );
}
