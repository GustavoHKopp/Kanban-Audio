import { Server } from "socket.io";
import { DatabaseSync } from "node:sqlite";
import { env } from "./env";
import { criarConexao, executarMigrations } from "../adapters/out/persistence/Database";
import { SqliteProdutoRepository } from "../adapters/out/persistence/SqliteProdutoRepository";
import { SqliteSetorRepository } from "../adapters/out/persistence/SqliteSetorRepository";
import { SqliteCorRepository } from "../adapters/out/persistence/SqliteCorRepository";
import { SqliteTamanhoRepository } from "../adapters/out/persistence/SqliteTamanhoRepository";
import { SocketIoNotifier } from "../adapters/out/realtime/SocketIoNotifier";
import { AnthropicAiAdapter } from "../adapters/out/ai/AnthropicAiAdapter";
import { GeminiAiAdapter } from "../adapters/out/ai/GeminiAiAdapter";
import { GroqAiAdapter } from "../adapters/out/ai/GroqAiAdapter";
import { FallbackAiAdapter } from "../adapters/out/ai/FallbackAiAdapter";
import { NullAiAdapter } from "../adapters/out/ai/NullAiAdapter";
import { AiGateway } from "../domain/ports/out/AiGateway";
import { CriarProduto } from "../domain/use-cases/CriarProduto";
import { MoverProduto } from "../domain/use-cases/MoverProduto";
import { ExcluirProduto } from "../domain/use-cases/ExcluirProduto";
import { CriarCor } from "../domain/use-cases/CriarCor";
import { CriarTamanho } from "../domain/use-cases/CriarTamanho";
import { ProcessarComandoVoz } from "../domain/use-cases/ProcessarComandoVoz";
import { ListarQuadro } from "../domain/use-cases/ListarQuadro";
import { QuadroController } from "../adapters/in/web/controllers/QuadroController";
import { ProdutoController } from "../adapters/in/web/controllers/ProdutoController";
import { ComandoVozController } from "../adapters/in/web/controllers/ComandoVozController";

export function montarContainer(io: Server) {
  const db: DatabaseSync = criarConexao();
  executarMigrations(db);

  const produtoRepository = new SqliteProdutoRepository(db);
  const setorRepository = new SqliteSetorRepository(db);
  const corRepository = new SqliteCorRepository(db);
  const tamanhoRepository = new SqliteTamanhoRepository(db);

  const notifier = new SocketIoNotifier(io);

  // Groq primeiro: latencia sub-segundo e cota generosa. Gemini como reserva
  // (free tier do gemini-3.6-flash e limitado a 20 req/dia e fica lento perto do limite).
  const adaptadoresDisponiveis: AiGateway[] = [];
  if (env.groqApiKey) adaptadoresDisponiveis.push(new GroqAiAdapter(env.groqApiKey));
  if (env.geminiApiKey) adaptadoresDisponiveis.push(new GeminiAiAdapter(env.geminiApiKey));
  if (env.anthropicApiKey) adaptadoresDisponiveis.push(new AnthropicAiAdapter(env.anthropicApiKey));

  const aiGateway: AiGateway =
    adaptadoresDisponiveis.length > 0
      ? new FallbackAiAdapter(adaptadoresDisponiveis)
      : new NullAiAdapter();

  const criarProdutoUseCase = new CriarProduto(
    produtoRepository,
    setorRepository,
    corRepository,
    tamanhoRepository,
    notifier
  );

  const moverProdutoUseCase = new MoverProduto(produtoRepository, setorRepository, notifier);
  const excluirProdutoUseCase = new ExcluirProduto(produtoRepository, notifier);
  const criarCorUseCase = new CriarCor(corRepository, notifier);
  const criarTamanhoUseCase = new CriarTamanho(tamanhoRepository, notifier);

  const processarComandoVozUseCase = new ProcessarComandoVoz(
    aiGateway,
    criarProdutoUseCase,
    moverProdutoUseCase,
    excluirProdutoUseCase,
    criarCorUseCase,
    criarTamanhoUseCase,
    setorRepository,
    corRepository,
    tamanhoRepository
  );

  const listarQuadroUseCase = new ListarQuadro(
    produtoRepository,
    setorRepository,
    corRepository,
    tamanhoRepository
  );

  const quadroController = new QuadroController(listarQuadroUseCase);
  const produtoController = new ProdutoController(
    criarProdutoUseCase,
    moverProdutoUseCase,
    excluirProdutoUseCase
  );
  const comandoVozController = new ComandoVozController(processarComandoVozUseCase);

  return { quadroController, produtoController, comandoVozController, db };
}
