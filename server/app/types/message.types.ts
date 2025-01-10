import { Geometry, Path } from './geometry.types';
import { User } from '../model/user.model';

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

export interface JoinRoomMessage extends Message {
  data: { roomCode: string; user: User };
}

export interface LeaveRoomMessage extends Message {
  data: { roomCode: string; userId: string };
}

export interface InitMessage extends Message {
  data: {
    users: User[];
    settings: {
      maxRounds: number;
    };
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
  };
}

export interface GuessMessage extends Message {
  userId: string;
  data: {
    isCorrect: boolean;
    isPartiallyCorrect: boolean;
  };
}

export interface DrawPathMessage extends Message {
  userId: string;
  data: { userId: string; pathId: string; path: Path; isComplete: boolean };
}

export interface DrawShapeMessage extends Message {
  userId: string;
  data: { geometry: Geometry };
}
