import { env } from "./env";
import { AxiosHttpClient } from "../gateways/AxiosHttpClient";
import { SocketIoGateway } from "../gateways/SocketIoGateway";
import { CarregarQuadroViaApi } from "../../data/usecases/CarregarQuadroViaApi";
import { MoverCardViaApi } from "../../data/usecases/MoverCardViaApi";
import { CriarProdutoViaApi } from "../../data/usecases/CriarProdutoViaApi";
import { ExcluirProdutoViaApi } from "../../data/usecases/ExcluirProdutoViaApi";
import { ProcessarComandoVozViaApi } from "../../data/usecases/ProcessarComandoVozViaApi";

const httpClient = new AxiosHttpClient(env.apiBaseUrl);

export const socketGateway = new SocketIoGateway(env.socketUrl);

export const carregarQuadro = new CarregarQuadroViaApi(httpClient);
export const moverCard = new MoverCardViaApi(httpClient);
export const criarProduto = new CriarProdutoViaApi(httpClient);
export const excluirProduto = new ExcluirProdutoViaApi(httpClient);
export const processarComandoVoz = new ProcessarComandoVozViaApi(httpClient);
