import http from "http";
import WebSocket from "ws";
import { declareWSConnections } from "./websocket";

const server = http.createServer();
export const wsServer = new WebSocket.Server({ server });
const port = 8080;

server.listen(port, () => {
  declareWSConnections();
  console.log(`WebSocket server is running on port ${port}`);
});
