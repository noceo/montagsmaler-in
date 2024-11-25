// whiteboard.component.ts
import {
  Component,
  ViewChild,
  ElementRef,
  OnDestroy,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RadioGroupComponent } from '../radio-group/radio-group.component';
import { ButtonComponent } from '../button/button.component';
import { MessagingService } from '../../services/messaging/messaging.service';
import {
  DrawPathMessage,
  DrawShapeMessage,
  HistoryMessage,
  JoinRoomMessage,
  MouseMoveMessage,
} from '../../types/message.types';
import { v4 as uuidv4 } from 'uuid';
import { CanvasService } from '../../services/canvas/canvas.service';
import { UserService } from '../../services/user/user.service';
import { Subscription } from 'rxjs';
import { faker } from '@faker-js/faker';
import { Point } from '../../types/geometry.types';

type StrokeWidth = 'tiny' | 'small' | 'medium' | 'big';
type DrawMode = 'path' | 'line' | 'rect' | 'triangle' | 'ellipse';

@Component({
  selector: 'app-whiteboard',
  templateUrl: './whiteboard.component.html',
  styleUrl: './whiteboard.component.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [FormsModule, RadioGroupComponent, ButtonComponent],
  standalone: true,
})
export class WhiteboardComponent implements OnDestroy {
  @ViewChild('canvasContainer') canvasContainerRef!: ElementRef<HTMLElement>;
  @ViewChild('canvasBase') canvasBaseRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasPreview') canvasPreviewRef!: ElementRef<HTMLCanvasElement>;
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

  contextBaseColor = '#000000';
  contextPreviewColor = this.getPreviewColor(this.contextBaseColor);
  strokeWidthName: StrokeWidth = 'small';
  strokeWidth = 15;
  mode: DrawMode = 'path';
  pathCursor = '../../assets/ions';
  cursorImage = new Image(64, 64);
  baseWidth = 2000;
  heightScale = 0.7;
  currentPath: Point[] = [];

  currentPathId = '';
  lastSentIndex = 0;

  userId = '';
  userName = faker.internet.username();

  private messagingServiceSubscription!: Subscription;

  constructor(
    private userService: UserService,
    private canvasService: CanvasService,
    private messagingService: MessagingService
  ) {}

  onJoinRoom() {
    this.messagingService.connect();

    this.messagingService.onConnection(() => {
      this.messagingService.send({
        type: 'login',
        data: { userName: this.userName },
      });
      //   this.messagingService.send({
      //     type: 'joinRoom',
      //     userId: this.userId,
      //     data: { roomCode: 'testRoom' },
      //   });
    });
  }

  onModeChange(value: string) {
    this.mode = value as DrawMode;
  }

  onStrokeColorChange(event: Event) {
    const color = (event.target as HTMLInputElement).value;
    this.contextBase.strokeStyle = color;
    this.contextPreview.strokeStyle = this.getPreviewColor(color);
  }

  onStrokeWidthChange(value: string) {
    this.strokeWidthName = value as StrokeWidth;
    this.strokeWidth = this.strokeWidths[this.strokeWidthName];
    this.contextBase.lineWidth = this.strokeWidth;
    this.contextPreview.lineWidth = this.strokeWidth;
  }

  ngAfterViewInit() {
    // set up message handlers
    this.messagingServiceSubscription = this.messagingService.subscribe(
      (message) => {
        if (message.type === 'joinRoom') {
          this.canvasService.addCanvasLayer(
            (message as JoinRoomMessage).data.user.id,
            this.canvasContainerRef.nativeElement
          );
        } else if (message.type === 'mouseMove')
          this.canvasService.drawCursor(
            (message as MouseMoveMessage).userId,
            (message as MouseMoveMessage).data.position
          );
        //   this.drawCursor((message as MouseMoveMessage).data.position);
        else if (message.type === 'drawPath') {
          this.canvasService.drawShape(
            message.userId!,
            (message as DrawPathMessage).data.path,
            false
          );
        } else if (message.type === 'drawShape') {
          this.canvasService.drawShape(
            (message as DrawShapeMessage).userId,
            (message as DrawShapeMessage).data.geometry,
            false
          );
        } else if (message.type === 'clear') {
          this.canvasService.clearCanvas(message.userId!);
        } else if (message.type === 'history') {
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
      }
    );

    // set up two canvas with contexts
    const canvasBase = this.canvasBaseRef.nativeElement;
    this.contextBase = canvasBase.getContext('2d')!;
    const canvasPreview = this.canvasPreviewRef.nativeElement;
    this.contextPreview = canvasPreview.getContext('2d')!;
    this.canvasService.setOwnCanvasLayer(this.userId, {
      base: {
        element: canvasBase,
        context: this.contextBase,
      },
      preview: {
        element: canvasPreview,
        context: this.contextPreview,
      },
    });

    // set canvas size
    canvasBase.width = this.baseWidth;
    canvasBase.height = this.baseWidth * this.heightScale;
    canvasPreview.width = this.baseWidth;
    canvasPreview.height = this.baseWidth * this.heightScale;

    // set default styles
    this.contextBase.lineCap = 'round';
    this.contextBase.lineJoin = 'round';
    this.contextBase.strokeStyle = this.contextBaseColor;
    this.contextBase.lineWidth = this.strokeWidth;
    this.contextPreview.lineCap = 'round';
    this.contextPreview.lineJoin = 'round';
    this.contextPreview.strokeStyle = this.getPreviewColor(
      this.contextBaseColor
    );
    this.contextPreview.lineWidth = this.strokeWidth;

    this.canvasBaseRef.nativeElement.style.cursor =
      'url("/assets/icons/cursor_pen.svg") 0 24, auto';
    this.cursorImage.src = '/assets/icons/cursor_pen.svg';
  }

  ngOnDestroy() {
    this.messagingServiceSubscription.unsubscribe();
  }

  onMouseDown(event: MouseEvent) {
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
    const currentPos = this.getPoint(event);

    this.messagingService.send({
      type: 'mouseMove',
      userId: this.userId,
      data: { userId: this.userId, position: currentPos },
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
    this.canvasService.clearCanvas(this.userId, true);
    const shape = this.canvasService.getShape(
      this.mode,
      this.drawStart,
      currentPos,
      this.currentPath
    );
    this.canvasService.drawShape(this.userId, shape, true);
    this.lastPoint = currentPos;
  }

  onMouseUp(event: MouseEvent) {
    this.isDrawing = false;
    const endPos = this.getPoint(event);

    const shape = this.canvasService.getShape(
      this.mode,
      this.drawStart,
      endPos
    );
    this.canvasService.drawShape(this.mode, shape, false);

    if (this.mode === 'path') {
      this.sendNewPathChunk(true);
    } else {
      this.messagingService.send({
        type: 'drawShape',
        userId: this.userId,
        data: {
          userId: this.userId,
          shape: this.mode,
          geometry: shape,
        },
      });
    }
    this.canvasService.clearCanvas(this.userId, true);
  }

  private sendNewPathChunk(isComplete: boolean = false) {
    const newPoints = this.currentPath.slice(this.lastSentIndex);
    const drawPathMessage: DrawPathMessage = {
      type: 'drawPath',
      userId: this.userId,
      data: {
        userId: this.userId,
        pathId: this.currentPathId,
        path: {
          type: 'path',
          points: newPoints,
          strokeColor: this.contextBaseColor,
          strokeWidth: this.strokeWidth,
        },
        isComplete: isComplete,
      },
    };
    this.messagingService.send(drawPathMessage);
    this.lastSentIndex = this.currentPath.length; // Update to the last point sent
  }

  onMouseEnter(event: MouseEvent) {
    this.mouseOutOfBounds = false;
  }

  onMouseLeave(event: MouseEvent) {
    this.mouseOutOfBounds = true;
  }

  onClear() {
    this.canvasService.clearCanvas(this.userId);
    this.messagingService.send({
      type: 'clear',
      userId: this.userId,
      data: { userId: this.userId },
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