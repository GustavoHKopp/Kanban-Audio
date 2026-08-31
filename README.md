# Kanban de Produção com Comando de Voz

> Projeto de estudo focado em desenvolvimento assistido por IA: arquitetura testável, múltiplos provedores de IA com fallback, e uma interface de voz tolerante a linguagem natural. O objetivo não é um produto de Kanban polido — é aprender, na prática, a integrar e depurar IA em uma aplicação real.

Quadro Kanban industrial (**Entrada → Corte → Costura → Acabamento → Expedição**) para acompanhar produtos em produção, com duas formas de interação: arrastar/soltar cards manualmente, ou falar comandos em linguagem natural que uma IA interpreta e executa ("joga o 102 pra costura", "cadastra a cor coral", "deleta o produto 55").

Backend em **Arquitetura Hexagonal** (Ports & Adapters), frontend em **Clean Architecture** — veja [DOCUMENTACAO_PROJETO.md](DOCUMENTACAO_PROJETO.md) para uma explicação aprofundada das decisões de design e dos problemas reais resolvidos durante o desenvolvimento (bugs de verdade, não hipóteses).

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Node.js 22+ · TypeScript · Express |
| Banco de dados | `node:sqlite` (nativo do Node, sem dependências de compilação) |
| Tempo real | Socket.io |
| IA / NLU | Gemini + Groq + Anthropic, com fallback automático em cadeia |
| Frontend | React 19 · TypeScript · Vite |
| Estilo | Tailwind CSS v4 (dark/light mode via tokens) |
| Ícones | lucide-react |
| Reconhecimento de voz | Web Speech API (nativa do navegador) |

## Pré-requisitos

- **Node.js 22 ou superior** (o backend usa o módulo nativo `node:sqlite`, disponível a partir dessa versão)
- Navegador Chrome ou Edge (para o reconhecimento de voz — `SpeechRecognition` não é suportado no Firefox/Safari)
- Chave de API gratuita do [Gemini](https://aistudio.google.com/apikey) e/ou [Groq](https://console.groq.com/keys) para habilitar o comando de voz (opcional — o resto do app funciona sem elas)

## Como rodar

### Backend

```bash
cd backend
npm install
cp .env.example .env    # preencher GEMINI_API_KEY e/ou GROQ_API_KEY
npm run seed             # popula setores, cores e tamanhos padrão
npm run dev              # http://localhost:3333
```

### Frontend

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

Abra `http://localhost:5173` no navegador. Sem chave de IA configurada, o comando de voz responde com um aviso explicativo, mas o quadro (criar, mover, excluir produtos manualmente) funciona normalmente.

### Variáveis de ambiente (`backend/.env`)

| Variável | Obrigatória | Descrição |
|---|---|---|
| `PORT` | Não (padrão `3333`) | Porta do servidor HTTP |
| `GEMINI_API_KEY` | Não* | Chave da API do Google Gemini |
| `GROQ_API_KEY` | Não* | Chave da API da Groq |
| `ANTHROPIC_API_KEY` | Não | Chave da API da Anthropic (Claude) — fallback opcional adicional |
| `CORS_ORIGIN` | Não | Origem extra liberada no CORS. Qualquer `http://localhost:<porta>` e qualquer IP da rede local já são liberados automaticamente |

\* Pelo menos uma chave de IA é necessária para o comando de voz funcionar. Sem nenhuma, a ação retorna `INFORMACAO_INCOMPLETA` explicando o motivo.

## Rotas da API

Base: `http://localhost:3333/api`

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Healthcheck simples |
| `GET` | `/quadro` | Retorna setores, cores, tamanhos e produtos (estado completo do quadro) |
| `POST` | `/produtos` | Cria um produto (`codigoUnico`, `descricao`, `nomeCor`, `nomeTamanho`, `nomeSetorInicial`) |
| `PATCH` | `/produtos/:codigoUnico/mover` | Move um produto para outro setor (`nomeSetorDestino`) |
| `DELETE` | `/produtos/:codigoUnico` | Exclui um produto, sem validação de regras de negócio |
| `POST` | `/comando-voz` | Recebe uma transcrição de voz (`transcricao`) e executa a ação interpretada pela IA |

## Eventos em tempo real (Socket.io)

O servidor emite estes eventos para todos os clientes conectados sempre que o estado muda (por ação manual ou por voz):

| Evento | Payload | Quando dispara |
|---|---|---|
| `produto_criado` | `ProdutoDetalhado` | Um novo produto foi cadastrado |
| `produto_movido` | `{ produto, setorOrigemId }` | Um produto mudou de setor |
| `produto_excluido` | `{ produtoId }` | Um produto foi excluído |
| `cor_criada` | `Cor` | Uma nova cor foi cadastrada |
| `tamanho_criado` | `Tamanho` | Um novo tamanho foi cadastrado |

## Comandos de voz suportados

A IA entende linguagem natural, sinônimos e frases incompletas — não é preciso decorar um formato exato. Alguns exemplos:

- **Mover**: "joga o 102 pra costura", "muda o PROD-01 pra expedição", "102 pra costura" (atalho sem verbo)
- **Criar produto**: "cadastra o produto 200, camiseta azul tamanho M" (se faltar algum dado, abre o painel de produto já preenchido com o que foi entendido)
- **Excluir**: "deleta o produto 55", "remove o card 30"
- **Cadastrar cor/tamanho novos**: "cadastra a cor coral", "cria o tamanho único"

Setores, cores e tamanhos falados são normalizados por tolerância a sinônimos (ex.: "despacho"/"envio" → Expedição). O microfone funciona em modo contínuo: depois de cada comando, volta a escutar sozinho até você clicar para desativar.

## Estrutura do projeto

```
backend/src/
├── domain/          # entidades, casos de uso e contratos (ports) — não depende de nada externo
├── adapters/         # implementações concretas: controllers HTTP, repositórios SQLite, adapters de IA, Socket.io
└── config/            # injeção de dependência manual (container.ts) e variáveis de ambiente

frontend/src/
├── domain/          # entidades e contratos de caso de uso do cliente
├── data/             # casos de uso implementados sobre um HttpClient abstrato
├── infrastructure/    # Axios, Socket.io-client, Web Speech API — implementações concretas
└── presentation/       # componentes de UI e hooks (useKanban, useVoiceCommand, useTheme)
```

Detalhes de cada camada, e o porquê de cada escolha, estão em [DOCUMENTACAO_PROJETO.md](DOCUMENTACAO_PROJETO.md).

## Scripts disponíveis

**Backend** (`cd backend`)
- `npm run dev` — inicia com hot-reload (`tsx watch`)
- `npm run seed` — popula setores/cores/tamanhos padrão no banco
- `npm run build` — compila TypeScript para `dist/`
- `npm start` — roda a versão compilada

**Frontend** (`cd frontend`)
- `npm run dev` — inicia o servidor de desenvolvimento Vite
- `npm run build` — build de produção
- `npm run preview` — pré-visualiza o build de produção
- `npm run lint` — checagem de lint (oxlint)

## Limitações conhecidas

- O microfone só funciona em contexto seguro: `localhost` ou HTTPS. Acessando o app por IP na rede local (ex.: do celular), o quadro funciona normalmente mas o comando de voz é bloqueado pelo navegador.
- Reconhecimento de voz requer Chrome ou Edge (usa a Web Speech API, não implementada no Firefox/Safari).
- Provedores de IA gratuitos têm cotas limitadas (ex.: Gemini free tier permite ~20 requisições/dia no modelo usado); o sistema já lida com isso via fallback automático entre Groq → Gemini → Anthropic.
