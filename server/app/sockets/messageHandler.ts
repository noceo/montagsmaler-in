import WebSocket from 'ws';
import { User } from '../../types/user.types';
import { RoomManager } from './roomManager';
import { WebSocketManager } from './webSocketManager';
import {
  ChatMessage,
  InitMessage,
  JoinRoomMessage,
  LoginMessage,
  Message,
} from '../../types/message.types';
import { nanoid } from 'nanoid';

export class MessageHandler {
  private roomManager: RoomManager;
  private webSocketManager: WebSocketManager;

  constructor(roomManager: RoomManager, webSocketManager: WebSocketManager) {
    this.roomManager = roomManager;
    this.webSocketManager = webSocketManager;
  }

  // Handle incoming messages
  handleMessage(ws: WebSocket, message: string): void {
    try {
      const msg: Message = JSON.parse(message);

      switch (msg.type) {
        case 'login':
          const loginMessage = msg as LoginMessage;
          this.handleLogin(
            ws,
            loginMessage.data.userName,
            loginMessage.data.roomCode
          );
          break;
        // case 'joinRoom':
        //     const joinRoomMessage = msg as JoinRoomMessage;
        //   this.handleJoinRoomMessage(joinRoomMessage.data.roomCode, joinRoomMessage.data.user);
        //   break;
        // case 'leaveRoom':
        //   this.handleLeaveRoom(userId, roomCode, ws);
        //   break;
        case 'chat':
          const chatMessage = msg as ChatMessage;
          console.log(chatMessage);
          this.handleChatMessage(ws, chatMessage);
          break;
        default:
          console.error(`Unknown action: ${msg.type}`);
      }
    } catch (error) {
      console.error('Error parsing or handling message:', error);
    }
  }

  // Handle user login
  private handleLogin(
    ws: WebSocket,
    userName: string,
    roomCode?: string
  ): void {
    if (!roomCode) {
      roomCode = 'testRoom'; // nanoid(10);
    }
    const room = this.roomManager.createRoom(roomCode);
    const userId = nanoid(5);
    const user: User = { id: userId, name: userName };

    this.roomManager.addUserToRoom(roomCode, user);
    this.webSocketManager.addClient(userId, ws, roomCode);

    // Notify the user of a successful login
    this.webSocketManager.sendMessageToUser(userId, {
      type: 'loginSuccess',
      data: { roomCode: roomCode, userName: user.name },
    } as LoginMessage);

    // Notify the room about the new user
    this.webSocketManager.broadcastToRoom(roomCode, {
      type: 'joinRoom',
      data: {
        roomCode: roomCode,
        user: user,
      },
    } as JoinRoomMessage);

    const currentUsers = this.roomManager.getUsersInRoom(roomCode);
    this.webSocketManager.sendMessageToUser(userId, {
      type: 'init',
      data: { users: currentUsers, gameStatus: {}, settings: {} },
    } as InitMessage);
  }

  // Handle user leaving a room
  handleCloseConnection(ws: WebSocket): void {
    const roomCode = this.webSocketManager.getRoomCode(ws);
    const userId = this.webSocketManager.getUserId(ws);

    if (!roomCode) return;

    const successfullyRemoved = this.webSocketManager.removeClient(ws);
    if (successfullyRemoved) {
      this.webSocketManager.broadcastToRoom(roomCode, {
        type: 'leaveRoom',
        data: {
          roomCode: roomCode,
          userId: userId,
        },
      });
    }

    this.webSocketManager.removeClient(ws);
  }

  private handleChatMessage(ws: WebSocket, message: ChatMessage) {
    const roomCode = this.webSocketManager.getRoomForSocket(ws);
    if (!roomCode) return;

    this.webSocketManager.broadcastToRoom(roomCode, {
      type: 'chat',
      userId: message.userId,
      data: message.data,
    } as ChatMessage);
  }
}
