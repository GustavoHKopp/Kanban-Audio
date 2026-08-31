import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { env, origemPermitida } from "./config/env";
import { montarContainer } from "./config/container";
import { criarRotas } from "./adapters/in/web/routes";

const app = express();
const httpServer = http.createServer(app);

const corsOriginCallback = (
  origin: string | undefined,
  callback: (erro: Error | null, permitir?: boolean) => void
) => {
  callback(null, origemPermitida(origin));
};

const io = new Server(httpServer, {
  cors: { origin: corsOriginCallback, methods: ["GET", "POST", "PATCH"] },
});

app.use(cors({ origin: corsOriginCallback }));
app.use(express.json());

const { quadroController, produtoController, comandoVozController } = montarContainer(io);

app.use("/api", criarRotas(quadroController, produtoController, comandoVozController));

io.on("connection", (socket) => {
  console.log(`[socket] cliente conectado: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`[socket] cliente desconectado: ${socket.id}`);
  });
});

httpServer.listen(env.port, () => {
  console.log(`Kanban Audio backend rodando em http://localhost:${env.port}`);
  const provedores = [
    env.groqApiKey && "Groq",
    env.geminiApiKey && "Gemini",
    env.anthropicApiKey && "Anthropic",
  ].filter(Boolean);

  if (provedores.length === 0) {
    console.warn(
      "[aviso] Nenhuma chave de IA definida (GEMINI_API_KEY / GROQ_API_KEY / ANTHROPIC_API_KEY). O comando de voz respondera com acao DESCONHECIDO."
    );
  } else {
    console.log(`[ia] Provedores ativos, em ordem de fallback: ${provedores.join(" -> ")}`);
  }
});
