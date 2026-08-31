import { FormEvent, useEffect, useRef, useState } from "react";
import { X, Trash2, Check } from "lucide-react";
import { Cor } from "../../domain/entities/Cor";
import { Tamanho } from "../../domain/entities/Tamanho";
import { Setor } from "../../domain/entities/Setor";
import { ProdutoDetalhado } from "../../domain/entities/Produto";

export interface ValoresIniciaisProduto {
  codigoUnico?: string;
  descricao?: string;
  nomeCor?: string;
  nomeTamanho?: string;
  nomeSetorInicial?: string;
}

interface ProdutoPainelProps {
  aberto: boolean;
  produtos: ProdutoDetalhado[];
  cores: Cor[];
  tamanhos: Tamanho[];
  setores: Setor[];
  valoresIniciais?: ValoresIniciaisProduto;
  onFechar: () => void;
  onCriar: (dados: {
    codigoUnico: string;
    descricao: string;
    nomeCor: string;
    nomeTamanho: string;
    nomeSetorInicial: string;
  }) => Promise<void>;
  onExcluir: (codigoUnico: string) => Promise<void>;
}

function encontrarCorrespondencia(valor: string | undefined, opcoes: string[]): string | undefined {
  if (!valor) return undefined;
  return opcoes.find((opcao) => opcao.toLowerCase() === valor.trim().toLowerCase());
}

export function ProdutoPainel({
  aberto,
  produtos,
  cores,
  tamanhos,
  setores,
  valoresIniciais,
  onFechar,
  onCriar,
  onExcluir,
}: ProdutoPainelProps) {
  const [codigoUnico, setCodigoUnico] = useState("");
  const [descricao, setDescricao] = useState("");
  const [nomeCor, setNomeCor] = useState("");
  const [nomeTamanho, setNomeTamanho] = useState("");
  const [nomeSetorInicial, setNomeSetorInicial] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!aberto) return;
    setCodigoUnico(valoresIniciais?.codigoUnico ?? "");
    setDescricao(valoresIniciais?.descricao ?? "");
    setNomeCor(
      encontrarCorrespondencia(valoresIniciais?.nomeCor, cores.map((c) => c.nomeCor)) ??
        cores[0]?.nomeCor ??
        ""
    );
    setNomeTamanho(
      encontrarCorrespondencia(valoresIniciais?.nomeTamanho, tamanhos.map((t) => t.nomeTamanho)) ??
        tamanhos[0]?.nomeTamanho ??
        ""
    );
    setNomeSetorInicial(
      encontrarCorrespondencia(valoresIniciais?.nomeSetorInicial, setores.map((s) => s.nome)) ??
        setores[0]?.nome ??
        ""
    );
    setErro(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto, valoresIniciais]);

  useEffect(() => {
    return () => {
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    };
  }, []);

  const veioDeVoz = Boolean(
    valoresIniciais &&
      (valoresIniciais.codigoUnico || valoresIniciais.descricao || valoresIniciais.nomeCor || valoresIniciais.nomeTamanho)
  );

  const handleSubmit = async (evento: FormEvent) => {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await onCriar({ codigoUnico, descricao, nomeCor, nomeTamanho, nomeSetorInicial });
      setCodigoUnico("");
      setDescricao("");
    } catch (e) {
      setErro((e as Error).message || "Nao foi possivel criar o produto.");
    } finally {
      setEnviando(false);
    }
  };

  const handleExcluirClick = async (produto: ProdutoDetalhado) => {
    if (confirmandoId !== produto.id) {
      setConfirmandoId(produto.id);
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = setTimeout(() => setConfirmandoId(null), 3000);
      return;
    }

    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    setConfirmandoId(null);
    setExcluindoId(produto.id);
    try {
      await onExcluir(produto.codigoUnico);
    } finally {
      setExcluindoId(null);
    }
  };

  return (
    <>
      <div
        onClick={onFechar}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-ink/40 transition-opacity duration-300 ${
          aberto ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-line bg-canvas shadow-float transition-transform duration-300 ease-out ${
          aberto ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!aberto}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-bold text-ink">Produtos</h2>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar painel"
            className="flex h-8 w-8 items-center justify-center rounded-md text-ink-soft hover:bg-surface hover:text-ink"
          >
            <X className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>

        <div className="border-b border-line px-5 py-5">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-soft">
            Novo produto
          </h3>

          {veioDeVoz && (
            <div className="mb-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
              Preenchi o que entendi do comando de voz. Complete o resto e confirme.
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm text-ink-soft">
              Codigo unico
              <input
                required
                value={codigoUnico}
                onChange={(e) => setCodigoUnico(e.target.value)}
                className="rounded-md border border-line bg-canvas px-3 py-2 text-ink outline-none focus:border-volt-dark"
                placeholder="Ex: PROD-001"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-ink-soft">
              Descricao
              <input
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="rounded-md border border-line bg-canvas px-3 py-2 text-ink outline-none focus:border-volt-dark"
                placeholder="Ex: Camiseta gola V"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm text-ink-soft">
                Cor
                <select
                  value={nomeCor}
                  onChange={(e) => setNomeCor(e.target.value)}
                  className="rounded-md border border-line bg-canvas px-3 py-2 text-ink outline-none focus:border-volt-dark"
                >
                  {cores.map((cor) => (
                    <option key={cor.id} value={cor.nomeCor}>
                      {cor.nomeCor}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm text-ink-soft">
                Tamanho
                <select
                  value={nomeTamanho}
                  onChange={(e) => setNomeTamanho(e.target.value)}
                  className="rounded-md border border-line bg-canvas px-3 py-2 text-ink outline-none focus:border-volt-dark"
                >
                  {tamanhos.map((tamanho) => (
                    <option key={tamanho.id} value={tamanho.nomeTamanho}>
                      {tamanho.nomeTamanho}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-1 text-sm text-ink-soft">
              Setor inicial
              <select
                value={nomeSetorInicial}
                onChange={(e) => setNomeSetorInicial(e.target.value)}
                className="rounded-md border border-line bg-canvas px-3 py-2 text-ink outline-none focus:border-volt-dark"
              >
                {setores.map((setor) => (
                  <option key={setor.id} value={setor.nome}>
                    {setor.nome}
                  </option>
                ))}
              </select>
            </label>

            {erro && <p className="text-sm font-medium text-danger">{erro}</p>}

            <button
              type="submit"
              disabled={enviando}
              className="mt-1 rounded-md bg-volt px-4 py-2 text-sm font-bold text-volt-ink hover:bg-volt-dark disabled:opacity-60"
            >
              {enviando ? "Criando..." : "Criar produto"}
            </button>
          </form>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <h3 className="px-5 pt-4 text-sm font-bold uppercase tracking-wide text-ink-soft">
            Cadastrados ({produtos.length})
          </h3>
          <div className="flex-1 overflow-y-auto px-5 py-3">
            {produtos.length === 0 && (
              <p className="text-sm text-ink-soft">Nenhum produto cadastrado ainda.</p>
            )}
            <ul className="flex flex-col gap-2">
              {produtos.map((produto) => (
                <li
                  key={produto.id}
                  className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5"
                >
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-full border border-line"
                    style={{ backgroundColor: produto.hexCode }}
                    title={produto.nomeCor}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm font-semibold text-ink">
                      {produto.codigoUnico}
                    </p>
                    <p className="truncate text-xs text-ink-soft">
                      {produto.nomeTamanho} · {produto.nomeSetorAtual}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExcluirClick(produto)}
                    disabled={excluindoId === produto.id}
                    aria-label={
                      confirmandoId === produto.id
                        ? `Confirmar exclusao de ${produto.codigoUnico}`
                        : `Excluir ${produto.codigoUnico}`
                    }
                    title={confirmandoId === produto.id ? "Clique de novo para confirmar" : "Excluir"}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors disabled:opacity-50 ${
                      confirmandoId === produto.id
                        ? "bg-danger text-canvas"
                        : "text-ink-soft hover:bg-danger/10 hover:text-danger"
                    }`}
                  >
                    {confirmandoId === produto.id ? (
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                    ) : (
                      <Trash2 className="h-4 w-4" strokeWidth={2.25} />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
}
