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
