import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { TimerComponent } from '../timer/timer.component';
import { GameService } from '../../services/game/game.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WordGuessPlaceholderComponent } from '../word-guess-placeholder/word-guess-placeholder.component';
import { GamePhase } from '../../types/message.types';

@Component({
  selector: 'app-game-info-panel',
  standalone: true,
  imports: [TimerComponent, WordGuessPlaceholderComponent],
  templateUrl: './game-info-panel.component.html',
  styleUrl: './game-info-panel.component.scss',
})
export class GameInfoPanelComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  phase: GamePhase = GamePhase.PREPARE;
  gamePhases = GamePhase;
  isGameActive: boolean = false;
  currentRound?: number | null;
  maxRounds?: number | null;

  constructor(private gameService: GameService) {}

  ngOnInit(): void {
    this.gameService.phase$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((phase) => {
        this.phase = phase;
        this.isGameActive =
          phase !== GamePhase.PREPARE && phase !== GamePhase.RESULT;
      });
    this.gameService.currentRound$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((currentRound) => {
        this.currentRound = currentRound;
      });
    this.gameService.maxRounds$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((maxRounds) => {
        this.maxRounds = maxRounds;
      });
  }
}
