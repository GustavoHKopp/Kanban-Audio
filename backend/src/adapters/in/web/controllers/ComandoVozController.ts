import { Request, Response } from "express";
import { ProcessarComandoVozUseCase } from "../../../../domain/ports/in/ProcessarComandoVozUseCase";

export class ComandoVozController {
  constructor(private readonly processarComandoVozUseCase: ProcessarComandoVozUseCase) {}

  handle = async (req: Request, res: Response): Promise<void> => {
    try {
      const { transcricao } = req.body;
      if (!transcricao || typeof transcricao !== "string") {
        res.status(400).json({ sucesso: false, mensagem: "Campo 'transcricao' e obrigatorio." });
        return;
      }

      const resultado = await this.processarComandoVozUseCase.executar(transcricao);
      res.status(resultado.sucesso ? 200 : 422).json(resultado);
    } catch (erro) {
      res.status(400).json({ sucesso: false, mensagem: (erro as Error).message });
    }
  };
}
