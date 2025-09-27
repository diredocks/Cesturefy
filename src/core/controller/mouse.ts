import { preventDefault, getDistance } from "@utils/common";
import { DefaultConfig } from "@utils/config";
import { EventEmitter } from "@utils/emitter";
import { SuppressionKey } from "@utils/types";

type Callback = (buffer: PointerEvent[], event: PointerEvent) => void;
// type MouseEvents = Record<'register' | 'start' | 'update' | 'end' | 'abort', Callback>;

type MouseEvents = Record<string, (...args: any[]) => void> & {
  register: Callback;
  start: Callback;
  update: Callback;
  end: Callback;
  abort: (buffer: PointerEvent[]) => void;
};

export enum MouseButton {
  LEFT = 1,
  RIGHT = 2,
  MIDDLE = 4,
}

enum MouseButtonEvents {
  NoChanged = -1,
}

enum State {
  PASSIVE,
  PENDING,
  ACTIVE,
  ABORTED,
}

const doubleClickThreshold = 300; // ms

export class MouseController {
  private static _instance: MouseController;

  private _target: Window = window;
  private _events = new EventEmitter<MouseEvents>();
  private _state = State.PASSIVE;
  private _buffer: PointerEvent[] = [];
  private _lastClick = { time: 0, x: 0, y: 0 };
  private _timeoutId: number | null = null;
  private _timeout: number = 1000 * DefaultConfig.Settings.Gesture.Timeout.duration; // ms

  public isTimeoutAbort: boolean = DefaultConfig.Settings.Gesture.Timeout.active;
  public mouseButton: MouseButton = DefaultConfig.Settings.Gesture.mouseButton;
  public distanceThreshold: number = DefaultConfig.Settings.Gesture.distanceThreshold; // px
  public suppressionKey: SuppressionKey = DefaultConfig.Settings.Gesture.suppressionKey;

  private constructor() { }

  public static get instance(): MouseController {
    if (!this._instance) {
      this._instance = new MouseController();
    }
    return this._instance;
  }

  addEventListener<K extends keyof MouseEvents>(event: K, cb: MouseEvents[K]) {
    this._events.addEventListener(event, cb);
  }

  removeEventListener<K extends keyof MouseEvents>(event: K, cb: MouseEvents[K]) {
    this._events.removeEventListener(event, cb);
  }

  enable() {
    this._target.addEventListener("pointerdown", this._handlePointerDown);
  }

  disable() {
    this._target.removeEventListener("pointerdown", this._handlePointerDown);
  }

  private _handlePointerDown = (e: PointerEvent) => {
    if (this.suppressionKey !== '' && e[this.suppressionKey]) return; // do nothing if suppressionKey is on
    if (e.isTrusted && e.buttons === this.mouseButton) {
      this._initialize(e);
    } // on mouse button
  };

  private _handleContextMenu = (e: MouseEvent) => {
    const now = Date.now();
    const withinTime = now - this._lastClick.time < doubleClickThreshold;
    const withinDist =
      getDistance(this._lastClick.x, this._lastClick.y, e.clientX, e.clientY) < this.distanceThreshold;

    if (withinTime && withinDist) {
      this._reset();
      this._lastClick = { time: 0, x: 0, y: 0 };
      return;
    }

    preventDefault(e);
    this._lastClick = { time: now, x: e.clientX, y: e.clientY };
  };

  private _initialize(e: PointerEvent) {
    this._buffer.push(e);
    this._events.dispatchEvent("register", this._buffer, e);
    this._state = State.PENDING;

    this._target.addEventListener("contextmenu", this._handleContextMenu, true);
    this._target.addEventListener("pointermove", this._handlePointerMove, true);
    this._target.addEventListener("pointerup", this._handlePointerUp, true);
    this._target.addEventListener("visibilitychange", this._handleVisibilityChange, true);
  }

  private _enablePreventDefault() {
    this._target.addEventListener("click", preventDefault, true);
    this._target.addEventListener("auxclick", preventDefault, true);
    this._target.addEventListener("mouseup", preventDefault, true);
    this._target.addEventListener("mousedown", preventDefault, true);
  }

  private _disablePreventDefault() {
    this._target.removeEventListener("click", preventDefault, true);
    this._target.removeEventListener("auxclick", preventDefault, true);
    this._target.removeEventListener("mouseup", preventDefault, true);
    this._target.removeEventListener("mousedown", preventDefault, true);
  }

  private _toSingleButton(b: number) {
    switch (b) {
      case MouseButton.LEFT:
        return 0;
      case MouseButton.RIGHT:
        return 2;
      case MouseButton.MIDDLE:
        return 1;
      default:
        return -1;
    }
  }

  private _handlePointerMove = (e: PointerEvent) => {
    if (!e.isTrusted) return;

    if (e.buttons === this.mouseButton) {
      this._update(e);
    } else if (e.button !== MouseButtonEvents.NoChanged) {
      if (e.button === this._toSingleButton(this.mouseButton)) {
        this._terminate(e);
      } else {
        this._abort();
      }
    } else if (e.buttons === 0) {
      this._terminate(e);
    }
  };

  private _update(e: PointerEvent) {
    this._buffer.push(e);

    switch (this._state) {
      case State.PENDING: {
        const initial = this._buffer[0];
        const distance = getDistance(initial.clientX, initial.clientY, e.clientX, e.clientY);

        if (distance > this.distanceThreshold) {
          this._events.dispatchEvent("start", this._buffer, initial);
          this._state = State.ACTIVE;
          this._enablePreventDefault();
        }
        break;
      }
      case State.ACTIVE: {
        this._events.dispatchEvent("update", this._buffer, e);
        if (this.isTimeoutAbort) {
          this._clearTimeout();
          this._startTimeout();
        }
        break;
      }
    }
  }

  private _handlePointerUp = (e: PointerEvent) => {
    this._terminate(e);
  };

  private _terminate(e: PointerEvent) {
    this._buffer.push(e);

    if (this._state === State.ACTIVE) {
      this._events.dispatchEvent("end", this._buffer, e);
    }

    this._reset();
  }

  private _reset() {
    this._clearTimeout();

    this._target.removeEventListener("contextmenu", this._handleContextMenu, true);
    this._target.removeEventListener("pointermove", this._handlePointerMove, true);
    this._target.removeEventListener("pointerup", this._handlePointerUp, true);
    this._target.removeEventListener("visibilitychange", this._handleVisibilityChange, true);

    this._disablePreventDefault();

    const initial = this._buffer[0];
    if (initial) {
      if (initial.target instanceof Element) {
        initial.target.releasePointerCapture(initial.pointerId);
      } else {
        document.documentElement?.releasePointerCapture(initial.pointerId);
      }
    }

    this._buffer = [];
    this._state = State.PASSIVE;
  }

  private _handleVisibilityChange = () => {
    this._abort();
    this._reset();
  };

  private _abort() {
    this._events.dispatchEvent("abort", this._buffer);
    this._state = State.ABORTED;
  }

  public cancel() {
    this._reset();
  }

  get timeout() {
    return this._timeout / 1000; // ms -> s
  }

  set timeout(value: number) {
    this._timeout = value * 1000; // s -> ms
  }

  private _startTimeout() {
    this._timeoutId = window.setTimeout(() => {
      this._abort();
    }, this._timeout);
  }

  private _clearTimeout() {
    if (this._timeoutId === null) {
      return;
    }
    clearTimeout(this._timeoutId);
    this._timeoutId = null;
  }
}

export const mouseController = MouseController.instance;
