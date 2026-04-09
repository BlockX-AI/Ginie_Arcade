export interface ICircle {
  x: number;
  y: number;
  radius: number;
}

export interface ICollisionBox {
  min: {
    x: number;
    y: number;
  };
  max: {
    x: number;
    y: number;
  };
}

function distanceXY(x0: number, y0: number, x1: number, y1: number) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  return Math.sqrt(dx * dx + dy * dy);
}

export function rangeIntersects(
  min0: number,
  max0: number,
  min1: number,
  max1: number
) {
  return (
    Math.max(min0, max0) >= Math.min(min1, max1) &&
    Math.min(min0, max0) <= Math.max(min1, max1)
  );
}

export function rectIntersect(box3A: ICollisionBox, box3B: ICollisionBox) {
  return (
    rangeIntersects(box3A.min.x, box3A.max.x, box3B.min.x, box3B.max.x) &&
    rangeIntersects(box3A.min.y, box3A.max.y, box3B.min.y, box3B.max.y)
  );
}

export function circlePointCollision(x: number, y: number, circle: ICircle) {
  return distanceXY(x, y, circle.x, circle.y) < circle.radius;
}
