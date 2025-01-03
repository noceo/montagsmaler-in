import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { GameService } from '../../services/game/game.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-word-guess-placeholder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './word-guess-placeholder.component.html',
  styleUrl: './word-guess-placeholder.component.scss',
})
export class WordGuessPlaceholderComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  revealedLetters?: string;
  chosenWord?: string;

  constructor(private gameService: GameService) {}

  ngOnInit(): void {
    this.gameService.revealedLetters$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((revealedLetters) => {
        this.revealedLetters = revealedLetters.join('');
        // console.log(revealedLetters);
      });
  }
}
