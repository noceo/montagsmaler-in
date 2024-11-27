import WebSocket from 'ws';
import { User } from '../../types/user.types';
import { RoomManager } from './roomManager';
import { WebSocketManager } from './webSocketManager';
import {
  ChatMessage,
  GamePhase,
  InitMessage,
  JoinRoomMessage,
  LoginMessage,
  Message,
  MessageType,
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
        case MessageType.LOGIN:
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
        case MessageType.CHAT:
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
    console.log('Logged in');
    const userId = nanoid(5);
    const user: User = { id: userId, name: userName };

    this.roomManager.createRoom(roomCode);
    this.roomManager.addUserToRoom(roomCode, user);
    this.webSocketManager.addClient(userId, ws, roomCode);

    // Notify the room about the new user
    this.webSocketManager.broadcastToRoom(roomCode, {
      type: MessageType.JOIN_ROOM,
      data: {
        roomCode: roomCode,
        user: user,
      },
    } as JoinRoomMessage);

    const currentUsers = this.roomManager.getUsersInRoom(roomCode);

    // send initial state of the game
    this.webSocketManager.sendMessageToUser(userId, {
      type: MessageType.INIT,
      data: {
        users: currentUsers,
        settings: {},
        gameStatus: { phase: GamePhase.PREPARE },
      },
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
        type: MessageType.LEAVE_ROOM,
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
      type: MessageType.CHAT,
      userId: message.userId,
      data: message.data,
    } as ChatMessage);
  }
}
