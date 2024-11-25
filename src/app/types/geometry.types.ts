export interface Point {
  x: number;
  y: number;
}

export interface Geometry {
  type: string;
  strokeWidth: number;
  strokeColor: string;
}

export interface Path extends Geometry {
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
