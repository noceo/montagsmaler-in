import { Geometry, Path, Point } from '../types/geometry.types';

export class Canvas {
  private drawingHistory: { userId: string; geometry: Geometry }[];
  // private currentPaths: { [userId: string]: Point[] };

  constructor() {
    this.drawingHistory = [];
    // this.currentPaths = {};
  }

  // addPath(
  //   points: Point[],
  //   strokeColor: string,
  //   strokeWidth: number,
  //   userId: string
  // ) {
  //   const lastRecordedPoint =
  //     points[points.length - drawPathMessage.data.path.points.length - 1];
  //   const data = structuredClone(drawPathMessage.data);
  //   if (lastRecordedPoint)
  //     data.path.points = [lastRecordedPoint, ...data.path.points];
  //   console.log(data.path.points);
  //   const currentPath = this.currentPaths[userId];
  //   const lastRecordedPoint = this.currentPaths[userId][currentPath.length-1];
  //   const newPathSegment = [...lastRecordedPoint]
  //   this.pushToDrawHistory({
  //       userId: userId,
  //       geometry: {type: "path", strokeColor: "#000000", strokeWidth: 3, points: points} as Path
  //   });
  //   this.currentPaths[userId] = this.currentPaths[userId].concat(points);
  //   delete this.currentPaths[pathId];
  // }

  addShape(userId: string, geometry: Geometry) {
    this.pushToDrawHistory(userId, geometry);
    // console.log(this.drawingHistory);
  }

  private pushToDrawHistory(userId: string, geometry: Geometry) {
    this.drawingHistory.push({ userId: userId, geometry: geometry });
  }
}
