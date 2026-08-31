# Documentação Técnica — Kanban de Produção com Comando de Voz

Referência completa do sistema: o que ele faz, como está estruturado, e onde encontrar cada parte do código.

---

## 1. Visão geral

Aplicação de quadro Kanban para acompanhar produtos em produção têxtil, organizados em cinco setores fixos: **Entrada → Corte → Costura → Acabamento → Expedição**.

Duas formas de interação, equivalentes em efeito:

- **Manual**: arrastar/soltar cards entre colunas; criar e excluir produtos por um painel lateral.
- **Por voz**: falar um comando (ex.: "joga o 102 pra costura"); o backend transcreve, interpreta com IA e executa a mesma ação que a interação manual executaria.

O sistema é composto por dois processos independentes:

| Processo | Papel | Porta padrão |
|---|---|---|
| `backend/` | API REST + WebSocket + banco de dados + integração com IA | `3333` |
| `frontend/` | Interface web (React) | `5173` |

---

## 2. Como rodar

### Pré-requisitos

- Node.js 22 ou superior (o backend usa o módulo nativo `node:sqlite`)
- Chave de API do [Gemini](https://aistudio.google.com/apikey) e/ou [Groq](https://console.groq.com/keys) — necessária apenas para o comando de voz
- Navegador Chrome ou Edge — necessário apenas para o reconhecimento de voz (`SpeechRecognition`)

### Passos

```bash
# Backend
cd backend
npm install
cp .env.example .env    # preencher GEMINI_API_KEY e/ou GROQ_API_KEY
npm run seed              # cria as tabelas e popula setores/cores/tamanhos padrão
npm run dev                # sobe em http://localhost:3333

# Frontend, em outro terminal
cd frontend
npm install
npm run dev                 # sobe em http://localhost:5173
```

Acesse `http://localhost:5173`. Sem chave de IA configurada, o quadro funciona normalmente (criar/mover/excluir manual); o comando de voz responde com uma mensagem explicando que nenhum provedor está configurado.

### Scripts disponíveis

| Local | Comando | Efeito |
|---|---|---|
| `backend/` | `npm run dev` | Inicia com recarga automática (`tsx watch`) |
| `backend/` | `npm run seed` | Cria as tabelas (se não existirem) e popula dados padrão |
| `backend/` | `npm run build` | Compila TypeScript para `backend/dist/` |
| `backend/` | `npm start` | Executa a versão compilada (`dist/server.js`) |
| `frontend/` | `npm run dev` | Inicia o servidor de desenvolvimento Vite |
| `frontend/` | `npm run build` | Gera build de produção em `frontend/dist/` |
| `frontend/` | `npm run preview` | Serve o build de produção localmente |
| `frontend/` | `npm run lint` | Roda o linter (oxlint) |

---

## 3. Configuração

Variáveis de ambiente lidas de `backend/.env` (veja `backend/.env.example`):

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3333` | Porta HTTP do backend |
| `GEMINI_API_KEY` | vazio | Chave da API do Google Gemini |
| `GROQ_API_KEY` | vazio | Chave da API da Groq |
| `ANTHROPIC_API_KEY` | vazio | Chave da API da Anthropic (Claude) |
| `CORS_ORIGIN` | vazio | Origem adicional liberada no CORS |

Pelo menos uma das três chaves de IA precisa estar preenchida para o comando de voz funcionar. As três podem coexistir — veja a ordem de tentativa na seção 7.

`CORS_ORIGIN` é opcional: qualquer origem `http://localhost:<porta>` e qualquer IP de rede privada (`192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`) já são liberados automaticamente, para permitir acesso de outros dispositivos na mesma rede. A lógica está em `backend/src/config/env.ts`, função `origemPermitida`.

Frontend (`frontend/.env`, opcional): `VITE_API_URL` e `VITE_SOCKET_URL` — se deixados em branco, o frontend detecta o host automaticamente a partir da URL usada para acessá-lo (funciona tanto em `localhost` quanto ao acessar por IP de rede).

---

## 4. Arquitetura

### 4.1 Backend — `backend/src/`

Organizado em Arquitetura Hexagonal (Ports & Adapters). Regra estrutural: código em `domain/` nunca importa de `adapters/`.

```
domain/
├── entities/            Produto, Cor, Tamanho, Setor — tipos de dados puros
├── use-cases/           regras de negocio (uma classe por operacao)
│   ├── CriarProduto.ts
│   ├── MoverProduto.ts
│   ├── ExcluirProduto.ts
│   ├── CriarCor.ts
│   ├── CriarTamanho.ts
│   ├── ProcessarComandoVoz.ts   orquestra a interpretacao de voz + despacha para os use cases acima
│   └── ListarQuadro.ts
└── ports/
    ├── in/               interfaces que os controllers chamam (uma por use case)
    └── out/               interfaces que os use cases exigem de fora:
                            ProdutoRepository, SetorRepository, CorRepository,
                            TamanhoRepository, AiGateway, RealtimeNotifier

adapters/
├── in/web/
│   ├── controllers/       QuadroController, ProdutoController, ComandoVozController
│   └── routes/index.ts    definicao das rotas Express
└── out/
    ├── persistence/       Database.ts (conexao + schema) + um repositorio SQLite por entidade
    ├── ai/                GeminiAiAdapter, GroqAiAdapter, AnthropicAiAdapter,
    │                       FallbackAiAdapter (orquestra os tres), NullAiAdapter (sem chave),
    │                       PromptComandoVoz.ts (prompt e parsing compartilhados)
    └── realtime/           SocketIoNotifier

config/
├── container.ts          instancia e conecta todas as classes concretas (injecao de dependencia manual)
└── env.ts                 leitura de variaveis de ambiente

seed/seed.ts               popula setores, cores e tamanhos padrao
server.ts                  ponto de entrada: cria o Express, o Socket.io, monta as rotas
```

Toda instanciação de classe concreta (qual repositório, qual adapter de IA, em qual ordem) acontece exclusivamente em `config/container.ts`.

### 4.2 Frontend — `frontend/src/`

Organizado em Clean Architecture.

```
domain/
├── entities/             tipos de dados (espelham as entidades do backend)
└── usecases/              contratos de caso de uso do cliente (interfaces)

data/
├── protocols/             HttpClient, SocketClient — interfaces de infraestrutura
└── usecases/               implementacoes dos contratos de domain/usecases,
                             dependendo apenas das interfaces de protocols/

infrastructure/
├── config/                factories.ts (monta as instancias concretas) + env.ts
└── gateways/               AxiosHttpClient, SocketIoGateway, WebSpeechGateway
                             (implementacoes concretas dos protocols)

presentation/
├── components/            UI pura: KanbanBoard, KanbanColumn, ProductCard, VoiceButton,
│                            Toast, ThemeToggle, ProdutoPainel
└── controllers/            hooks: useKanban, useVoiceCommand, useTheme
                             (equivalentes a use cases/presenters do lado do cliente)

App.tsx                    monta os hooks e componentes, orquestra o estado da tela
```

---

## 5. Modelo de dados

Banco SQLite (`backend/data/kanban.sqlite`, criado automaticamente). Schema definido em `backend/src/adapters/out/persistence/Database.ts`.

| Tabela | Colunas | Observações |
|---|---|---|
| `setores` | `id`, `nome`, `ordem`, `data_criacao` | As 5 colunas do quadro; `ordem` define a posição |
| `cores` | `id`, `nome_cor`, `hex_code` | `hex_code` é resolvido automaticamente ao criar por voz (ver `CriarCor.ts`) |
| `tamanhos` | `id`, `nome_tamanho` | |
| `produtos` | `id`, `codigo_unico`, `descricao`, `id_cor`, `id_tamanho`, `id_setor_atual`, `data_criacao`, `data_atualizacao` | `codigo_unico` é único; chaves estrangeiras para `cores`, `tamanhos`, `setores` |
| `fluxos` | `id`, `setor_origem_id`, `setor_destino_id` | Criada pelo schema mas não usada pelas regras de negócio atuais — produtos podem se mover livremente entre quaisquer dois setores |

Entidades TypeScript correspondentes: `backend/src/domain/entities/`.

---

## 6. API REST

Base: `http://localhost:3333/api`

### `GET /health`
Healthcheck. Resposta: `{ "status": "ok" }`.

### `GET /quadro`
Retorna o estado completo do quadro.

```json
{
  "setores": [{ "id": "...", "nome": "Entrada", "ordem": 0, "dataCriacao": "..." }],
  "cores": [{ "id": "...", "nomeCor": "Azul", "hexCode": "#2563EB" }],
  "tamanhos": [{ "id": "...", "nomeTamanho": "M" }],
  "produtos": [{
    "id": "...", "codigoUnico": "PROD-001", "descricao": "...",
    "idCor": "...", "idTamanho": "...", "idSetorAtual": "...",
    "nomeCor": "Azul", "hexCode": "#2563EB", "nomeTamanho": "M", "nomeSetorAtual": "Entrada",
    "dataCriacao": "...", "dataAtualizacao": "..."
  }]
}
```

### `POST /produtos`
Cria um produto.

Corpo: `{ "codigoUnico": string, "descricao": string, "nomeCor": string, "nomeTamanho": string, "nomeSetorInicial": string }`

- `201` com o produto criado.
- `400` se o código já existir, ou se cor/tamanho/setor não existirem.

### `PATCH /produtos/:codigoUnico/mover`
Move um produto para outro setor.

Corpo: `{ "nomeSetorDestino": string }`

- `200` com o produto atualizado.
- `400` se o produto não existir, o setor não existir, ou o produto já estiver nesse setor.

### `DELETE /produtos/:codigoUnico`
Exclui um produto. Sem regra de validação além de o produto existir.

- `204` sem corpo, em caso de sucesso.
- `400` se o produto não for encontrado.

### `POST /comando-voz`
Recebe uma transcrição de voz e executa a ação interpretada pela IA.

Corpo: `{ "transcricao": string }`

Resposta (`200` se `sucesso: true`, `422` caso contrário):

```json
{
  "sucesso": boolean,
  "acao": "MOVER_PRODUTO" | "CRIAR_PRODUTO" | "EXCLUIR_PRODUTO" | "CRIAR_COR" | "CRIAR_TAMANHO" | "ABRIR_MODAL_CADASTRO" | "INFORMACAO_INCOMPLETA",
  "mensagem": string,
  "produto": { /* presente quando a acao cria/move um produto com sucesso */ },
  "dadosParciais": { /* presente em ABRIR_MODAL_CADASTRO: o que a IA conseguiu extrair */ },
  "missingFields": string[] /* presente em ABRIR_MODAL_CADASTRO: campos que faltam */
}
```

Implementado em `ComandoVozController` → `ProcessarComandoVozUseCase` → `ProcessarComandoVoz` (ver seção 7).

---

## 7. Motor de comando de voz

### Fluxo de execução

1. Frontend transcreve áudio para texto (`WebSpeechGateway`, API nativa do navegador) e envia para `POST /comando-voz`.
2. `ProcessarComandoVoz` (backend) monta o contexto atual — nomes de setores, cores e tamanhos existentes — e chama `AiGateway.interpretarComando(transcricao, contexto)`.
3. `FallbackAiAdapter` tenta os provedores configurados nesta ordem: **Groq → Gemini → Anthropic**, com timeout de 6 segundos por tentativa. O primeiro que responder com sucesso é usado.
4. A IA retorna um JSON estruturado (contrato abaixo).
5. `ProcessarComandoVoz` mapeia a ação para o use case correspondente (`CriarProduto`, `MoverProduto`, `ExcluirProduto`, `CriarCor` ou `CriarTamanho`) e executa.
6. O resultado é persistido no SQLite e propagado via WebSocket (seção 8) para todos os clientes conectados.

### Contrato JSON retornado pela IA

Definido em `backend/src/domain/ports/out/AiGateway.ts` e no prompt compartilhado (`PromptComandoVoz.ts`):

```ts
{
  action: "MOVER_PRODUTO" | "CRIAR_PRODUTO" | "EXCLUIR_PRODUTO"
        | "CRIAR_COR" | "CRIAR_TAMANHO"
        | "ABRIR_MODAL_CADASTRO" | "INFORMACAO_INCOMPLETA",
  data: {
    codigo: string | null,
    setorDestino: string | null,
    descricao: string | null,
    cor: string | null,
    tamanho: string | null,
  },
  missingFields: string[],
  replyText: string,
}
```

### Ações suportadas

| Ação | Campos usados de `data` | Efeito |
|---|---|---|
| `MOVER_PRODUTO` | `codigo`, `setorDestino` | Move o produto de código `codigo` para o setor `setorDestino` |
| `CRIAR_PRODUTO` | `codigo`, `descricao`, `cor`, `tamanho`, `setorDestino` (opcional) | Cria o produto; se `setorDestino` não vier, usa o primeiro setor cadastrado |
| `EXCLUIR_PRODUTO` | `codigo` | Exclui o produto, sem outra validação |
| `CRIAR_COR` | `cor` | Cadastra uma cor nova; o hex é resolvido por um mapa de nomes conhecidos (`CriarCor.ts`) com fallback determinístico para nomes não mapeados |
| `CRIAR_TAMANHO` | `tamanho` | Cadastra um tamanho novo |
| `ABRIR_MODAL_CADASTRO` | o que foi extraído + `missingFields` | Retornado quando falta algum dos 4 campos obrigatórios para `CRIAR_PRODUTO`; o frontend abre o painel de cadastro pré-preenchido |
| `INFORMACAO_INCOMPLETA` | — | Comando ambíguo, incompreendido, ou nenhum provedor de IA disponível; `replyText` explica o motivo |

O prompt (`PromptComandoVoz.ts`) instrui a IA a tolerar sinônimos de verbos ("jogar", "passar", "muda", "bota", "troca" → mover; "deletar", "excluir", "remove", "apaga" → excluir) e de nomes de setor (ex.: "despacho" → Expedição), normalizando sempre para a grafia exata cadastrada no banco.

---

## 8. Eventos WebSocket (Socket.io)

Emitidos pelo backend (`SocketIoNotifier`) para todos os clientes conectados, refletindo qualquer mudança de estado — seja originada por ação manual ou por voz.

| Evento | Payload | Disparado por |
|---|---|---|
| `produto_criado` | `ProdutoDetalhado` | `CriarProduto` |
| `produto_movido` | `{ produto: ProdutoDetalhado, setorOrigemId: string }` | `MoverProduto` |
| `produto_excluido` | `{ produtoId: string }` | `ExcluirProduto` |
| `cor_criada` | `Cor` | `CriarCor` |
| `tamanho_criado` | `Tamanho` | `CriarTamanho` |

No frontend, `useKanban.ts` assina esses eventos e atualiza o estado local sem recarregar a página.

---

## 9. Onde encontrar cada coisa

| Preciso saber... | Vou em... |
|---|---|
| Se um produto pode ser movido para tal setor | `backend/src/domain/use-cases/MoverProduto.ts` |
| Como a IA interpreta a fala do usuário | `backend/src/adapters/out/ai/PromptComandoVoz.ts` |
| Qual provedor de IA é chamado primeiro | `backend/src/config/container.ts` |
| Como o hex de uma cor nova é decidido | `backend/src/domain/use-cases/CriarCor.ts` |
| Como o frontend descobre o endereço do backend | `frontend/src/infrastructure/config/env.ts` |
| Como o tema claro/escuro é aplicado | `frontend/src/presentation/controllers/useTheme.ts` e `frontend/src/index.css` |
| O ciclo de escuta contínua do microfone | `frontend/src/presentation/controllers/useVoiceCommand.ts` |
| As rotas HTTP disponíveis | `backend/src/adapters/in/web/routes/index.ts` |
| O schema do banco | `backend/src/adapters/out/persistence/Database.ts` |

---

## 10. Limitações conhecidas

- O reconhecimento de voz exige Chrome ou Edge (Web Speech API não implementada no Firefox/Safari).
- O microfone só é liberado pelo navegador em contexto seguro: `localhost` ou HTTPS. Acessando por IP de rede local (ex.: celular), o quadro funciona, mas o comando de voz é bloqueado.
- Provedores de IA gratuitos têm cotas limitadas; o `FallbackAiAdapter` mitiga isso tentando múltiplos provedores em sequência, mas não elimina a possibilidade de todos falharem ao mesmo tempo.
- Não há autenticação: qualquer cliente na mesma rede que acessar o frontend pode ler e alterar o quadro.
- Cores e tamanhos podem ser criados mas não editados ou excluídos pela interface atual.
