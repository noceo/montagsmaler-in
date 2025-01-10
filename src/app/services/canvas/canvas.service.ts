import { Injectable } from '@angular/core';
import { Geometry, Point } from '../../types/geometry.types';

interface CanvasLayerContent {
  element: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
}

interface CanvasLayer {
  base: CanvasLayerContent;
  preview: CanvasLayerContent;
}

interface Path extends Geometry {
  points: Point[];
}

interface Line extends Geometry {
  start: Point;
  end: Point;
}

interface Rect extends Geometry {
  start: Point;
  width: number;
  height: number;
}

interface Triangle extends Geometry {
  pointA: Point;
  pointB: Point;
  pointC: Point;
}

interface Ellipse extends Geometry {
  center: Point;
  radiusX: number;
  radiusY: number;
}

@Injectable({
  providedIn: 'root',
})
export class CanvasService {
  private canvasLayers: Record<string, CanvasLayer> = {};
  private getShapeFunctions: Record<
    string,
    (start: Point, end: Point, points?: Point[]) => Geometry
  > = {
    path: (start, end, points): Path => this.getPath(start, end, points!),
    line: (start, end): Line => this.getLine(start, end),
    rect: (start, end): Rect => this.getRect(start, end),
    triangle: (start, end): Triangle => this.getTriangle(start, end),
    ellipse: (start, end): Ellipse => this.getEllipse(start, end),
  };
  private drawShapeFunctions: Record<
    string,
    (geo: Geometry, ctx: CanvasRenderingContext2D, isPreview: boolean) => void
  > = {
    path: (geo, ctx, isPreview) => this.drawPath(geo as Path, ctx, isPreview),
    line: (geo, ctx, isPreview) => this.drawLine(geo as Line, ctx, isPreview),
    rect: (geo, ctx, isPreview) => this.drawRect(geo as Rect, ctx, isPreview),
    triangle: (geo, ctx, isPreview) =>
      this.drawTriangle(geo as Triangle, ctx, isPreview),
    ellipse: (geo, ctx, isPreview) =>
      this.drawEllipse(geo as Ellipse, ctx, isPreview),
  };
  private baseWidth = 2000;
  private heightScale = 0.7;
  private contextBaseColor = '#000000';
  private strokeWidth = 15;
  private cursorImage = new Image(64, 64);

  setOwnCanvasLayer(userId: string, canvasLayer: CanvasLayer) {
    this.canvasLayers[userId] = canvasLayer;
    console.log(this.canvasLayers[userId]);
  }

  getCanvasLayer(userId: string) {
    return this.canvasLayers[userId];
  }

  addCanvasLayer(id: string, container: HTMLElement) {
    // do not add if the is already a layer for that user
    if (container.querySelector(`[data-user='${id}']`)) return;

    const canvasLayerWrapper = document.createElement('div');
    canvasLayerWrapper.className = 'canvas-layer';
    canvasLayerWrapper.setAttribute('data-user', id);

    const canvasBase = document.createElement('canvas');
    canvasBase.className = 'canvas-base';
    const contextBase = canvasBase.getContext('2d')!;

    const canvasPreview = document.createElement('canvas');
    canvasPreview.className = 'canvas-preview';
    const contextPreview = canvasPreview.getContext('2d')!;

    // Set canvas size
    canvasBase.width = this.baseWidth;
    canvasBase.height = this.baseWidth * this.heightScale;
    canvasPreview.width = this.baseWidth;
    canvasPreview.height = this.baseWidth * this.heightScale;

    // Set default styles
    contextBase.strokeStyle = this.contextBaseColor;
    contextBase.lineWidth = this.strokeWidth;
    contextBase.lineCap = 'round';
    contextBase.lineJoin = 'round';

    contextPreview.strokeStyle = this.getPreviewColor(this.contextBaseColor);
    contextPreview.lineWidth = this.strokeWidth;
    contextPreview.lineCap = 'round';
    contextPreview.lineJoin = 'round';

    this.cursorImage.src = '/assets/icons/cursor_pen.svg';

    this.canvasLayers[id] = {
      base: { element: canvasBase, context: contextBase },
      preview: { element: canvasPreview, context: contextPreview },
    };

    canvasLayerWrapper.appendChild(canvasBase);
    canvasLayerWrapper.appendChild(canvasPreview);
    container.prepend(canvasLayerWrapper);
  }

  addCanvasLayers(ids: string[], container: HTMLElement) {
    ids.forEach((id) => this.addCanvasLayer(id, container));
  }

  clearAllCanvasLayers() {
    for (const layer of Object.values(this.canvasLayers)) {
      this.clear(layer.base.context);
      this.clear(layer.preview.context);
    }
  }

  drawCursor(id: string, name: string, position: Point) {
    const context = this.canvasLayers[id].preview.context;
    this.clear(context);
    context.drawImage(
      this.cursorImage,
      position.x,
      position.y - 64,
      this.cursorImage.width,
      this.cursorImage.height
    );
    context.font = '60px Synonym-Medium';
    context.fillText(name, position.x + 64, position.y - 75, 500);
  }

  getShape(type: string, start: Point, end: Point, points?: Point[]) {
    if (type === 'path') return this.getPath(start, end, points);
    return this.getShapeFunctions[type](start, end);
  }

  drawShape(id: string, geometry: Geometry, isPreview: boolean) {
    const context = isPreview
      ? this.canvasLayers[id].preview.context
      : this.canvasLayers[id].base.context;
    const drawFunction = this.drawShapeFunctions[geometry.type];
    drawFunction(geometry, context, isPreview);
  }

  clearCanvas(id: string, isPreview?: boolean) {
    this.clear(
      isPreview
        ? this.canvasLayers[id].preview.context
        : this.canvasLayers[id].base.context
    );
  }

  private drawPoint(point: Point, context: CanvasRenderingContext2D) {
    // this.contextBase.strokeStyle = rect.strokeColor;
    // this.contextBase.lineWidth = rect.strokeWidth;
    context.fillRect(point.x, point.y, this.strokeWidth, this.strokeWidth);
  }

  private drawPath(
    path: Path,
    context: CanvasRenderingContext2D,
    isPreview: boolean
  ) {
    context.strokeStyle = path.strokeColor;
    context.lineWidth = path.strokeWidth;
    context.beginPath();
    context.moveTo(path.points[0].x, path.points[0].y);
    for (const point of path.points.slice(1)) {
      context.lineTo(point.x, point.y);
    }
    context.stroke();
  }

  private drawLine(
    line: Line,
    context: CanvasRenderingContext2D,
    isPreview: boolean
  ) {
    context.strokeStyle = this.getContextColor(line.strokeColor, isPreview);
    context.lineWidth = line.strokeWidth;
    context.beginPath();
    context.moveTo(line.start.x, line.start.y);
    context.lineTo(line.end.x, line.end.y);
    context.stroke();
  }

  private drawRect(
    rect: Rect,
    context: CanvasRenderingContext2D,
    isPreview: boolean
  ) {
    context.strokeStyle = this.getContextColor(rect.strokeColor, isPreview);
    context.lineWidth = rect.strokeWidth;
    context.strokeRect(rect.start.x, rect.start.y, rect.width, rect.height);
  }

  private drawTriangle(
    triangle: Triangle,
    context: CanvasRenderingContext2D,
    isPreview: boolean
  ) {
    context.strokeStyle = this.getContextColor(triangle.strokeColor, isPreview);
    context.lineWidth = triangle.strokeWidth;
    context.beginPath();
    context.moveTo(triangle.pointA.x, triangle.pointA.y);
    context.lineTo(triangle.pointB.x, triangle.pointB.y);
    context.lineTo(triangle.pointC.x, triangle.pointC.y);
    context.lineTo(triangle.pointA.x, triangle.pointA.y);
    context.stroke();
  }

  private drawEllipse(
    ellipse: Ellipse,
    context: CanvasRenderingContext2D,
    isPreview: boolean
  ) {
    context.strokeStyle = this.getContextColor(ellipse.strokeColor, isPreview);
    context.lineWidth = ellipse.strokeWidth;
    context.beginPath();
    context.ellipse(
      ellipse.center.x,
      ellipse.center.y,
      ellipse.radiusX,
      ellipse.radiusY,
      0,
      0,
      2 * Math.PI,
      false
    );
    context.stroke();
  }

  private getPath(start: Point, end: Point, points?: Point[]): Path {
    return {
      type: 'path',
      points: points || [],
      strokeColor: this.contextBaseColor,
      strokeWidth: this.strokeWidth,
    };
  }

  private getLine(start: Point, end: Point): Line {
    return {
      type: 'line',
      start: start,
      end: end,
      strokeColor: this.contextBaseColor,
      strokeWidth: this.strokeWidth,
    };
  }

  private getRect(start: Point, end: Point) {
    const width = Math.abs(start.x - end.x);
    const height = Math.abs(start.y - end.y);

    if (end.x < start.x) {
      if (end.y < start.y) {
        start = end;
      } else {
        start = { x: end.x, y: start.y };
      }
    } else if (end.y < start.y) {
      start = { x: start.x, y: end.y };
    }

    return {
      type: 'rect',
      start: start,
      width: width,
      height: height,
      strokeColor: this.contextBaseColor,
      strokeWidth: this.strokeWidth,
    };
  }

  private getTriangle(start: Point, end: Point): Triangle {
    const width = Math.abs(start.x - end.x);
    const pointAX = end.x < start.x ? end.x : start.x;
    const pointAY = start.y;
    const pointBX = end.x + (end.x < start.x ? width / 2 : -width / 2);
    const pointBY = end.y;
    const pointCX = end.x < start.x ? start.x : end.x;
    const pointCY = start.y;

    return {
      type: 'triangle',
      pointA: { x: pointAX, y: pointAY },
      pointB: { x: pointBX, y: pointBY },
      pointC: { x: pointCX, y: pointCY },
      strokeColor: this.contextBaseColor,
      strokeWidth: this.strokeWidth,
    };
  }

  private getEllipse(start: Point, end: Point): Ellipse {
    const radiusX = Math.abs(start.x - end.x) / 2;
    const radiusY = Math.abs(start.y - end.y) / 2;
    let centerX, centerY;

    centerX = end.x + (end.x < start.x ? radiusX : -radiusX);
    centerY = end.y + (end.y < start.y ? radiusY : -radiusY);

    return {
      type: 'ellipse',
      center: { x: centerX, y: centerY },
      radiusX: radiusX,
      radiusY: radiusY,
      strokeColor: this.contextBaseColor,
      strokeWidth: this.strokeWidth,
    };
  }

  private clear(context: CanvasRenderingContext2D) {
    context.clearRect(0, 0, this.baseWidth, this.baseWidth * this.heightScale);
  }

  private getContextColor(color: string, isPreview: boolean) {
    return isPreview ? this.getPreviewColor(color) : color;
  }

  private getPreviewColor(color: string) {
    return color + '33';
  }
}
