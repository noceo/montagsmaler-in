import { WebSocket, WebSocketServer } from 'ws';
import {
  DrawPathMessage,
  DrawShapeMessage,
  InitMessage,
  JoinRoomMessage,
  LeaveRoomMessage,
  LoginMessage,
  Message,
  ShapeData,
} from '../../types/message.types';
import { Point } from '../../types/geometry.types';
import { nanoid } from 'nanoid';
import { User } from '../../types/user.types';
import { Room } from '../../types/room.types';
import { RoomManager } from './roomManager';
import { WebSocketManager } from './webSocketManager';
import { MessageHandler } from './messageHandler';

export const initSocket = () => {
  // set up web socket
  const wss = new WebSocketServer({ port: 3001, path: '/drawing' });
  let drawingHistory: { [userId: string]: ShapeData[] } = {};
  let currentPaths: { [userId: string]: Point[] } = {};
  const userClientMap: { [userId: string]: WebSocket } = {};
  const rooms: { [roomCode: string]: Room } = {};
  let clientRoomMap = new Map<WebSocket, string>();
  let clientUserMap = new Map<WebSocket, string>();

  const roomManager = new RoomManager();
  const webSocketManager = new WebSocketManager(roomManager);
  const messageHandler = new MessageHandler(roomManager, webSocketManager);

  wss.on('connection', (ws, connectionRequest) => {
    const [_path, params] = connectionRequest?.url?.split('?') || [];
    // console.log(params);
    console.log('New client connected');

    ws.on('message', (message: string) => {
      messageHandler.handleMessage(ws, message);

      //   if (message.type === 'login') {
      //     const loginMessage = message as LoginMessage;
      //     const roomCode = loginMessage.data.roomCode || 'TestRoom' || nanoid(10);
      //     const userId = nanoid(10);
      //     const user: User = {
      //       id: userId,
      //       name: loginMessage.data.userName,
      //     };
      //     handleLogin(roomCode, user);
      //     return;
      //   } else if (message.type === 'drawPath') {
      //     const drawPathMessage = message as DrawPathMessage;
      //     if (drawPathMessage.data.pathId in currentPaths) {
      //       currentPaths[drawPathMessage.data.pathId].push(
      //         ...drawPathMessage.data.path.points
      //       );
      //     } else {
      //       currentPaths[drawPathMessage.data.pathId] =
      //         drawPathMessage.data.path.points;
      //     }

      //     const points = currentPaths[drawPathMessage.data.pathId];
      //     console.log(points);
      //     const lastRecordedPoint =
      //       points[points.length - drawPathMessage.data.path.points.length - 1];
      //     const data = structuredClone(drawPathMessage.data);
      //     if (lastRecordedPoint)
      //       data.path.points = [lastRecordedPoint, ...data.path.points];
      //     console.log(data.path.points);

      //     if (drawPathMessage.data.isComplete) {
      //       const fullPath = structuredClone(drawPathMessage.data.path);
      //       fullPath.points = currentPaths[drawPathMessage.data.pathId];
      //       pushToDrawHistoryForUser(drawPathMessage.userId, {
      //         userId: drawPathMessage.userId,
      //         shape: 'path',
      //         geometry: fullPath,
      //       });
      //       delete currentPaths[drawPathMessage.data.pathId];
      //     }

      //     broadcastToRoom({ ...drawPathMessage, data: data });
      //     return;
      //   } else if (message.type === 'drawShape') {
      //     const drawShapeMessage = message as DrawShapeMessage;
      //     pushToDrawHistoryForUser(
      //       drawShapeMessage.userId,
      //       drawShapeMessage.data
      //     );
      //   } else if (message.type === 'mouseMove') {
      //     // mousemove todo
      //   } else if (message.type === 'clear') {
      //     drawingHistory[message.userId!] = [];
      //   }

      //   broadcastToRoom(message);
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      //   webSocketManager.removeClient(ws);
      // TODO: Decouple roomManager from webSocketManager and call both remove methods
      //   roomManager.removeUserFromRoom();
      //   handleLeaveRoom();
      messageHandler.handleCloseConnection(ws);
    });

    function send(client: WebSocket, message: Message) {
      if (client.readyState === WebSocket.OPEN) {
        setTimeout(() => client.send(JSON.stringify(message)), 1000);
      }
    }

    function broadcastToRoom(message: Message) {
      console.log('Broadcasting: ', message);
      const roomCode = clientRoomMap.get(ws);
      if (!roomCode) return;
      Object.values(rooms[roomCode].users).forEach((user) => {
        console.log(user);
        const client = userClientMap[user.id];
        if (client !== ws) send(client, message);
      });
    }

    function handleLogin(roomCode: string, user: User) {
      let createdRoom = false;
      if (!rooms[roomCode]) {
        rooms[roomCode] = { code: roomCode, users: { [user.id]: user } };
        console.log(`User ${user.name} created room: ${roomCode}`);
        createdRoom = true;
      }
      userClientMap[user.id] = ws;
      clientRoomMap.set(ws, roomCode);
      clientUserMap.set(ws, user.id);

      const connectedUsers = Object.values(rooms[roomCode].users);

      // confirm successful join
      send(ws, {
        type: 'joinRoom',
        data: { roomCode: roomCode, user: user },
      } as JoinRoomMessage);
      // send history of room
      //   send(ws, {
      //     type: 'init',
      //     data: { users: currentUsers, drawHistory: drawingHistory },
      //   });
      // confirm successful join
      send(ws, {
        type: 'init',
        data: { users: connectedUsers, settings: {}, gameStatus: {} },
      } as InitMessage);

      if (!createdRoom) {
        broadcastToRoom({
          type: 'joinRoom',
          data: { roomCode: roomCode, user: user },
        } as JoinRoomMessage);
        console.log(
          `$User ${user.name} with ID ${user.id} joined room: ${roomCode}`
        );
        console.log(
          `${
            Object.keys(rooms[roomCode].users).length
          } clients connected to room: ${roomCode}`
        );
      }
      console.log();
    }

    function handleLeaveRoom() {
      const roomCode = clientRoomMap.get(ws);
      const userId = clientUserMap.get(ws);

      broadcastToRoom({
        type: 'leaveRoom',
        data: { roomCode: roomCode, userId: userId },
      } as LeaveRoomMessage);

      if (!roomCode || !userId) return;
      if (rooms[roomCode]) delete rooms[roomCode].users[userId];
      if (Object.keys(rooms[roomCode].users).length === 0)
        delete rooms[roomCode];
      delete userClientMap[userId];
      clientRoomMap.delete(ws);
      clientUserMap.delete(ws);
    }
  });

  function pushToDrawHistoryForUser(id: string, data: ShapeData) {
    if (id in drawingHistory) drawingHistory[id].push(data);
    else drawingHistory[id] = [data];
  }

  wss.on('error', (err) => {
    console.error('WebSocket server error:', err);
  });
};