// whiteboard.component.ts
import {
  Component,
  ViewChild,
  ElementRef,
  OnDestroy,
  ViewEncapsulation,
  DestroyRef,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RadioGroupComponent } from '../radio-group/radio-group.component';
import { ButtonComponent } from '../button/button.component';
import { MessagingService } from '../../services/messaging/messaging.service';
import {
  DrawPathMessage,
  DrawShapeMessage,
  GamePhase,
  HistoryMessage,
  JoinRoomMessage,
  MessageType,
  MouseMoveMessage,
} from '../../types/message.types';
import { v4 as uuidv4 } from 'uuid';
import { CanvasService } from '../../services/canvas/canvas.service';
import { UserService } from '../../services/user/user.service';
import { filter, Subscription } from 'rxjs';
import { faker } from '@faker-js/faker';
import { Point } from '../../types/geometry.types';
import {
  DrawMode,
  StrokeWidth,
  ToolbarService,
} from '../../services/toolbar/toolbar.service';
import { WhiteboardOverlayComponent } from '../whiteboard-overlay/whiteboard-overlay.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game/game.service';
import { User } from '../../types/user.types';

@Component({
  selector: 'app-whiteboard',
  templateUrl: './whiteboard.component.html',
  styleUrl: './whiteboard.component.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, FormsModule, WhiteboardOverlayComponent],
  standalone: true,
})
export class WhiteboardComponent {
  @ViewChild('canvasContainer') canvasContainerRef!: ElementRef<HTMLElement>;
  @ViewChild('canvasPreviewContainer')
  canvasPreviewContainerRef!: ElementRef<HTMLElement>;
  @ViewChild('canvasBase') canvasBaseRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasPreview') canvasPreviewRef!: ElementRef<HTMLCanvasElement>;
  private destroyRef = inject(DestroyRef);
  private currentUser!: User;
  isMyTurn?: boolean;
  private contextBase!: CanvasRenderingContext2D;
  private contextPreview!: CanvasRenderingContext2D;
  private isDrawing = false;
  private mouseOutOfBounds = false;
  private lastPoint: Point = { x: 0, y: 0 };
  private drawStart: Point = { x: 0, y: 0 };
  private strokeWidths: Record<StrokeWidth, number> = {
    tiny: 5,
    small: 15,
    medium: 25,
    big: 35,
  };
  private cursorImages: Record<DrawMode, string> = {
    path: '/assets/icons/pen.svg',
    line: '/assets/icons/line.svg',
    rect: '/assets/icons/rect.svg',
    triangle: '/assets/icons/triangle.svg',
    ellipse: '/assets/icons/ellipse.svg',
  };

  strokeWidthName: StrokeWidth = 'small';
  strokeWidth = 15;
  contextBaseColor = '#000000';
  contextPreviewColor = this.getPreviewColor(this.contextBaseColor);
  mode: DrawMode = 'path';
  baseWidth = 2000;
  heightScale = 0.7;
  currentPath: Point[] = [];

  currentPathId = '';
  lastSentIndex = 0;

  userId = '';
  userName = faker.internet.username();

  constructor(
    private userService: UserService,
    private canvasService: CanvasService,
    private messagingService: MessagingService,
    private gameService: GameService,
    private toolbarService: ToolbarService
  ) {}

  ngAfterViewInit() {
    this.gameService.isMyTurn$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isMyTurn) => (this.isMyTurn = isMyTurn));

    this.gameService.phase$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((phase) => {
        if (phase === GamePhase.DRAW) this.canvasService.clearAllCanvasLayers();
      });

    this.gameService.activeUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((activeUser) => {
        if (!activeUser) return;
        if (activeUser.id !== this.currentUser.id) {
          this.canvasService.addCanvasLayer(
            activeUser.id,
            this.canvasPreviewContainerRef.nativeElement,
            true
          );
        }
      });

    this.userService.currentUser$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((user): user is User => user !== null)
      )
      .subscribe((currentUser) => (this.currentUser = currentUser));

    // set up message handlers
    this.messagingService.messageBus$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((message) => {
        if (message.type === MessageType.MOUSE_MOVE) {
          const mouseMoveMessage = message as MouseMoveMessage;
          if (mouseMoveMessage.userId === this.currentUser?.id) return;

          const user = this.userService.getUserById(mouseMoveMessage.userId);
          if (!user) return;
          this.canvasService.drawCursor(
            user.id,
            user.name,
            mouseMoveMessage.data.position
          );
        } else if (message.type === MessageType.DRAW_PATH) {
          this.canvasService.drawShape(
            this.currentUser.id,
            (message as DrawPathMessage).data.path,
            false
          );
        } else if (message.type === MessageType.DRAW_SHAPE) {
          this.canvasService.drawShape(
            this.currentUser.id,
            (message as DrawShapeMessage).data.geometry,
            false
          );
        } else if (message.type === MessageType.CLEAR) {
          this.canvasService.clearCanvas(this.currentUser.id);
        } else if (message.type === MessageType.HISTORY) {
          this.userService.addUsers((message as HistoryMessage).data.users);
          //   this.canvasService.addCanvasLayers(
          //     (message as HistoryMessage).data.users,
          //     this.canvasContainerRef.nativeElement
          //   );
          for (const [userId, drawHistory] of Object.entries(
            (message as HistoryMessage).data.drawHistory
          )) {
            for (const item of drawHistory) {
              this.canvasService.drawShape(userId, item.geometry, false);
            }
          }
        }
      });

    // set up two canvas with contexts
    const canvasBase = this.canvasBaseRef.nativeElement;
    this.contextBase = canvasBase.getContext('2d')!;
    const canvasPreview = this.canvasPreviewRef.nativeElement;
    this.contextPreview = canvasPreview.getContext('2d')!;
    this.canvasService.setOwnCanvasLayer(
      this.currentUser.id,
      {
        element: canvasBase,
        context: this.contextBase,
      },
      {
        element: canvasPreview,
        context: this.contextPreview,
      }
    );

    // set canvas size
    canvasBase.width = this.baseWidth;
    canvasBase.height = this.baseWidth * this.heightScale;
    canvasPreview.width = this.baseWidth;
    canvasPreview.height = this.baseWidth * this.heightScale;

    // set default styles
    this.contextBase.lineCap = 'round';
    this.contextBase.lineJoin = 'round';
    this.contextPreview.lineCap = 'round';
    this.contextPreview.lineJoin = 'round';

    this.toolbarService.mode$.subscribe((mode) => {
      this.mode = mode;
    });

    this.toolbarService.strokeWidthName$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((strokeWidthName) => {
        this.strokeWidth = this.strokeWidths[strokeWidthName];
        this.contextBase.lineWidth = this.strokeWidth;
        this.contextPreview.lineWidth = this.strokeWidth;
      });

    this.toolbarService.strokeColor$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((color) => {
        this.contextBaseColor = color;
        this.contextPreviewColor = this.getPreviewColor(color);
      });

    this.toolbarService
      .getClearCanvasEmitter()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.onClear();
      });
  }

  onMouseDown(event: MouseEvent) {
    if (!this.isMyTurn) return;

    if (this.mouseOutOfBounds) return;
    this.isDrawing = true;
    this.drawStart = this.getPoint(event);
    this.lastPoint = this.drawStart;

    // Reset for new path
    if (this.mode === 'path') {
      this.currentPathId = uuidv4();
      this.lastSentIndex = 0;
      this.currentPath = [];
    }
  }

  onMouseMove(event: MouseEvent) {
    if (!this.isMyTurn) return;

    const currentPos = this.getPoint(event);

    this.messagingService.send({
      type: MessageType.MOUSE_MOVE,
      userId: this.currentUser.id,
      data: { userId: this.currentUser.id, position: currentPos },
    });

    if (!this.isDrawing) return;
    if (this.lastPoint.x === currentPos.x && this.lastPoint.y === currentPos.y)
      return;

    if (this.mode === 'path') {
      if (
        this.currentPath.length === 0 ||
        currentPos.x !== this.lastPoint.x ||
        currentPos.y !== this.lastPoint.y
      )
        this.currentPath.push(currentPos);
      // Only send new points every 10 points
      if (this.currentPath.length - this.lastSentIndex >= 5) {
        this.sendNewPathChunk();
      }
    }
    this.canvasService.clearCanvas(this.currentUser.id, true);
    const shape = this.canvasService.getShape(
      this.mode,
      this.drawStart,
      currentPos,
      this.currentPath
    );
    shape.strokeColor = this.contextBaseColor;
    shape.strokeWidth = this.strokeWidth;

    this.canvasService.drawShape(
      this.currentUser.id,
      shape,
      this.mode !== 'path'
    );
    this.lastPoint = currentPos;
  }

  onMouseUp(event: MouseEvent) {
    if (!this.isMyTurn) return;

    this.isDrawing = false;
    const endPos = this.getPoint(event);

    const shape = this.canvasService.getShape(
      this.mode,
      this.drawStart,
      endPos
    );
    shape.strokeColor = this.contextBaseColor;
    shape.strokeWidth = this.strokeWidth;

    console.log(shape);
    this.canvasService.drawShape(this.currentUser.id, shape, false);

    if (this.mode === 'path') {
      this.sendNewPathChunk(true);
    } else {
      this.messagingService.send({
        type: MessageType.DRAW_SHAPE,
        userId: this.currentUser.id,
        data: {
          userId: this.currentUser.id,
          geometry: shape,
        },
      });
    }
    this.canvasService.clearCanvas(this.currentUser.id, true);
  }

  private sendNewPathChunk(isComplete: boolean = false) {
    const prevLastIndex =
      this.lastSentIndex > 0 ? this.lastSentIndex - 1 : this.lastSentIndex;
    const newPoints = this.currentPath.slice(prevLastIndex);
    for (let i = 0; i < newPoints.length; i++) {
      const line = this.canvasService.getShape(
        'line',
        newPoints[i],
        newPoints[i + 1]
      );
      this.messagingService.send({
        type: MessageType.DRAW_SHAPE,
        userId: this.currentUser.id,
        data: {
          geometry: line,
        },
      });
    }

    // const drawPathMessage: DrawPathMessage = {
    //   type: MessageType.DRAW_PATH,
    //   userId: this.currentUser.id,
    //   data: {
    //     userId: this.currentUser.id,
    //     pathId: this.currentPathId,
    //     path: {
    //       type: 'path',
    //       points: newPoints,
    //       strokeColor: this.contextBase.strokeStyle.toString(),
    //       strokeWidth: this.strokeWidth,
    //     },
    //     isComplete: isComplete,
    //   },
    // };
    // this.messagingService.send(drawPathMessage);
    this.lastSentIndex = this.currentPath.length; // Update to the last point sent
  }

  onMouseEnter(event: MouseEvent) {
    if (this.isMyTurn)
      this.canvasBaseRef.nativeElement.style.cursor =
        'url("/assets/icons/cursor_pen.svg") 0 24, auto';
    this.mouseOutOfBounds = false;
  }

  onMouseLeave(event: MouseEvent) {
    this.canvasBaseRef.nativeElement.style.removeProperty('cursor');
    this.mouseOutOfBounds = true;
  }

  onClear() {
    this.canvasService.clearCanvas(this.currentUser.id);
    this.messagingService.send({
      type: MessageType.CLEAR,
      userId: this.currentUser.id,
      data: { userId: this.currentUser.id },
    });
  }

  private getPoint(event: MouseEvent): Point {
    const renderedWidth = this.canvasBaseRef.nativeElement.clientWidth;
    const scaleFactor = this.baseWidth / renderedWidth;
    const rect = this.canvasBaseRef.nativeElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Scale the mouse position as if it were on a 1000px wide canvas
    const scaledX = Math.round(mouseX * scaleFactor);
    const scaledY = Math.round(mouseY * scaleFactor);
    return {
      x: scaledX,
      y: scaledY,
    };
  }

  private getPreviewColor(color: string) {
    return color + '33';
  }
}
