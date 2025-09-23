export function preventDefault(e: Event) {
  if (e.isTrusted) {
    e.preventDefault();
    e.stopPropagation();
  }
}

export function getDistance(x1: number, y1: number, x2: number, y2: number) {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function vectorDirectionDifference(
  V1X: number, V1Y: number,
  V2X: number, V2Y: number
): number {
  let angleDifference = Math.atan2(V1X, V1Y) - Math.atan2(V2X, V2Y);

  if (angleDifference > Math.PI) {
    angleDifference -= 2 * Math.PI;
  } else if (angleDifference <= -Math.PI) {
    angleDifference += 2 * Math.PI;
  }

  return angleDifference / Math.PI;
}
