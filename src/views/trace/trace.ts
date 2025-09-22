// TODO: figure out how this works

import { getDistance, Point } from "@utils/common";

export default {
  initialize,
  updateTrace,
  terminate,
}

const overlay = document.createElement('div');
overlay.popover = 'manual';
overlay.style.cssText = `
  all: initial !important;
  position: fixed !important;
  inset: 0 !important;
  pointer-events: none !important;
`;

const canvas = document.createElement('canvas');
canvas.style.cssText = `
  all: initial !important;
  pointer-events: none !important;
`;
const context = canvas.getContext('2d')!;

let traceLineWidth = 10;
let traceLineGrowth = true;
let lastTraceWidth = 0;
let lastPoint: Point = { x: 0, y: 0 };

function initialize(x: number, y: number) {
  if (!document.body && document.documentElement.namespaceURI !== "http://www.w3.org/1999/xhtml") {
    return;
  }

  document.body.appendChild(overlay);
  overlay.showPopover();

  lastPoint.x = x;
  lastPoint.y = y;
}

function updateTrace(points: Point[]): void {
  if (!overlay.contains(canvas)) overlay.appendChild(canvas);

  const path = new Path2D();

  for (const point of points) {
    if (traceLineGrowth && lastTraceWidth < traceLineWidth) {
      const growthDistance = traceLineWidth * 50;
      const distance = getDistance(lastPoint.x, lastPoint.y, point.x, point.y);
      const currentTraceWidth = Math.min(
        lastTraceWidth + (distance / growthDistance) * traceLineWidth,
        traceLineWidth
      );

      const pathSegment = createGrowingLine(
        lastPoint.x, lastPoint.y,
        point.x, point.y,
        lastTraceWidth,
        currentTraceWidth
      );
      path.addPath(pathSegment);

      lastTraceWidth = currentTraceWidth;
    } else {
      const pathSegment = createGrowingLine(
        lastPoint.x, lastPoint.y,
        point.x, point.y,
        traceLineWidth,
        traceLineWidth
      );
      path.addPath(pathSegment);
    }

    lastPoint.x = point.x;
    lastPoint.y = point.y;
  }

  context.fill(path);
}

function terminate(): void {
  overlay.hidePopover();
  overlay.remove();
  canvas.remove();

  context.clearRect(0, 0, canvas.width, canvas.height);

  lastTraceWidth = 0;
}

window.addEventListener('resize', maximizeCanvas, true);
maximizeCanvas();


function maximizeCanvas(): void {
  const { lineCap, lineJoin, fillStyle, strokeStyle, lineWidth } = context;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  Object.assign(context, { lineCap, lineJoin, fillStyle, strokeStyle, lineWidth });
}

function createGrowingLine(
  x1: number, y1: number,
  x2: number, y2: number,
  startWidth: number,
  endWidth: number
): Path2D {
  const directionVectorX = x2 - x1;
  const directionVectorY = y2 - y1;
  const perpendicularVectorAngle = Math.atan2(directionVectorY, directionVectorX) + Math.PI / 2;

  const path = new Path2D();
  path.arc(x1, y1, startWidth / 2, perpendicularVectorAngle, perpendicularVectorAngle + Math.PI);
  path.arc(x2, y2, endWidth / 2, perpendicularVectorAngle + Math.PI, perpendicularVectorAngle);
  path.closePath();
  return path;
}
