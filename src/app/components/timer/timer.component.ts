import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { GameService } from '../../services/game/game.service';
import { combineLatest } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [],
  templateUrl: './timer.component.html',
  styleUrl: './timer.component.scss',
})
export class TimerComponent implements OnInit {
  CIRCUMFERENCE = 565.48;
  timer: number = 0;
  progress: number = 0;
  private destroyRef = inject(DestroyRef);

  constructor(private gameService: GameService) {}

  ngOnInit(): void {
    combineLatest([
      this.gameService.totalTime$,
      this.gameService.remainingTime$,
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([totalTime, remainingTime]) => {
        this.timer = remainingTime;
        this.progress =
          this.CIRCUMFERENCE - (remainingTime / totalTime) * this.CIRCUMFERENCE;
      });
  }
}
