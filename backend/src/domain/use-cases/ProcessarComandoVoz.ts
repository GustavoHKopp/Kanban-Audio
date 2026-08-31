import {
  ProcessarComandoVozUseCase,
  ResultadoComandoVoz,
  DadosParciaisProduto,
} from "../ports/in/ProcessarComandoVozUseCase";
import { CriarProdutoUseCase } from "../ports/in/CriarProdutoUseCase";
import { MoverProdutoUseCase } from "../ports/in/MoverProdutoUseCase";
import { ExcluirProdutoUseCase } from "../ports/in/ExcluirProdutoUseCase";
import { CriarCorUseCase } from "../ports/in/CriarCorUseCase";
import { CriarTamanhoUseCase } from "../ports/in/CriarTamanhoUseCase";
import { AiGateway, DadosExtraidosComandoVoz } from "../ports/out/AiGateway";
import { SetorRepository } from "../ports/out/SetorRepository";
import { CorRepository } from "../ports/out/CorRepository";
import { TamanhoRepository } from "../ports/out/TamanhoRepository";

function paraDadosParciais(data: DadosExtraidosComandoVoz): DadosParciaisProduto {
  return {
    codigoUnico: data.codigo ?? undefined,
    descricao: data.descricao ?? undefined,
    nomeCor: data.cor ?? undefined,
    nomeTamanho: data.tamanho ?? undefined,
    nomeSetorInicial: data.setorDestino ?? undefined,
  };
}

export class ProcessarComandoVoz implements ProcessarComandoVozUseCase {
  constructor(
    private readonly aiGateway: AiGateway,
    private readonly criarProdutoUseCase: CriarProdutoUseCase,
    private readonly moverProdutoUseCase: MoverProdutoUseCase,
    private readonly excluirProdutoUseCase: ExcluirProdutoUseCase,
    private readonly criarCorUseCase: CriarCorUseCase,
    private readonly criarTamanhoUseCase: CriarTamanhoUseCase,
    private readonly setorRepository: SetorRepository,
    private readonly corRepository: CorRepository,
    private readonly tamanhoRepository: TamanhoRepository
  ) {}

  async executar(transcricao: string): Promise<ResultadoComandoVoz> {
    const [setores, cores, tamanhos] = await Promise.all([
      this.setorRepository.listarTodos(),
      this.corRepository.listarTodos(),
      this.tamanhoRepository.listarTodos(),
    ]);

    const intencao = await this.aiGateway.interpretarComando(transcricao, {
      setoresDisponiveis: setores.map((s) => s.nome),
      coresDisponiveis: cores.map((c) => c.nomeCor),
      tamanhosDisponiveis: tamanhos.map((t) => t.nomeTamanho),
    });

    if (intencao.action === "INFORMACAO_INCOMPLETA") {
      return { sucesso: false, acao: "INFORMACAO_INCOMPLETA", mensagem: intencao.replyText };
    }

    if (intencao.action === "ABRIR_MODAL_CADASTRO") {
      return {
        sucesso: false,
        acao: "ABRIR_MODAL_CADASTRO",
        mensagem: intencao.replyText,
        missingFields: intencao.missingFields,
        dadosParciais: paraDadosParciais(intencao.data),
      };
    }

    if (intencao.action === "CRIAR_PRODUTO") {
      const { codigo, descricao, cor, tamanho, setorDestino } = intencao.data;
      if (!codigo || !descricao || !cor || !tamanho) {
        return {
          sucesso: false,
          acao: "ABRIR_MODAL_CADASTRO",
          mensagem: "Faltam dados para cadastrar o produto. Complete no formulario.",
          dadosParciais: paraDadosParciais(intencao.data),
        };
      }

      try {
        const produto = await this.criarProdutoUseCase.executar({
          codigoUnico: codigo,
          descricao,
          nomeCor: cor,
          nomeTamanho: tamanho,
          nomeSetorInicial: setorDestino || setores[0]?.nome || "Entrada",
        });
        return {
          sucesso: true,
          acao: "CRIAR_PRODUTO",
          mensagem: `Produto ${produto.codigoUnico} criado em ${produto.nomeSetorAtual}.`,
          produto,
        };
      } catch (erro) {
        return { sucesso: false, acao: "CRIAR_PRODUTO", mensagem: (erro as Error).message };
      }
    }

    if (intencao.action === "EXCLUIR_PRODUTO") {
      if (!intencao.data.codigo) {
        return {
          sucesso: false,
          acao: "INFORMACAO_INCOMPLETA",
          mensagem: intencao.replyText || "Preciso do codigo do produto para excluir.",
        };
      }

      try {
        await this.excluirProdutoUseCase.executar(intencao.data.codigo);
        return {
          sucesso: true,
          acao: "EXCLUIR_PRODUTO",
          mensagem: `Produto ${intencao.data.codigo.toUpperCase()} excluido.`,
        };
      } catch (erro) {
        return { sucesso: false, acao: "EXCLUIR_PRODUTO", mensagem: (erro as Error).message };
      }
    }

    if (intencao.action === "CRIAR_COR") {
      if (!intencao.data.cor) {
        return {
          sucesso: false,
          acao: "INFORMACAO_INCOMPLETA",
          mensagem: intencao.replyText || "Preciso do nome da cor para cadastrar.",
        };
      }

      try {
        const cor = await this.criarCorUseCase.executar(intencao.data.cor);
        return { sucesso: true, acao: "CRIAR_COR", mensagem: `Cor ${cor.nomeCor} cadastrada.` };
      } catch (erro) {
        return { sucesso: false, acao: "CRIAR_COR", mensagem: (erro as Error).message };
      }
    }

    if (intencao.action === "CRIAR_TAMANHO") {
      if (!intencao.data.tamanho) {
        return {
          sucesso: false,
          acao: "INFORMACAO_INCOMPLETA",
          mensagem: intencao.replyText || "Preciso do nome do tamanho para cadastrar.",
        };
      }

      try {
        const tamanho = await this.criarTamanhoUseCase.executar(intencao.data.tamanho);
        return {
          sucesso: true,
          acao: "CRIAR_TAMANHO",
          mensagem: `Tamanho ${tamanho.nomeTamanho} cadastrado.`,
        };
      } catch (erro) {
        return { sucesso: false, acao: "CRIAR_TAMANHO", mensagem: (erro as Error).message };
      }
    }

    // MOVER_PRODUTO
    if (!intencao.data.codigo || !intencao.data.setorDestino) {
      return {
        sucesso: false,
        acao: "INFORMACAO_INCOMPLETA",
        mensagem: intencao.replyText || "Preciso do codigo do produto e do setor de destino para mover.",
      };
    }

    try {
      const produto = await this.moverProdutoUseCase.executar({
        codigoUnico: intencao.data.codigo,
        nomeSetorDestino: intencao.data.setorDestino,
      });
      return {
        sucesso: true,
        acao: "MOVER_PRODUTO",
        mensagem: `Produto ${produto.codigoUnico} movido para ${produto.nomeSetorAtual}.`,
        produto,
      };
    } catch (erro) {
      return { sucesso: false, acao: "MOVER_PRODUTO", mensagem: (erro as Error).message };
    }
  }
}
