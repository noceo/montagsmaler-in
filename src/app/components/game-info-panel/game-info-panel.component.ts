import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { TimerComponent } from '../timer/timer.component';
import { GameService } from '../../services/game/game.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-game-info-panel',
  standalone: true,
  imports: [TimerComponent],
  templateUrl: './game-info-panel.component.html',
  styleUrl: './game-info-panel.component.scss',
})
export class GameInfoPanelComponent implements OnInit {
  currentRound?: number | null;
  maxRounds?: number | null;
  private destroyRef = inject(DestroyRef);

  constructor(private gameService: GameService) {}

  ngOnInit(): void {
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
