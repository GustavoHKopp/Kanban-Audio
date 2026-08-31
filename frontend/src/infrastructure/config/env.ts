const hostAtual = typeof window !== "undefined" ? window.location.hostname : "localhost";
const origemBackendPadrao = `http://${hostAtual}:3333`;

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_URL || `${origemBackendPadrao}/api`,
  socketUrl: import.meta.env.VITE_SOCKET_URL || origemBackendPadrao,
};
