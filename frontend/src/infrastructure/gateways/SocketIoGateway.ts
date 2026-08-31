import { io, Socket } from "socket.io-client";
import { SocketClient } from "../../data/protocols/SocketClient";

export class SocketIoGateway implements SocketClient {
  private readonly socket: Socket;

  constructor(url: string) {
    this.socket = io(url, { transports: ["websocket"] });
  }

  on<T>(evento: string, callback: (payload: T) => void): void {
    this.socket.on(evento, callback);
  }

  off(evento: string): void {
    this.socket.off(evento);
  }
}
