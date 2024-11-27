import { Component, OnInit } from '@angular/core';
import { GamePhase } from '../../types/message.types';
import { GameService } from '../../services/gameStatus/game.service';

@Component({
  selector: 'app-whiteboard-overlay',
  standalone: true,
  imports: [],
  templateUrl: './whiteboard-overlay.component.html',
  styleUrl: './whiteboard-overlay.component.scss',
})
export class WhiteboardOverlayComponent implements OnInit {
  readonly GamePhase = GamePhase;
  phase?: GamePhase;

  constructor(private gameService: GameService) {}

  ngOnInit(): void {
    this.gameService.phase$.subscribe((phase) => {
      this.phase = phase;
    });
  }
}
