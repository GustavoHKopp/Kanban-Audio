import { Router } from "express";
import { QuadroController } from "../controllers/QuadroController";
import { ProdutoController } from "../controllers/ProdutoController";
import { ComandoVozController } from "../controllers/ComandoVozController";

export function criarRotas(
  quadroController: QuadroController,
  produtoController: ProdutoController,
  comandoVozController: ComandoVozController
): Router {
  const router = Router();

  router.get("/health", (_req, res) => res.json({ status: "ok" }));

  router.get("/quadro", quadroController.handle);

  router.post("/produtos", produtoController.criar);
  router.patch("/produtos/:codigoUnico/mover", produtoController.mover);
  router.delete("/produtos/:codigoUnico", produtoController.excluir);

  router.post("/comando-voz", comandoVozController.handle);

  return router;
}
