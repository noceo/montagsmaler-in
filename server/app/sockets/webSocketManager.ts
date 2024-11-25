import { WebSocket } from 'ws';
import { RoomManager } from './roomManager';
import { Message } from '../../types/message.types';

export class WebSocketManager {
  private roomManager: RoomManager;
  private userSocketMap = new Map<string, WebSocket>(); // Maps user ID to WebSocket
  private socketUserMap = new Map<WebSocket, string>(); // Maps WebSocket to user ID
  private socketRoomMap = new Map<WebSocket, string>(); // Maps WebSocket to room code

  constructor(roomManager: RoomManager) {
    this.roomManager = roomManager;
  }

  addClient(userId: string, ws: WebSocket, roomCode: string): void {
    this.userSocketMap.set(userId, ws);
    this.socketUserMap.set(ws, userId);
    this.socketRoomMap.set(ws, roomCode);
  }

  removeClient(ws: WebSocket): boolean {
    const userId = this.socketUserMap.get(ws);
    const roomCode = this.socketRoomMap.get(ws);

    if (userId) this.userSocketMap.delete(userId);
    this.socketUserMap.delete(ws);
    this.socketRoomMap.delete(ws);

    if (userId && roomCode) {
      return this.roomManager.removeUserFromRoom(roomCode, userId);
    }

    return false;
  }

  getUserId(ws: WebSocket): string | undefined {
    return this.socketUserMap.get(ws);
  }

  getRoomCode(ws: WebSocket): string | undefined {
    return this.socketRoomMap.get(ws);
  }

  // Send a message to a specific user
  sendMessageToUser(userId: string, message: Message): void {
    const ws = this.userSocketMap.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Broadcast a message to all users in a room
  broadcastToRoom(roomCode: string, message: Message): void {
    const users = this.roomManager.getUsersInRoom(roomCode);
    users.forEach((user) => {
      const ws = this.getSocketForUser(user.id);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  getSocketForUser(userId: string): WebSocket | undefined {
    return this.userSocketMap.get(userId);
  }

  getRoomForSocket(ws: WebSocket): string | undefined {
    return this.socketRoomMap.get(ws);
  }
}
