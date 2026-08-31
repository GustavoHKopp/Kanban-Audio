# Documentação do Projeto — Kanban de Produção com Comando de Voz

Este documento explica como o projeto foi construído, por quê, e o que aprender com ele. Foi escrito ao final do desenvolvimento, cobrindo as decisões tomadas ao longo do processo (incluindo os problemas reais que apareceram e como foram resolvidos).

**Contexto importante**: este é um projeto de estudo, focado em aprender desenvolvimento assistido por IA na prática — não um produto de Kanban a ser polido como software comercial. O valor está na camada de IA (NLU tolerante a linguagem natural, múltiplos provedores com fallback, depuração de problemas reais de latência/cota) e na arquitetura que permite trocar essas peças sem reescrever regra de negócio.

## 1. O que é o projeto

Um quadro Kanban industrial (Entrada → Corte → Costura → Acabamento → Expedição) para acompanhar produtos em produção, com duas formas de interação:

- **Manual**: arrastar e soltar cards entre colunas, criar/excluir produtos por um painel lateral.
- **Por voz**: falar comandos em linguagem natural ("joga o 102 pra costura", "cadastra a cor azul", "deleta o produto 55") que uma IA interpreta e executa.

## 2. Stack utilizada

| Camada | Tecnologia | Por quê |
|---|---|---|
| Backend | Node.js + TypeScript + Express | Simples, tipado, ecossistema maduro |
| Banco de dados | `node:sqlite` (nativo do Node 22+) | Zero dependências nativas — evitou o `better-sqlite3`, que exige Visual Studio Build Tools pra compilar no Windows e travou a instalação |
| Tempo real | Socket.io | Atualiza a tela de todo mundo sem reload quando algo muda |
| IA / NLU | Gemini, Groq e Anthropic (Claude), com fallback em cadeia | Nenhum provedor grátis é 100% confiável sozinho — a solução foi usar vários com fallback automático |
| Frontend | React + TypeScript + Vite | Build rápido, HMR, tooling moderno |
| Estilo | Tailwind CSS v4 | Sistema de tokens CSS nativo (`@theme`), facilita dark mode via variáveis |
| Ícones | lucide-react | Set de ícones consistente, leve, sem depender de fontes de ícone |
| Voz (entrada) | Web Speech API (`SpeechRecognition`) nativa do navegador | Grátis, sem custo de API, já embutida no Chrome/Edge |
| Tema claro/escuro | View Transitions API nativa | Anima a troca de tema com uma revelação circular, sem biblioteca externa |

Nenhuma dessas escolhas usa serviços pagos obrigatoriamente — o projeto roda 100% de graça (Gemini e Groq têm free tier; Anthropic é opcional).

## 3. Arquitetura: por que Hexagonal + Clean Architecture

A ideia central dos dois padrões (Hexagonal no backend, Clean Architecture no frontend) é a mesma: **a regra de negócio não pode depender de detalhes técnicos**. O código que decide "posso mover esse produto?" não deveria saber se os dados vêm de SQLite, PostgreSQL ou um arquivo texto. Isso trouxe um benefício prático que apareceu várias vezes neste projeto:

> Trocamos o SGBD (de `better-sqlite3` pra `node:sqlite`), trocamos o provedor de IA (de só-Anthropic pra Gemini+Groq+Anthropic com fallback), e reordenamos a prioridade entre eles — **sem tocar em nenhuma regra de negócio**. Só mexemos nos adapters.

### Backend: Ports & Adapters (Hexagonal)

```
src/
├── domain/                    # Núcleo — não importa nada de fora
│   ├── entities/               # Produto, Cor, Tamanho, Setor (tipos puros)
│   ├── use-cases/               # Regras de negócio (CriarProduto, MoverProduto, ExcluirProduto, ...)
│   └── ports/
│       ├── in/                  # Contratos que o mundo externo chama (ex: ProcessarComandoVozUseCase)
│       └── out/                 # Contratos que o domínio precisa (ex: ProdutoRepository, AiGateway)
│
├── adapters/                   # Implementações concretas dos ports
│   ├── in/web/                  # Controllers Express (traduzem HTTP → chamada de use case)
│   └── out/
│       ├── persistence/          # Repositórios SQLite (implementam os ports "out")
│       ├── ai/                   # GeminiAiAdapter, GroqAiAdapter, AnthropicAiAdapter, FallbackAiAdapter
│       └── realtime/              # SocketIoNotifier
│
└── config/
    └── container.ts             # Injeção de dependência manual: aqui tudo se conecta
```

**Regra de ouro**: uma seta de dependência nunca aponta de `domain/` para `adapters/`. O domínio define interfaces (`ports`); os adapters as implementam. O `container.ts` é o único lugar que conhece as classes concretas e monta o grafo de objetos na mão (sem framework de DI).

### Frontend: Clean Architecture

```
src/
├── domain/            # Entidades e contratos de caso de uso do front (iguais em espírito ao backend)
├── data/               # Implementações dos casos de uso, falando com protocolos abstratos (HttpClient)
├── infrastructure/      # Implementações concretas: Axios, Socket.io-client, Web Speech API
└── presentation/
    ├── components/       # UI pura (recebe props, dispara callbacks — não sabe de API)
    └── controllers/       # Hooks customizados (useKanban, useVoiceCommand, useTheme) — são os "controllers/presenters"
```

Os hooks (`useKanban`, `useVoiceCommand`) são o equivalente aos *use cases* do lado do cliente: orquestram estado, chamam os gateways de infraestrutura, e devolvem dados prontos pros componentes puros consumirem.

## 4. O pipeline de comando de voz, passo a passo

1. **Captura** — `WebSpeechGateway` usa a API nativa do navegador (`SpeechRecognition`) pra transformar áudio em texto. Sem custo, mas depende do navegador (funciona bem em Chrome/Edge) e da conexão com os servidores de reconhecimento do Google por trás dela.
2. **Envio** — o texto transcrito vai pro backend via `POST /api/comando-voz`.
3. **Interpretação (NLU)** — o `ProcessarComandoVoz` (use case) monta o contexto (setores/cores/tamanhos válidos hoje) e chama o `AiGateway`.
4. **Fallback em cadeia** — o `FallbackAiAdapter` tenta os provedores configurados em ordem (Groq → Gemini → Anthropic), com um **timeout de 6 segundos por provedor**. Se um travar ou estourar cota, cai pro próximo automaticamente.
5. **IA devolve um JSON estruturado** com a ação (`MOVER_PRODUTO`, `CRIAR_PRODUTO`, `EXCLUIR_PRODUTO`, `CRIAR_COR`, `CRIAR_TAMANHO`, `ABRIR_MODAL_CADASTRO` ou `INFORMACAO_INCOMPLETA`) e os dados extraídos.
6. **Execução** — o use case valida o mínimo necessário e chama o caso de uso de negócio correspondente (ex: `MoverProduto`).
7. **Persistência** — o repositório grava no SQLite.
8. **Broadcast** — o `SocketIoNotifier` emite um evento (`produto_movido`, `cor_criada`, etc.) pra todos os clientes conectados.
9. **UI atualiza sozinha** — o hook `useKanban` escuta esses eventos e atualiza a tela sem reload, em qualquer aba aberta.
10. **Loop contínuo** — no frontend, depois de mostrar o resultado (~2,2s), o microfone liga sozinho de novo, até você clicar pra desativar.

## 5. Decisões e problemas reais resolvidos durante o desenvolvimento

Isso é provavelmente a parte mais útil pra aprender — bugs reais, não hipotéticos:

### `better-sqlite3` não instalava no Windows
Exige compilar código nativo C++ (`node-gyp`), que precisa do Visual Studio Build Tools instalado. Como o Node 22+ já traz `node:sqlite` embutido (mesma API de `prepare().get()/.all()/.run()`), trocamos e o problema desapareceu — zero compilação nativa.

### Modelos de IA descontinuados
Durante o desenvolvimento, tanto `gemini-2.0-flash` quanto `llama-3.3-70b-versatile` (Groq) pararam de funcionar — os provedores descontinuam/trocam modelos com frequência no tier gratuito. A lição: **sempre confira contra a API real** (`GET /v1/models`), não confie cegamente em documentação ou treinamento prévio, porque esses catálogos mudam.

### Latência de ~26 segundos em alguns comandos
Investigado com instrumentação de tempo por adapter (`console.log` medindo `Date.now()` antes/depois de cada chamada). Descoberta: o Gemini free tier tem cota de **20 requisições por dia** pro modelo usado, e antes de recusar de vez, ele fica extremamente lento (26s) — um comportamento de "soft throttling" perto do limite. Solução: (1) reordenar Groq como primeira opção (sub-segundo, cota generosa), Gemini como reserva; (2) adicionar timeout de 6s por adapter no `FallbackAiAdapter`, então mesmo se um provedor travar, o sistema não espera mais que isso.

### Bug visual sutil no dark mode
O token `--color-ink` (cor do texto) precisa **inverter** entre os temas (escuro no claro, claro no escuro) — isso é o normal e esperado. Mas dois botões (`Novo Produto`, microfone) usavam esse mesmo token como **cor de fundo** (pra criar um "chip escuro com texto lime"), e quando `ink` virou claro no dark mode, os botões ficaram brancos com ícone amarelo — ilegíveis. Solução: criar um token novo, `--color-onyx`, que representa "sempre escuro, independente do tema", e usar esse nos botões que precisam de contraste fixo. Lição: **cores com propósito de texto e cores com propósito de superfície são conceitos diferentes, mesmo que comecem com o mesmo valor.**

### CORS e a porta errada
Ao rodar dois servidores de frontend por engano (um ficou preso em segundo plano), o navegador reclamou de CORS porque a porta mudou de 5173 pra 5174. Resolvido tornando o backend flexível: aceita qualquer origem `http://localhost:<porta>` (e depois qualquer IP da rede local, pra acesso via celular), em vez de fixar uma porta.

### Acesso pelo celular
Funciona pra tudo (Kanban, criar/mover produtos), **exceto o microfone** — navegadores só liberam captura de áudio em contexto seguro (HTTPS) ou em `localhost`. Acessar por IP puro (`http://192.168.x.x`) bloqueia o microfone por padrão. Ficou documentado como limitação conhecida.

### Inconsistência de leitura no `node:sqlite` (modo WAL) sob múltiplas conexões
Ao depurar diretamente o arquivo `.sqlite` com um script `node -e` separado enquanto o servidor também tinha o banco aberto, leituras concorrentes retornaram dados diferentes entre si (um "viu" produtos que o outro não via). Lição: **não abra conexões paralelas ad-hoc pra debugar um banco em modo WAL enquanto o processo principal está rodando** — use sempre a API do próprio servidor como fonte de verdade.

## 6. Onde fica cada tipo de regra

| Pergunta | Onde a resposta mora |
|---|---|
| "Posso mover esse produto pra esse setor?" | `domain/use-cases/MoverProduto.ts` |
| "O que o operador quis dizer com essa frase?" | `adapters/out/ai/*.ts` + prompt em `PromptComandoVoz.ts` |
| "Que cor de verdade é 'coral'?" | `domain/use-cases/CriarCor.ts` (mapa de nomes conhecidos + fallback determinístico) |
| "Como os dados chegam no navegador?" | `infrastructure/gateways/AxiosHttpClient.ts` e `SocketIoGateway.ts` (frontend) |
| "Que provedor de IA tentar primeiro?" | `config/container.ts` (backend) — é injeção de dependência, não regra de negócio |

## 7. Como rodar

```bash
# Backend
cd backend
npm install
cp .env.example .env   # preencher GEMINI_API_KEY e/ou GROQ_API_KEY
npm run seed
npm run dev             # http://localhost:3333

# Frontend (outro terminal)
cd frontend
npm install
npm run dev              # http://localhost:5173
```

## 8. Ideias pra evoluir (não implementadas)

- Testes automatizados (unitários nos use cases, que são puros e fáceis de testar sem mockar banco de verdade).
- Autenticação/autorização (hoje qualquer um na rede pode mexer no quadro).
- Histórico de movimentações (auditoria de quem moveu o quê e quando).
- Texto-pra-voz (TTS) pra o sistema "responder falando", não só com toast na tela.
- Editar/excluir cores e tamanhos (hoje só criação é suportada).
- Polimento de UX de Kanban propriamente dito (editar card existente, busca/filtro, drag mais suave) — deliberadamente fora do escopo deste estudo, que priorizou a camada de IA.
