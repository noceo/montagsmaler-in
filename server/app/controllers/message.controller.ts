import WebSocket from 'ws';
import { User } from '../model/user.model';
import { RoomController } from './room.controller';
import { WebSocketController } from './websocket.controller';
import {
  ChatMessage,
  ChooseWordMessage,
  DrawPathMessage,
  DrawShapeMessage,
  GamePhase,
  GuessMessage,
  InitMessage,
  JoinRoomMessage,
  LoginMessage,
  Message,
  MessageType,
} from '../types/message.types';
import { nanoid } from 'nanoid';

export class MessageController {
  private roomManager: RoomController;
  private webSocketManager: WebSocketController;

  constructor(
    roomManager: RoomController,
    webSocketManager: WebSocketController
  ) {
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
        case MessageType.START_GAME:
          this.handleStartGame(ws);
          break;
        case MessageType.CHOOSE_WORD:
          const chooseWordMessage = msg as ChooseWordMessage;
          this.handleChooseWord(ws, chooseWordMessage);
          break;
        case MessageType.CHAT:
          const chatMessage = msg as ChatMessage;
          console.log(chatMessage);
          this.handleChatMessage(ws, chatMessage);
          break;
        // case MessageType.DRAW_PATH:
        //   const drawPathMessage = msg as DrawPathMessage;
        //   this.handleDrawPathMessage(ws, drawPathMessage);
        //   break;
        case MessageType.DRAW_SHAPE:
          const drawShapeMessage = msg as DrawShapeMessage;
          this.handleDrawShapeMessage(ws, drawShapeMessage);
          break;
        case MessageType.MOUSE_MOVE:
        case MessageType.CLEAR:
          this.forwardMessage(ws, msg);
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
        settings: {
          maxRounds: 3,
        },
        gameStatus: { phase: GamePhase.PREPARE },
      },
    } as InitMessage);

    // setTimeout(() => {
    //   this.webSocketManager.broadcastToRoom(roomCode, {
    //     type: MessageType.GAME_STATUS,
    //     data: {
    //       gameStatus: { phase: GamePhase.DRAW },
    //     },
    //   } as GameStatusMessage);
    // }, 2000);
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

  private handleStartGame(ws: WebSocket) {
    const roomCode = this.webSocketManager.getRoomCode(ws);
    if (!roomCode) return;

    this.roomManager.getRoom(roomCode)?.getGame(this.webSocketManager).start();
  }

  private handleChooseWord(ws: WebSocket, message: ChooseWordMessage) {
    const roomCode = this.webSocketManager.getRoomForSocket(ws);
    if (!roomCode) return;

    const room = this.roomManager.getRoom(roomCode);
    if (!room) return;

    const game = room.getGame(this.webSocketManager);
    game.setChosenWord(message.data.word);
    game.cancelWordPickPhase!();

    this.webSocketManager.broadcastToRoom(roomCode, {
      type: MessageType.CHOOSE_WORD,
      data: message.data,
    } as ChooseWordMessage);
  }

  private handleChatMessage(ws: WebSocket, message: ChatMessage) {
    const roomCode = this.webSocketManager.getRoomForSocket(ws);
    if (!roomCode) return;

    const room = this.roomManager.getRoom(roomCode);
    if (!room) return;

    const game = room.getGame(this.webSocketManager);
    const gamePhase = game.getPhase();

    // only check for correctness if draw phase is active
    if (gamePhase === GamePhase.DRAW) {
      if (game.isGuessCorrect(message.data.text)) {
        if (game.isFirstCorrectGuess(message.userId)) {
          game.registerCorrectGuess(message.userId);
          this.webSocketManager.broadcastToRoom(roomCode, {
            type: MessageType.GUESS,
            userId: message.userId,
            data: {
              isCorrect: true,
            },
          } as GuessMessage);
        }
        return;
      } else if (game.isGuessPartiallyCorrect(message.data.text)) {
        this.webSocketManager.sendMessageToUser(message.userId, {
          type: MessageType.GUESS,
          userId: message.userId,
          data: {
            isPartiallyCorrect: true,
          },
        } as GuessMessage);
      }
    }

    this.webSocketManager.broadcastToRoom(roomCode, {
      type: MessageType.CHAT,
      userId: message.userId,
      data: message.data,
    } as ChatMessage);
  }

  // private handleDrawPathMessage(ws: WebSocket, message: DrawPathMessage) {
  //   console.log(message.data.path);
  //   const path = message.data.path;
  //   const points = path.points;
  //   for (let i = 0; i < points.length; i++) {
  //     const line: Geometry = {
  //       type: 'line',
  //       stroke
  //     }
  //   }
  // }

  private handleDrawShapeMessage(ws: WebSocket, message: DrawShapeMessage) {
    const roomCode = this.webSocketManager.getRoomForSocket(ws);
    if (!roomCode) return;

    const room = this.roomManager.getRoom(roomCode);
    if (!room) return;

    const game = room.getGame(this.webSocketManager);
    const gamePhase = game.getPhase();
    game.getCanvas().addShape(message.userId, message.data.geometry);
    this.forwardMessage(ws, message);
  }

  private forwardMessage(ws: WebSocket, message: Message) {
    const roomCode = this.webSocketManager.getRoomForSocket(ws);
    if (!roomCode) return;

    this.webSocketManager.broadcastToRoom(roomCode, message);
  }
}
