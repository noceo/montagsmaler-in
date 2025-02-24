import { WebSocketServer } from 'ws';
import { RoomController } from '../controllers/room.controller';
import { WebSocketController } from '../controllers/websocket.controller';
import { MessageController } from '../controllers/message.controller';

export const initSocket = () => {
  const wss = new WebSocketServer({ port: 3001, path: '/drawing' });
  const roomManager = new RoomController();
  const webSocketManager = new WebSocketController(roomManager);
  const messageHandler = new MessageController(roomManager, webSocketManager);

  wss.on('connection', (ws, connectionRequest) => {
    const [_path, params] = connectionRequest?.url?.split('?') || [];
    console.log('New client connected');
    ws.on('message', (message: string) => {
      messageHandler.handleMessage(ws, message);
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      messageHandler.handleCloseConnection(ws);
    });
  });

  wss.on('error', (err) => {
    console.error('WebSocket server error:', err);
  });
};
