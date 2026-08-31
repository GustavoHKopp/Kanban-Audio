import { CriarCorUseCase } from "../ports/in/CriarCorUseCase";
import { CorRepository } from "../ports/out/CorRepository";
import { RealtimeNotifier } from "../ports/out/RealtimeNotifier";
import { Cor } from "../../domain/entities/Cor";

const HEX_POR_NOME: Record<string, string> = {
  branco: "#FFFFFF",
  preto: "#0B0B0C",
  azul: "#2563EB",
  vermelho: "#DC2626",
  verde: "#16A34A",
  amarelo: "#EAB308",
  cinza: "#6B7280",
  rosa: "#EC4899",
  roxo: "#7C3AED",
  laranja: "#F97316",
  marrom: "#78350F",
  bege: "#D9C7A3",
  turquesa: "#14B8A6",
  dourado: "#CA9A2C",
  prateado: "#A3A9B0",
  vinho: "#7F1D2E",
  lilas: "#C4B5FD",
  "azul marinho": "#1E3A8A",
  "verde agua": "#2DD4BF",
  salmao: "#FB7185",
  coral: "#FF7F50",
  ciano: "#06B6D4",
  magenta: "#D946EF",
  indigo: "#4F46E5",
  oliva: "#808000",
  creme: "#FFF5DE",
  ocre: "#CC7722",
  ambar: "#F59E0B",
  cobre: "#B87333",
  bronze: "#8C6A3F",
  grafite: "#374151",
  petroleo: "#0F4C5C",
  mostarda: "#D4AC0D",
};

function normalizar(nome: string): string {
  return nome
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function gerarHexDeterministico(nome: string): string {
  let hash = 0;
  for (let i = 0; i < nome.length; i++) {
    hash = (hash * 31 + nome.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  return hslParaHex(hue, 55, 55);
}

function hslParaHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const paraHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${paraHex(r)}${paraHex(g)}${paraHex(b)}`.toUpperCase();
}

export function resolverHexParaCor(nomeCor: string): string {
  const chave = normalizar(nomeCor);
  return HEX_POR_NOME[chave] ?? gerarHexDeterministico(chave);
}

export class CriarCor implements CriarCorUseCase {
  constructor(
    private readonly corRepository: CorRepository,
    private readonly notifier: RealtimeNotifier
  ) {}

  async executar(nomeCor: string): Promise<Cor> {
    const nome = nomeCor.trim();
    if (!nome) {
      throw new Error("Nome da cor e obrigatorio.");
    }

    const existente = await this.corRepository.buscarPorNome(nome);
    if (existente) {
      return existente;
    }

    const hexCode = resolverHexParaCor(nome);
    const cor = await this.corRepository.criar(nome, hexCode);
    this.notifier.notificarCorCriada(cor);
    return cor;
  }
}
