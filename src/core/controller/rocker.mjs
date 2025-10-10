import { toSingleButton } from "@utils/common";
import { EventEmitter } from "@utils/emitter";
import { MouseButton } from "@utils/types";

type Callback = (event: MouseEvent) => void;
type RockerEvents = {
  rockerleft: Callback;
  rockerright: Callback;
};

export class RockerController {
  private static _instance: RockerController;

  private _target: Window = window;
  private _preventDefault = true;
  private _lastMouseup = 0;
  private _events = new EventEmitter<RockerEvents>();

  private constructor() { }

  public static get instance(): RockerController {
    if (!this._instance) {
      this._instance = new RockerController();
    }
    return this._instance;
  }

  addEventListener<K extends keyof RockerEvents>(event: K, cb: RockerEvents[K]) {
    this._events.addEventListener(event, cb);
  }

  removeEventListener<K extends keyof RockerEvents>(event: K, cb: RockerEvents[K]) {
    this._events.removeEventListener(event, cb);
  }

  enable() {
    this._target.addEventListener('mousedown', this._handleMousedown);
    this._target.addEventListener('mouseup', this._handleMouseup);
    this._target.addEventListener('click', this._handleClick);
    this._target.addEventListener('contextmenu', this._handleContextMenu);
    this._target.addEventListener('visibilitychange', this._handleVisibilityChange);
  };

  disable() {
    this._target.removeEventListener('mousedown', this._handleMousedown);
    this._target.removeEventListener('mouseup', this._handleMouseup);
    this._target.removeEventListener('click', this._handleClick);
    this._target.removeEventListener('contextmenu', this._handleContextMenu);
    this._target.removeEventListener('visibilitychange', this._handleVisibilityChange);
  }

  private _handleMousedown = (e: MouseEvent) => {
    if (!e.isTrusted) return;

    this._preventDefault = false; // always disable prevention on mousedown

    if (e.buttons === MouseButton.LEFT + MouseButton.RIGHT) {
      this._events.dispatchEvent(
        e.button === 0 ? "rockerleft" : "rockerright", e); // idk why but left just be 0

      e.stopPropagation();
      e.preventDefault();
      this._preventDefault = true;
    }
  };

  private _handleMouseup = (e: MouseEvent) => {
    this._lastMouseup = e.timeStamp;
  }

  private _handleVisibilityChange = () => {
    this._preventDefault = true;
  }

  private _handleContextMenu = (e: MouseEvent) => {
    if (!e.isTrusted) return;

    if (e.button === toSingleButton(MouseButton.RIGHT) && this._preventDefault) {
      e.stopPropagation();
      e.preventDefault();
    }
  }

  private _handleClick = (e: MouseEvent) => {
    if (!e.isTrusted) return;

    // event.detail because a click event can be fired without clicking
    // https://stackoverflow.com/questions/4763638/enter-triggers-button-click
    // timeStamp check ensures that the click is fired by mouseup
    if (e.button === toSingleButton(MouseButton.LEFT) &&
      e.detail && e.timeStamp === this._lastMouseup && this._preventDefault) {
      e.stopPropagation();
      e.preventDefault();
    }
  }
}

export const rockerController = RockerController.instance;
