import { useState } from "react";
import { QuadroCompleto } from "../../domain/entities/QuadroCompleto";
import { Setor } from "../../domain/entities/Setor";
import { ProdutoDetalhado } from "../../domain/entities/Produto";
import { KanbanColumn } from "./KanbanColumn";

interface KanbanBoardProps {
  quadro: QuadroCompleto;
  onMover: (codigoUnico: string, nomeSetorDestino: string) => Promise<void>;
  onErro: (mensagem: string) => void;
}

export function KanbanBoard({ quadro, onMover, onErro }: KanbanBoardProps) {
  const [produtoArrastado, setProdutoArrastado] = useState<ProdutoDetalhado | null>(null);

  const handleDrop = async (setorDestino: Setor) => {
    if (!produtoArrastado) return;
    if (produtoArrastado.idSetorAtual === setorDestino.id) {
      setProdutoArrastado(null);
      return;
    }
    try {
      await onMover(produtoArrastado.codigoUnico, setorDestino.nome);
    } catch (erro) {
      onErro((erro as Error).message || "Nao foi possivel mover o produto.");
    } finally {
      setProdutoArrastado(null);
    }
  };

  return (
    <div className="flex h-full gap-4 overflow-x-auto pb-4">
      {quadro.setores.map((setor) => (
        <KanbanColumn
          key={setor.id}
          setor={setor}
          produtos={quadro.produtos.filter((p) => p.idSetorAtual === setor.id)}
          onDragStart={setProdutoArrastado}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
}
