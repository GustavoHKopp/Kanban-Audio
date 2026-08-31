import { Request, Response } from "express";
import { CriarProdutoUseCase } from "../../../../domain/ports/in/CriarProdutoUseCase";
import { MoverProdutoUseCase } from "../../../../domain/ports/in/MoverProdutoUseCase";
import { ExcluirProdutoUseCase } from "../../../../domain/ports/in/ExcluirProdutoUseCase";

export class ProdutoController {
  constructor(
    private readonly criarProdutoUseCase: CriarProdutoUseCase,
    private readonly moverProdutoUseCase: MoverProdutoUseCase,
    private readonly excluirProdutoUseCase: ExcluirProdutoUseCase
  ) {}

  criar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { codigoUnico, descricao, nomeCor, nomeTamanho, nomeSetorInicial } = req.body;
      const produto = await this.criarProdutoUseCase.executar({
        codigoUnico,
        descricao,
        nomeCor,
        nomeTamanho,
        nomeSetorInicial,
      });
      res.status(201).json(produto);
    } catch (erro) {
      res.status(400).json({ mensagem: (erro as Error).message });
    }
  };

  mover = async (req: Request, res: Response): Promise<void> => {
    try {
      const codigoUnico = String(req.params.codigoUnico);
      const { nomeSetorDestino, nomeCor, nomeTamanho } = req.body;
      const produto = await this.moverProdutoUseCase.executar({
        codigoUnico,
        nomeSetorDestino,
        nomeCor,
        nomeTamanho,
      });
      res.status(200).json(produto);
    } catch (erro) {
      res.status(400).json({ mensagem: (erro as Error).message });
    }
  };

  excluir = async (req: Request, res: Response): Promise<void> => {
    try {
      const codigoUnico = String(req.params.codigoUnico);
      await this.excluirProdutoUseCase.executar(codigoUnico);
      res.status(204).send();
    } catch (erro) {
      res.status(400).json({ mensagem: (erro as Error).message });
    }
  };
}
