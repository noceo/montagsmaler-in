import { Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import {
  ChooseWordMessage,
  GamePhase,
  MessageType,
} from '../../types/message.types';
import { GameService } from '../../services/game/game.service';
import { ButtonComponent } from '../button/button.component';
import { MessagingService } from '../../services/messaging/messaging.service';
import { User } from '../../types/user.types';
import { combineLatest, map, Observable } from 'rxjs';
import { UserService } from '../../services/user/user.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-whiteboard-overlay',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './whiteboard-overlay.component.html',
  styleUrl: './whiteboard-overlay.component.scss',
})
export class WhiteboardOverlayComponent implements OnInit {
  readonly GamePhase = GamePhase;
  phase?: GamePhase;
  choices?: string[];
  activeUser?: User | null;
  isMyTurn$?: Observable<boolean>;
  private destroyRef = inject(DestroyRef);

  constructor(
    private gameService: GameService,
    private messagingService: MessagingService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.gameService.phase$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((phase) => {
        this.phase = phase;
      });

    this.gameService.wordChoices$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((choices) => {
        this.choices = choices;
      });

    this.gameService.activeUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((activeUser) => {
        this.activeUser = activeUser;
      });

    this.isMyTurn$ = combineLatest([
      this.gameService.activeUser$,
      this.userService.currentUser$,
    ]).pipe(
      map(([activeUser, currentUser]) => activeUser?.id === currentUser?.id),
      takeUntilDestroyed(this.destroyRef)
    );

    this.messagingService.messageBus$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((message) => {
        if (message.type === MessageType.START_GAME) {
          this.gameService.setPhase(GamePhase.WORD_PICK);
        }
      });
  }

  onStartGame() {
    this.messagingService.send({ type: MessageType.START_GAME });
  }

  onWordPick(event: Event) {
    console.log('WORD PICK', event.target);
    const word = (event.target as HTMLButtonElement).innerText;
    console.log('Picked: ', word);
    this.messagingService.send({
      type: MessageType.CHOOSE_WORD,
      data: { word: word },
    } as ChooseWordMessage);
  }
}
