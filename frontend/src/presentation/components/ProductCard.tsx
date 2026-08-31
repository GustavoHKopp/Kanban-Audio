import { ProdutoDetalhado } from "../../domain/entities/Produto";

interface ProductCardProps {
  produto: ProdutoDetalhado;
  draggable: boolean;
  onDragStart: (produto: ProdutoDetalhado) => void;
}

export function ProductCard({ produto, draggable, onDragStart }: ProductCardProps) {
  return (
    <div
      draggable={draggable}
      onDragStart={() => onDragStart(produto)}
      className="group cursor-grab rounded-lg border border-line bg-canvas p-3 shadow-card transition hover:-translate-y-0.5 hover:shadow-float active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-sm font-semibold text-ink">{produto.codigoUnico}</span>
        <span
          className="h-4 w-4 shrink-0 rounded-full border border-line"
          style={{ backgroundColor: produto.hexCode }}
          title={produto.nomeCor}
        />
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{produto.descricao}</p>
      <div className="mt-3 flex items-center gap-2">
        <span className="rounded-full bg-surface-alt px-2 py-0.5 text-xs font-medium text-ink-soft">
          {produto.nomeTamanho}
        </span>
        <span className="rounded-full bg-surface-alt px-2 py-0.5 text-xs font-medium text-ink-soft">
          {produto.nomeCor}
        </span>
      </div>
    </div>
  );
}
