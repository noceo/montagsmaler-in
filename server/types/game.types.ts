import { WebSocketManager } from '../app/sockets/webSocketManager';
import {
  DrawStatus,
  GamePhase,
  GameStatusMessage,
  MessageType,
  WordPickStatus,
} from './message.types';
import { User } from './user.types';

const PHASE_DURATIONS: Record<GamePhase, number> = {
  [GamePhase.PREPARE]: 0,
  [GamePhase.WORD_PICK]: 3,
  [GamePhase.DRAW]: 3,
  [GamePhase.RESULT]: 0,
};

export class Game {
  private phase: GamePhase;
  private activeUser?: User;
  private users: User[];
  private currentRound: number;
  private maxRounds: number;
  private activeWord: string;
  private wordChoices: string[];
  private webSocketManager: WebSocketManager;
  private roomCode: string;
  private timer: number;
  private currentTimeout: NodeJS.Timeout | null;
  cancelWordPickPhase?: () => void;

  constructor(
    webSocketManager: WebSocketManager,
    roomCode: string,
    users: User[],
    maxRounds: number
  ) {
    this.phase = GamePhase.PREPARE;
    this.activeWord = '';
    this.wordChoices = [];
    this.webSocketManager = webSocketManager;
    this.roomCode = roomCode;
    this.users = users;
    this.timer = 0;
    this.currentRound = 1;
    this.maxRounds = maxRounds;
    this.currentTimeout = null;
  }

  getPhase(): GamePhase {
    return this.phase;
  }

  getActiveUser(): User | undefined {
    return this.activeUser;
  }

  getWordChoices(): string[] {
    return this.wordChoices;
  }

  setActiveWord(activeWord: string): void {
    this.activeWord = activeWord;
  }

  async start() {
    for (let i = 0; i < this.maxRounds; i++) {
      this.currentRound = i + 1;
      console.log(`Round: ${this.currentRound}`);
      for (const user of this.users) {
        this.activeUser = user;
        console.log(`Active User: ${this.activeUser.name}`);
        await this.wordPickPhase(this.activeUser);
        await this.drawPhase(this.activeUser);
      }
    }
    this.resultPhase();
  }

  private wordPickPhase(activeUser: User): Promise<void> {
    this.phase = GamePhase.WORD_PICK;
    const duration = PHASE_DURATIONS[GamePhase.WORD_PICK];
    this.webSocketManager.broadcastToRoom(this.roomCode, {
      type: MessageType.GAME_STATUS,
      data: {
        gameStatus: {
          phase: GamePhase.WORD_PICK,
          data: {
            userId: activeUser.id,
            choices: ['test1', 'test2', 'test3'],
            timer: duration,
            currentRound: this.currentRound,
          },
        } as WordPickStatus,
      },
    } as GameStatusMessage);
    console.log(`Phase: ${this.phase}`);
    console.log(duration);
    return new Promise((resolve, _reject) => {
      this.currentTimeout = setTimeout(resolve, duration * 1000);

      this.cancelWordPickPhase = () => {
        clearTimeout(this.currentTimeout!);
        resolve();
        console.log('Word Pick Timeout cancelled.');
      };
    });
  }

  private drawPhase(activeUser: User): Promise<void> {
    this.phase = GamePhase.DRAW;
    const duration = PHASE_DURATIONS[GamePhase.DRAW];
    this.webSocketManager.broadcastToRoom(this.roomCode, {
      type: MessageType.GAME_STATUS,
      data: {
        gameStatus: {
          phase: GamePhase.DRAW,
          data: {
            userId: activeUser.id,
            drawHistory: {},
            timer: duration,
            currentRound: this.currentRound,
          },
        } as DrawStatus,
      },
    } as GameStatusMessage);
    console.log(`Phase: ${this.phase}`);
    console.log(duration);
    return new Promise((resolve, _reject) => {
      setTimeout(resolve, duration * 1000);
    });
  }

  private resultPhase() {
    console.log('Showing results...');
  }

  private setTimer(callback: () => void, seconds: number): NodeJS.Timeout {
    this.timer = seconds;
    return setTimeout(callback, seconds * 1000);
  }
}
