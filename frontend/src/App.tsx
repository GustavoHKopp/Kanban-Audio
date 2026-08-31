import { useCallback, useState } from "react";
import { KanbanSquare, Plus } from "lucide-react";
import { useKanban } from "./presentation/controllers/useKanban";
import { useVoiceCommand } from "./presentation/controllers/useVoiceCommand";
import { useTheme } from "./presentation/controllers/useTheme";
import { KanbanBoard } from "./presentation/components/KanbanBoard";
import { VoiceButton } from "./presentation/components/VoiceButton";
import { Toast } from "./presentation/components/Toast";
import { ThemeToggle } from "./presentation/components/ThemeToggle";
import { ProdutoPainel, ValoresIniciaisProduto } from "./presentation/components/ProdutoPainel";
import { criarProduto, excluirProduto } from "./infrastructure/config/factories";
import { ACOES_EXECUTAVEIS, ResultadoComandoVoz } from "./domain/usecases/ProcessarComandoVoz";

export default function App() {
  const { quadro, carregando, erro, recarregar, mover } = useKanban();
  const { tema, alternar: alternarTema } = useTheme();
  const [painelAberto, setPainelAberto] = useState(false);
  const [valoresPrefill, setValoresPrefill] = useState<ValoresIniciaisProduto | undefined>(undefined);
  const [toast, setToast] = useState<{ mensagem: string; tipo: "sucesso" | "erro" | "aviso" } | null>(
    null
  );

  const mostrarToast = useCallback((mensagem: string, tipo: "sucesso" | "erro" | "aviso") => {
    setToast({ mensagem, tipo });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleResultadoVoz = useCallback(
    (resultado: ResultadoComandoVoz) => {
      if (ACOES_EXECUTAVEIS.has(resultado.acao) && resultado.sucesso) {
        recarregar();
        return;
      }

      if (resultado.acao === "ABRIR_MODAL_CADASTRO") {
        setValoresPrefill(resultado.dadosParciais);
        setPainelAberto(true);
        desativarVoz();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recarregar]
  );

  const { estado: estadoVoz, ultimoResultado, alternar, desativar: desativarVoz } =
    useVoiceCommand(handleResultadoVoz);

  const fecharPainel = () => {
    setPainelAberto(false);
    setValoresPrefill(undefined);
  };

  return (
    <div className="flex h-screen flex-col bg-canvas">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-volt text-volt-ink">
            <KanbanSquare className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight text-ink">Kanban de Producao</h1>
            <p className="text-xs text-ink-soft">Comando por voz habilitado</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle tema={tema} onAlternar={alternarTema} />
          <button
            type="button"
            onClick={() => setPainelAberto(true)}
            className="flex items-center gap-1.5 rounded-md bg-onyx px-4 py-2 text-sm font-bold text-volt hover:bg-onyx/90"
          >
            <Plus className="h-4 w-4" strokeWidth={3} />
            Produtos
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden px-6 py-4">
        {carregando && <p className="text-sm text-ink-soft">Carregando quadro...</p>}
        {erro && <p className="text-sm font-medium text-danger">{erro}</p>}
        {quadro && (
          <KanbanBoard
            quadro={quadro}
            onMover={mover}
            onErro={(mensagem) => mostrarToast(mensagem, "erro")}
          />
        )}
      </main>

      <VoiceButton estado={estadoVoz} onClick={alternar} />

      {(estadoVoz === "sucesso" || estadoVoz === "erro" || estadoVoz === "aviso") &&
        ultimoResultado && (
          <Toast
            mensagem={ultimoResultado.mensagem}
            tipo={estadoVoz === "sucesso" ? "sucesso" : estadoVoz === "aviso" ? "aviso" : "erro"}
          />
        )}

      {toast && <Toast mensagem={toast.mensagem} tipo={toast.tipo} />}

      {quadro && (
        <ProdutoPainel
          aberto={painelAberto}
          produtos={quadro.produtos}
          cores={quadro.cores}
          tamanhos={quadro.tamanhos}
          setores={quadro.setores}
          valoresIniciais={valoresPrefill}
          onFechar={fecharPainel}
          onCriar={async (dados) => {
            await criarProduto.executar(dados);
            await recarregar();
            mostrarToast(`Produto ${dados.codigoUnico} criado.`, "sucesso");
          }}
          onExcluir={async (codigoUnico) => {
            try {
              await excluirProduto.executar(codigoUnico);
              await recarregar();
              mostrarToast(`Produto ${codigoUnico} excluido.`, "sucesso");
            } catch (e) {
              mostrarToast((e as Error).message || "Nao foi possivel excluir o produto.", "erro");
            }
          }}
        />
      )}
    </div>
  );
}
