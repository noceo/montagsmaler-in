import { WebSocketManager } from '../app/sockets/webSocketManager';
import {
  GamePhase,
  GameStatusMessage,
  MessageType,
  WordPickStatus,
} from './message.types';
import { User } from './user.types';

const PHASE_DURATIONS: Record<GamePhase, number> = {
  [GamePhase.PREPARE]: 0,
  [GamePhase.WORD_PICK]: 2,
  [GamePhase.DRAW]: 8,
  [GamePhase.RESULT]: 0,
};

export class Game {
  private phase: GamePhase;
  private activeUser?: User;
  private users: User[];
  private currentRound = 1;
  private rounds;
  private wordChoices: string[];
  private webSocketManager?: WebSocketManager;
  private roomCode: string;
  private timer: number;
  private currentTimeout?: NodeJS.Timeout;

  constructor(
    webSocketManager: WebSocketManager,
    roomCode: string,
    users: User[],
    rounds: number
  ) {
    this.phase = GamePhase.PREPARE;
    this.wordChoices = [];
    this.webSocketManager = webSocketManager;
    this.roomCode = roomCode;
    this.users = users;
    this.timer = 0;
    this.rounds = rounds;
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

  async start() {
    for (let i = 0; i < this.rounds; i++) {
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

  //   private transitonToNextPhase() {
  //     switch (this.phase) {
  //       case GamePhase.PREPARE:
  //         this.wordPickPhase();
  //         break;
  //       case GamePhase.WORD_PICK:
  //         this.drawPhase();
  //         break;
  //       case GamePhase.DRAW:
  //         this.wordPickPhase();
  //         break;
  //       default:
  //         return;
  //     }

  //     const duration = PHASE_DURATIONS[this.phase];
  //     console.log(
  //       `Current Round: ${this.currentRound}\nCurrent phase: ${this.phase}. Moving to next phase in ${duration}s.`
  //     );
  //     if (duration) {
  //       this.currentTimeout = setTimeout(
  //         () => this.transitonToNextPhase(),
  //         duration * 1000
  //       );
  //     }
  //   }

  private wordPickPhase(activeUser: User): Promise<void> {
    this.phase = GamePhase.WORD_PICK;
    this.webSocketManager?.broadcastToRoom(this.roomCode, {
      type: MessageType.GAME_STATUS,
      data: {
        gameStatus: {
          phase: GamePhase.WORD_PICK,
          data: {
            userId: activeUser.id,
            choices: ['test1', 'test2', 'test3'],
            timer: 80,
          },
        } as WordPickStatus,
      },
    } as GameStatusMessage);
    const duration = PHASE_DURATIONS[GamePhase.WORD_PICK];
    console.log(`Phase: ${this.phase}`);
    console.log(duration);
    return new Promise((resolve, _reject) => {
      setTimeout(resolve, duration * 1000);
    });
  }

  private drawPhase(activeUser: User): Promise<void> {
    this.phase = GamePhase.DRAW;
    const duration = PHASE_DURATIONS[GamePhase.DRAW];
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
