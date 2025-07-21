import { io } from "socket.io-client";

let socket: SocketIOClient.Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io("http://localhost:3000", {
      transports: ["websocket"],
    });
  }
  return socket;
};