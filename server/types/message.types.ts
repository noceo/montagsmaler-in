import { Geometry, Path } from './geometry.types';
import { User } from './user.types';

export enum MessageType {
  LOGIN,
  INIT,
  JOIN_ROOM,
  LEAVE_ROOM,
  START_GAME,
  GAME_STATUS,
  CHAT,
  MOUSE_MOVE,
  DRAW_PATH,
  DRAW_SHAPE,
  CLEAR,
  HISTORY,
}

export enum GamePhase {
  PREPARE,
  WORD_PICK,
  DRAW,
  RESULT,
}

export interface Result {
  userId: string;
  points: number;
}

export interface GameStatus {
  phase: GamePhase;
  data?: Record<string, any>;
}

export interface PreparePhaseStatus extends GameStatus {}

export interface WordPickStatus extends GameStatus {
  data: { userId: string; choices: string[]; timer: number };
}
export interface DrawStatus extends GameStatus {
  data: {
    userId?: number;
    timer?: number;
    drawHistory: { [userId: string]: { shape: string; geometry: Geometry }[] };
  };
}
export interface ResultStatus extends GameStatus {
  data: { results?: Result[] };
}

export type Message = {
  type: MessageType;
  userId?: string;
  data?: Record<string, any>;
};

export interface JoinRoomMessage extends Message {
  data: { roomCode: string; user: User };
}

export interface LeaveRoomMessage extends Message {
  data: { roomCode: string; userId: string };
}

export interface InitMessage extends Message {
  data: {
    users: User[];
    settings: {};
    gameStatus: GameStatus;
  };
}

export interface LoginMessage extends Message {
  data: { userName: string; roomCode?: string };
}

export interface GameStatusMessage extends Message {
  data: {
    gameStatus: GameStatus;
  };
}

export interface ChatMessage extends Message {
  userId: string;
  data: {
    text: string;
  };
}

export interface DrawPathMessage extends Message {
  userId: string;
  data: { userId: string; pathId: string; path: Path; isComplete: boolean };
}

export interface DrawShapeMessage extends Message {
  userId: string;
  data: { userId: string; shape: string; geometry: Geometry };
}

export interface ShapeData {
  userId: string;
  shape: string;
  geometry: Geometry;
}
