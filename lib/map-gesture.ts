type Point = { x: number; y: number };
export type Gesture = { center: Point; distance: number; zoom: number; pan: Point };
const center = (points: Point[]) => points.length > 1
  ? { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 }
  : points[0];
export function beginGesture(points: Point[], zoom: number, pan: Point): Gesture {
  return { center: center(points), distance: points.length > 1 ? Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y) : 0, zoom, pan: { ...pan } };
}
export function updateGesture(start: Gesture, points: Point[], minZoom: number, maxZoom: number) {
  const current = center(points);
  const distance = points.length > 1 ? Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y) : 0;
  const zoom = Math.max(minZoom, Math.min(maxZoom, start.zoom * (start.distance > 0 && points.length > 1 ? distance / start.distance : 1)));
  const ratio = zoom / start.zoom;
  return { zoom, pan: { x: current.x - (start.center.x - start.pan.x) * ratio, y: current.y - (start.center.y - start.pan.y) * ratio } };
}
