export function preventDefault(e: Event) {
  if (e.isTrusted) {
    e.preventDefault();
    e.stopPropagation();
  }
}

export function getDistance(x1: number, y1: number, x2: number, y2: number) {
  return Math.hypot(x2 - x1, y2 - y1);
}
