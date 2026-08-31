export interface SocketClient {
  on<T>(evento: string, callback: (payload: T) => void): void;
  off(evento: string): void;
}
