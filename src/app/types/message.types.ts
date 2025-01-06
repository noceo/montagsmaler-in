import { Geometry, Path, Point } from './geometry.types';
import { User } from './user.types';

export enum MessageType {
  LOGIN,
  INIT,
  JOIN_ROOM,
  LEAVE_ROOM,
  START_GAME,
  GAME_STATUS,
  CHOOSE_WORD,
  REVEAL_LETTER,
  CHAT,
  GUESS,
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
  data: {
    userId: string;
    timer: number;
    currentRound: number;
    choices: string[];
  };
}

export interface DrawStatus extends GameStatus {
  data: {
    userId: string;
    timer: number;
    currentRound: number;
    chosenWord: string;
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

export interface LoginMessage extends Message {
  data: { userName: string; roomCode?: string };
}

export interface InitMessage extends Message {
  data: {
    users: User[];
    settings: {
      maxRounds: number;
      userCount: number;
      language: string;
    };
    gameStatus: {
      phase: GamePhase;
    };
  };
}

export interface GameStatusMessage extends Message {
  data: {
    gameStatus: GameStatus;
  };
}

export interface JoinRoomMessage extends Message {
  data: { roomCode: string; user: User };
}

export interface LeaveRoomMessage extends Message {
  data: { roomCode: string; userId: string };
}

export interface ChooseWordMessage extends Message {
  data: {
    word: string;
  };
}

export interface RevealLetterMessage extends Message {
  data: {
    index: number;
    letter: string;
  };
}

export interface ChatMessage extends Message {
  userId: string;
  data: {
    text: string;
    isCorrect?: boolean;
    isPartlyCorrect?: boolean;
  };
}

export interface GuessMessage extends Message {
  userId: string;
  data: {
    isCorrect: boolean;
    isPartiallyCorrect: boolean;
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
