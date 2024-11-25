import { Geometry, Path, Point } from './geometry.types';
import { User } from './user.types';

export enum MessageType {
  LOGIN,
  INIT,
  JOIN_ROOM,
  LEAVE_ROOM,
  CHAT,
  MOUSE_MOVE,
  DRAW_PATH,
  DRAW_SHAPE,
  CLEAR,
  HISTORY,
}

export type Message = {
  type: MessageType;
  userId?: string;
  data?: Record<string, any>;
};

export interface LoginMessage extends Message {
  data: { userName: string; roomCode?: string };
}

export interface InitMessage extends Message {
  data: {
    users: User[];
    settings: {
      userCount: number;
      language: string;
    };
    gameStatus: {
      phase: 'lobby' | 'chooseWord' | 'draw' | 'result';
    };
  };
}

export interface JoinRoomMessage extends Message {
  data: { roomCode: string; user: User };
}

export interface LeaveRoomMessage extends Message {
  data: { roomCode: string; userId: string };
}

export interface ChatMessage extends Message {
  userId: string;
  data: {
    text: string;
  };
}

export interface MouseMoveMessage extends Message {
  userId: string;
  data: { userId: string; position: Point };
}

export interface DrawPathMessage extends Message {
  userId: string;
  data: { userId: string; pathId: string; path: Path; isComplete: boolean };
}

export interface DrawShapeMessage extends Message {
  userId: string;
  data: { userId: string; shape: string; geometry: Geometry };
}

export interface HistoryMessage extends Message {
  data: {
    users: User[];
    drawHistory: { [userId: string]: { shape: string; geometry: Geometry }[] };
  };
}
