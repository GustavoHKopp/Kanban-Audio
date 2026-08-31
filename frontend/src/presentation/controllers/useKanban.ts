import { useCallback, useEffect, useState } from "react";
import { QuadroCompleto } from "../../domain/entities/QuadroCompleto";
import { ProdutoDetalhado } from "../../domain/entities/Produto";
import { Cor } from "../../domain/entities/Cor";
import { Tamanho } from "../../domain/entities/Tamanho";
import { carregarQuadro, moverCard, socketGateway } from "../../infrastructure/config/factories";

interface EstadoKanban {
  quadro: QuadroCompleto | null;
  carregando: boolean;
  erro: string | null;
}

export function useKanban() {
  const [estado, setEstado] = useState<EstadoKanban>({
    quadro: null,
    carregando: true,
    erro: null,
  });

  const carregar = useCallback(async () => {
    setEstado((atual) => ({ ...atual, carregando: true, erro: null }));
    try {
      const quadro = await carregarQuadro.executar();
      setEstado({ quadro, carregando: false, erro: null });
    } catch {
      setEstado({ quadro: null, carregando: false, erro: "Falha ao carregar o quadro. Verifique se o backend esta rodando." });
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    const aoCriar = (produto: ProdutoDetalhado) => {
      setEstado((atual) => {
        if (!atual.quadro) return atual;
        if (atual.quadro.produtos.some((p) => p.id === produto.id)) return atual;
        return { ...atual, quadro: { ...atual.quadro, produtos: [produto, ...atual.quadro.produtos] } };
      });
    };

    const aoMover = (payload: { produto: ProdutoDetalhado }) => {
      setEstado((atual) => {
        if (!atual.quadro) return atual;
        const produtos = atual.quadro.produtos.map((p) =>
          p.id === payload.produto.id ? payload.produto : p
        );
        return { ...atual, quadro: { ...atual.quadro, produtos } };
      });
    };

    const aoExcluir = (payload: { produtoId: string }) => {
      setEstado((atual) => {
        if (!atual.quadro) return atual;
        const produtos = atual.quadro.produtos.filter((p) => p.id !== payload.produtoId);
        return { ...atual, quadro: { ...atual.quadro, produtos } };
      });
    };

    const aoCriarCor = (cor: Cor) => {
      setEstado((atual) => {
        if (!atual.quadro) return atual;
        if (atual.quadro.cores.some((c) => c.id === cor.id)) return atual;
        return { ...atual, quadro: { ...atual.quadro, cores: [...atual.quadro.cores, cor] } };
      });
    };

    const aoCriarTamanho = (tamanho: Tamanho) => {
      setEstado((atual) => {
        if (!atual.quadro) return atual;
        if (atual.quadro.tamanhos.some((t) => t.id === tamanho.id)) return atual;
        return { ...atual, quadro: { ...atual.quadro, tamanhos: [...atual.quadro.tamanhos, tamanho] } };
      });
    };

    socketGateway.on<ProdutoDetalhado>("produto_criado", aoCriar);
    socketGateway.on<{ produto: ProdutoDetalhado }>("produto_movido", aoMover);
    socketGateway.on<{ produtoId: string }>("produto_excluido", aoExcluir);
    socketGateway.on<Cor>("cor_criada", aoCriarCor);
    socketGateway.on<Tamanho>("tamanho_criado", aoCriarTamanho);

    return () => {
      socketGateway.off("produto_criado");
      socketGateway.off("produto_movido");
      socketGateway.off("produto_excluido");
      socketGateway.off("cor_criada");
      socketGateway.off("tamanho_criado");
    };
  }, []);

  const mover = useCallback(async (codigoUnico: string, nomeSetorDestino: string) => {
    const produtoAtualizado = await moverCard.executar({ codigoUnico, nomeSetorDestino });
    setEstado((atual) => {
      if (!atual.quadro) return atual;
      const produtos = atual.quadro.produtos.map((p) =>
        p.id === produtoAtualizado.id ? produtoAtualizado : p
      );
      return { ...atual, quadro: { ...atual.quadro, produtos } };
    });
  }, []);

  return { ...estado, recarregar: carregar, mover };
}
