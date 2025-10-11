import { getDistance } from "@utils/common";
import { Point } from "@utils/types";
import { configManager } from "@model/config-manager";
import { DefaultConfig } from "@model/config";

export class TraceCommand {
  private static _instance: TraceCommand;

  private overlay = document.createElement('div');
  private canvas = document.createElement('canvas');
  private command = document.createElement('div');
  private context: CanvasRenderingContext2D;

  private traceLineWidth = DefaultConfig.Settings.Gesture.Trace.Style.lineWidth;
  private traceLineGrowth = DefaultConfig.Settings.Gesture.Trace.Style.lineGrowth;
  private commandFollowCursor = DefaultConfig.Settings.Gesture.Command.followCursor;
  private lastTraceWidth = 0;
  private lastPoint: Point = { x: 0, y: 0 };

  private constructor() {
    this.overlay.popover = 'manual';
    this.overlay.style.cssText = `
      all: initial !important;
      position: fixed !important;
      inset: 0 !important;
      pointer-events: auto !important;
    `;

    this.canvas.style.cssText = `
      all: initial !important;
      pointer-events: auto !important;
    `;
    this.context = this.canvas.getContext('2d')!;

    this.command.style.cssText = `
      --horizontalPosition: 0;
      --verticalPosition: 0;
      all: initial !important;
      position: absolute !important;
      top: calc(var(--verticalPosition) * 1%) !important;
      left: calc(var(--horizontalPosition) * 1%) !important;
      transform: translate(calc(var(--horizontalPosition) * -1%), calc(var(--verticalPosition) * -1%)) !important;
      font-family: "NunitoSans Regular", "Arial", sans-serif !important;
      line-height: normal !important;
      text-shadow: 0.01em 0.01em 0.01em rgba(0,0,0,0.5) !important;
      text-align: center !important;
      padding: 0.4em 0.4em 0.3em !important;
      font-weight: bold !important;
      background-color: transparent !important;
      width: max-content !important;
      max-width: 50vw !important;
      pointer-events: auto !important;
    `;

    window.addEventListener('resize', this.maximizeCanvas, true);
    this.maximizeCanvas();

    configManager.addEventListener("change", () => this.applyConfig());
    configManager.addEventListener("loaded", () => this.applyConfig());
  }

  public static get instance(): TraceCommand {
    if (!this._instance) this._instance = new TraceCommand();
    return this._instance;
  }

  initialize(x: number, y: number) {
    // overlay is not working in a pure svg or other xml pages thus do not append the overlay
    if (!document.body && document.documentElement.namespaceURI !== "http://www.w3.org/1999/xhtml") return;

    document.body.appendChild(this.overlay);
    this.overlay.showPopover();

    this.lastPoint = { x, y };
  }

  updateTrace(points: Point[]) {
    if (!this.overlay.contains(this.canvas)) this.overlay.appendChild(this.canvas);

    const path = new Path2D();

    for (const point of points) {
      let startWidth = this.traceLineWidth;
      let endWidth = this.traceLineWidth;

      if (this.traceLineGrowth && this.lastTraceWidth < this.traceLineWidth) {
        const growthDistance = this.traceLineWidth * 50;
        const distance = getDistance(this.lastPoint.x, this.lastPoint.y, point.x, point.y);
        endWidth = Math.min(
          this.lastTraceWidth + (distance / growthDistance) * this.traceLineWidth,
          this.traceLineWidth
        );
        startWidth = this.lastTraceWidth;
        this.lastTraceWidth = endWidth;
      }

      path.addPath(this.createGrowingLine(
        this.lastPoint.x, this.lastPoint.y,
        point.x, point.y,
        startWidth,
        endWidth
      ));

      this.lastPoint = { ...point };
    }

    this.context.fill(path);
  }

  updateCommand(text: string | null) {
    // FIXME: when trace disabled lastPoint won't update
    if (text !== null && this.overlay.isConnected) {
      this.command.textContent = text;
      if (!this.overlay.contains(this.command)) this.overlay.appendChild(this.command);
      if (this.commandFollowCursor) {
        const horizontalPercent = (this.lastPoint.x / window.innerWidth) * 100;
        const verticalPercent = (this.lastPoint.y / window.innerHeight) * 100;
        this.command.style.setProperty("--horizontalPosition", String(horizontalPercent));
        this.command.style.setProperty("--verticalPosition", String(verticalPercent));
      }
    } else {
      this.command.remove();
    }
  }

  terminate() {
    this.overlay.hidePopover();
    this.overlay.remove();
    this.canvas.remove();
    this.command.remove();

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.lastTraceWidth = 0;
    this.command.textContent = "";
  }

  private maximizeCanvas = () => {
    const { lineCap, lineJoin, fillStyle, strokeStyle, lineWidth } = this.context;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    Object.assign(this.context, { lineCap, lineJoin, fillStyle, strokeStyle, lineWidth });
  };

  private createGrowingLine(
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

  // Styles

  get gestureTraceLineColor(): string {
    const rgbHex = this.context.fillStyle as string;
    const alpha = parseFloat(this.canvas.style.getPropertyValue("opacity")) || 1;
    let aHex = Math.round(alpha * 255).toString(16);
    if (aHex.length === 1) aHex = "0" + aHex;
    return rgbHex + aHex;
  }

  set gestureTraceLineColor(value: string) {
    const rgbHex = value.substring(0, 7);
    const aHex = value.slice(7);
    const alpha = parseInt(aHex, 16) / 255;
    this.context.fillStyle = rgbHex;
    this.canvas.style.setProperty("opacity", String(alpha), "important");
  }

  get gestureTraceLineWidth(): number {
    return this.traceLineWidth;
  }
  set gestureTraceLineWidth(value: number) {
    this.traceLineWidth = value;
  }

  get gestureTraceLineGrowth(): boolean {
    return this.traceLineGrowth;
  }
  set gestureTraceLineGrowth(value: boolean) {
    this.traceLineGrowth = Boolean(value);
  }

  get gestureCommandFontSize(): string {
    return this.command.style.getPropertyValue("font-size");
  }
  set gestureCommandFontSize(value: string) {
    this.command.style.setProperty("font-size", value, "important");
  }

  get gestureCommandFontColor(): string {
    return this.command.style.getPropertyValue("color");
  }
  set gestureCommandFontColor(value: string) {
    this.command.style.setProperty("color", value, "important");
  }

  get gestureCommandBackgroundColor(): string {
    return this.command.style.getPropertyValue("background-color");
  }
  set gestureCommandBackgroundColor(value: string) {
    this.command.style.setProperty("background-color", value, "important");
  }

  get gestureCommandHorizontalPosition(): number {
    return parseFloat(this.command.style.getPropertyValue("--horizontalPosition"));
  }
  set gestureCommandHorizontalPosition(value: number) {
    this.command.style.setProperty("--horizontalPosition", String(value));
  }

  get gestureCommandVerticalPosition(): number {
    return parseFloat(this.command.style.getPropertyValue("--verticalPosition"));
  }
  set gestureCommandVerticalPosition(value: number) {
    this.command.style.setProperty("--verticalPosition", String(value));
  }

  get gestureCommandFollowCursor(): boolean {
    return this.commandFollowCursor;
  }
  set gestureCommandFollowCursor(value: boolean) {
    this.commandFollowCursor = Boolean(value);
  }

  applyConfig() {
    this.gestureTraceLineColor = configManager.getPath(["Settings", "Gesture", "Trace", "Style", "strokeStyle"]);
    this.gestureTraceLineWidth = configManager.getPath(["Settings", "Gesture", "Trace", "Style", "lineWidth"]);
    this.gestureTraceLineGrowth = configManager.getPath(["Settings", "Gesture", "Trace", "Style", "lineGrowth"]);

    this.gestureCommandFontSize = configManager.getPath(["Settings", "Gesture", "Command", "Style", "fontSize"]);
    this.gestureCommandFontColor = configManager.getPath(["Settings", "Gesture", "Command", "Style", "fontColor"]);
    this.gestureCommandBackgroundColor = configManager.getPath(["Settings", "Gesture", "Command", "Style", "backgroundColor"]);
    this.gestureCommandHorizontalPosition = configManager.getPath(["Settings", "Gesture", "Command", "Style", "horizontalPosition"]);
    this.gestureCommandVerticalPosition = configManager.getPath(["Settings", "Gesture", "Command", "Style", "verticalPosition"]);
    this.commandFollowCursor = configManager.getPath(["Settings", "Gesture", "Command", "followCursor"]);
  }
}

export const traceCommand = TraceCommand.instance;
