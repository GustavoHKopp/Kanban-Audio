import { MouseEvent } from "react";
import { Sun, Moon } from "lucide-react";
import { Tema } from "../controllers/useTheme";

interface ThemeToggleProps {
  tema: Tema;
  onAlternar: (origem: { x: number; y: number }) => void;
}

export function ThemeToggle({ tema, onAlternar }: ThemeToggleProps) {
  const handleClick = (evento: MouseEvent<HTMLButtonElement>) => {
    const { left, top, width, height } = evento.currentTarget.getBoundingClientRect();
    onAlternar({ x: left + width / 2, y: top + height / 2 });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={tema === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
      title={tema === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft transition-colors hover:text-ink"
    >
      {tema === "dark" ? (
        <Sun className="h-4 w-4" strokeWidth={2.25} />
      ) : (
        <Moon className="h-4 w-4" strokeWidth={2.25} />
      )}
    </button>
  );
}
