import { useState } from "react";
import { Setor } from "../../domain/entities/Setor";
import { ProdutoDetalhado } from "../../domain/entities/Produto";
import { ProductCard } from "./ProductCard";

interface KanbanColumnProps {
  setor: Setor;
  produtos: ProdutoDetalhado[];
  onDragStart: (produto: ProdutoDetalhado) => void;
  onDrop: (setorDestino: Setor) => void;
}

export function KanbanColumn({ setor, produtos, onDragStart, onDrop }: KanbanColumnProps) {
  const [emHover, setEmHover] = useState(false);

  return (
    <div
      onDragOver={(evento) => {
        evento.preventDefault();
        setEmHover(true);
      }}
      onDragLeave={() => setEmHover(false)}
      onDrop={() => {
        setEmHover(false);
        onDrop(setor);
      }}
      className={`flex h-full min-w-[260px] flex-1 flex-col rounded-xl border transition-colors ${
        emHover ? "border-volt bg-surface-alt" : "border-line bg-surface"
      }`}
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink">{setor.nome}</h2>
        <span className="rounded-full bg-volt px-2 py-0.5 text-xs font-bold text-volt-ink">
          {produtos.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        {produtos.map((produto) => (
          <ProductCard key={produto.id} produto={produto} draggable onDragStart={onDragStart} />
        ))}
        {produtos.length === 0 && (
          <p className="mt-4 text-center text-xs text-ink-soft">Nenhum produto neste setor.</p>
        )}
      </div>
    </div>
  );
}
