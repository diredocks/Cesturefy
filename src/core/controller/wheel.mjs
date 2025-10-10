import { DefaultConfig } from "@model/config";
import { toSingleButton } from "@utils/common";
import { EventEmitter } from "@utils/emitter";
import { MouseButton } from "@utils/types";

type WheelCallback = (event: WheelEvent) => void;

type WheelEvents = {
  wheelup: WheelCallback;
  wheeldown: WheelCallback;
};

export class WheelController {
  private static _instance: WheelController;

  private _target: Window = window;
  private _preventDefault = true;
  private _lastMouseup = 0;
  private _accumulatedDeltaY = 0;
  private _events = new EventEmitter<WheelEvents>();

  public mouseButton: MouseButton = DefaultConfig.Settings.Wheel.mouseButton;
  public wheelSensitivity = DefaultConfig.Settings.Wheel.wheelSensitivity;

  private constructor() { }

  public static get instance(): WheelController {
    if (!this._instance) {
      this._instance = new WheelController();
    }
    return this._instance;
  }

  addEventListener<K extends keyof WheelEvents>(event: K, cb: WheelEvents[K]) {
    this._events.addEventListener(event, cb);
  }

  removeEventListener<K extends keyof WheelEvents>(event: K, cb: WheelEvents[K]) {
    this._events.removeEventListener(event, cb);
  }

  enable() {
    this._target.addEventListener("wheel", this._handleWheel, { capture: true, passive: false });
    this._target.addEventListener("mousedown", this._handleMousedown);
    this._target.addEventListener("mouseup", this._handleMouseup);
    this._target.addEventListener("click", this._handleClick);
    this._target.addEventListener("contextmenu", this._handleContextmenu);
    this._target.addEventListener("visibilitychange", this._handleVisibilitychange);
  }

  disable() {
    this._preventDefault = true;
    this._target.removeEventListener("wheel", this._handleWheel, { capture: true });
    this._target.removeEventListener("mousedown", this._handleMousedown);
    this._target.removeEventListener("mouseup", this._handleMouseup);
    this._target.removeEventListener("click", this._handleClick);
    this._target.removeEventListener("contextmenu", this._handleContextmenu);
    this._target.removeEventListener("visibilitychange", this._handleVisibilitychange);
  }

  private _handleMousedown = (e: MouseEvent) => {
    if (!e.isTrusted) return;
    this._preventDefault = false;
    this._accumulatedDeltaY = 0;

    // prevent middle click scroll
    if (this.mouseButton === MouseButton.MIDDLE && e.buttons === MouseButton.MIDDLE) {
      e.preventDefault();
    }
  };

  private _handleWheel = (e: WheelEvent) => {
    if (!e.isTrusted) return;
    if (e.buttons !== this.mouseButton || e.deltaY === 0) return;

    // reset if direction changed
    if ((this._accumulatedDeltaY < 0) !== (e.deltaY < 0)) {
      this._accumulatedDeltaY = 0;
    }

    this._accumulatedDeltaY += e.deltaY;

    if (Math.abs(this._accumulatedDeltaY) >= this.wheelSensitivity) {
      if (this._accumulatedDeltaY < 0) {
        this._events.dispatchEvent("wheelup", e);
      } else {
        this._events.dispatchEvent("wheeldown", e);
      }

      this._accumulatedDeltaY = 0;
    }

    e.stopPropagation();
    e.preventDefault();
    this._preventDefault = true;
  };

  private _handleMouseup = (e: MouseEvent) => {
    this._lastMouseup = e.timeStamp;
  };

  private _handleVisibilitychange = () => {
    this._preventDefault = true;
    this._accumulatedDeltaY = 0;
  };

  private _handleContextmenu = (e: MouseEvent) => {
    if (!e.isTrusted) return;
    if (
      this._preventDefault &&
      e.button === toSingleButton(this.mouseButton) &&
      this.mouseButton === MouseButton.RIGHT
    ) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  private _handleClick = (e: MouseEvent) => {
    if (
      !e.isTrusted ||
      !this._preventDefault ||
      e.button !== toSingleButton(this.mouseButton) ||
      !(this.mouseButton === MouseButton.LEFT || this.mouseButton === MouseButton.MIDDLE)
    ) return;

    // only prevent real click (not enter/label trigger)
    if (e.detail && e.timeStamp === this._lastMouseup) {
      e.stopPropagation();
      e.preventDefault();
    }
  };
}

export const wheelController = WheelController.instance;
