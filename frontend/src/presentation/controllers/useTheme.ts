import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";

export type Tema = "light" | "dark";

const CHAVE_STORAGE = "kanban-audio:tema";

function lerTemaSalvo(): Tema | null {
  try {
    const salvo = localStorage.getItem(CHAVE_STORAGE);
    return salvo === "light" || salvo === "dark" ? salvo : null;
  } catch {
    return null;
  }
}

function obterTemaPreferidoDoSistema(): Tema {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function aplicarTema(tema: Tema) {
  document.documentElement.setAttribute("data-theme", tema);
}

export function useTheme() {
  const [tema, setTema] = useState<Tema>(() => lerTemaSalvo() ?? obterTemaPreferidoDoSistema());

  useEffect(() => {
    aplicarTema(tema);
    try {
      localStorage.setItem(CHAVE_STORAGE, tema);
    } catch {
      // localStorage indisponivel (modo privado, etc.) -- tema ainda funciona na sessao atual
    }
  }, [tema]);

  const alternar = useCallback((origem?: { x: number; y: number }) => {
    const novoTema: Tema = tema === "dark" ? "light" : "dark";

    if (origem) {
      document.documentElement.style.setProperty("--theme-toggle-x", `${origem.x}px`);
      document.documentElement.style.setProperty("--theme-toggle-y", `${origem.y}px`);
    }

    const suportaViewTransition =
      "startViewTransition" in document && typeof document.startViewTransition === "function";

    if (!suportaViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTema(novoTema);
      return;
    }

    document.startViewTransition(() => {
      flushSync(() => setTema(novoTema));
    });
  }, [tema]);

  return { tema, alternar };
}
