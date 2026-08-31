import { Request, Response } from "express";
import { ListarQuadroUseCase } from "../../../../domain/ports/in/ListarQuadroUseCase";

export class QuadroController {
  constructor(private readonly listarQuadroUseCase: ListarQuadroUseCase) {}

  handle = async (_req: Request, res: Response): Promise<void> => {
    const quadro = await this.listarQuadroUseCase.executar();
    res.json(quadro);
  };
}
