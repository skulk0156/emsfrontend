import { io } from "socket.io-client";

export const socket = io("https://emsbackend-2w9c.onrender.com", {
  transports: ["websocket"],
});
