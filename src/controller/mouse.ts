import { preventDefault, getDistance } from "@utils/common";
import { EventEmitter } from "@utils/emitter";

type Callback = (buffer: PointerEvent[], event?: PointerEvent) => void;
type EventMap = Record<'register' | 'start' | 'update' | 'end' | 'abort', Callback>;

const emitter = new EventEmitter<EventMap>();

export default {
  enable,
  disable,
  emitter,
};

enum MouseButtonEvents {
  NoChanged = -1,
}

enum MouseButton {
  LEFT = 1,
  RIGHT = 2,
  MIDDLE = 4,
}

enum State {
  PASSIVE,
  PENDING,
  ACTIVE,
  ABORTED,
};

let targetElement = window;
let currentState = State.PASSIVE;
let eventBuffer: (PointerEvent)[] = [];

function enable() {
  targetElement.addEventListener('pointerdown', handlePointerDown);
}

function disable() {
  targetElement.removeEventListener('pointerdown', handlePointerDown);
}

function handlePointerDown(e: PointerEvent) {
  if (e.isTrusted && e.buttons === MouseButton.RIGHT) {
    initialize(e);
  }
}

let lastClick = { time: 0, x: 0, y: 0 };

const doubleClickThreshold = 300; // ms
const moveThreshold = 10; // px

function handleContextMenu(e: MouseEvent) {
  const now = Date.now();
  const withinTime = now - lastClick.time < doubleClickThreshold;
  const withinDist = getDistance(lastClick.x, lastClick.y, e.clientX, e.clientY) < moveThreshold;

  if (withinTime && withinDist) {
    reset(); // reset mouse controller
    lastClick = { time: 0, x: 0, y: 0 }; // reset contextmenu state
    return;
  }

  e.preventDefault();
  lastClick = { time: now, x: e.clientX, y: e.clientY };
}

function initialize(e: PointerEvent) {
  eventBuffer.push(e);
  emitter.dispatchEvent('register', eventBuffer, e);
  currentState = State.PENDING;

  targetElement.addEventListener('contextmenu', handleContextMenu, true);
  targetElement.addEventListener('pointermove', handlePointermove, true);
  targetElement.addEventListener('pointerup', handlePointerup, true);
  targetElement.addEventListener('visibilitychange', handleVisibilitychange, true);
}

function enablePreventDefault() {
  targetElement.addEventListener('click', preventDefault, true);
  targetElement.addEventListener('auxclick', preventDefault, true);
  targetElement.addEventListener('mouseup', preventDefault, true);
  targetElement.addEventListener('mousedown', preventDefault, true);
}

function disablePreventDefault() {
  targetElement.removeEventListener('click', preventDefault, true);
  targetElement.removeEventListener('auxclick', preventDefault, true);
  targetElement.removeEventListener('mouseup', preventDefault, true);
  targetElement.removeEventListener('mousedown', preventDefault, true);
}

const toSingleButton = (b: number) => {
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
};

function handlePointermove(e: PointerEvent) {
  if (!e.isTrusted) return;

  if (e.buttons === MouseButton.RIGHT) {
    update(e);
  }
  else if (e.button !== MouseButtonEvents.NoChanged) {
    if (e.button === toSingleButton(MouseButton.RIGHT)) {
      terminate(e);
    } else {
      abort();
    }
  }
  else if (e.buttons === 0) {
    terminate(e);
  }
}

const distanceThreshold = 10;

function update(e: PointerEvent) {
  eventBuffer.push(e);

  switch (currentState) {
    case State.PENDING: {
      const initial = eventBuffer[0];
      const distance = getDistance(initial.clientX, initial.clientY, e.clientX, e.clientY);

      if (distance > distanceThreshold) {
        emitter.dispatchEvent('start', eventBuffer, initial);
        currentState = State.ACTIVE;
        enablePreventDefault();
      }
      break;
    }
    case State.ACTIVE: {
      emitter.dispatchEvent('update', eventBuffer, e);
      break;
    }
  }
}

function handlePointerup(e: PointerEvent) {
  terminate(e);
}

function terminate(e: PointerEvent) {
  eventBuffer.push(e);

  if (currentState === State.ACTIVE) {
    emitter.dispatchEvent('end', eventBuffer, e);
  }

  reset();
}

function reset() {
  targetElement.removeEventListener('contextmenu', handleContextMenu, true);
  targetElement.removeEventListener('pointermove', handlePointermove, true);
  targetElement.removeEventListener('pointerup', handlePointerup, true);
  targetElement.removeEventListener('visibilitychange', handleVisibilitychange, true);

  disablePreventDefault();

  const initialEvent = eventBuffer[0];
  if (initialEvent) {
    if (initialEvent.target instanceof Element) {
      initialEvent.target.releasePointerCapture(initialEvent.pointerId);
    } else {
      // fallback
      document.documentElement?.releasePointerCapture(initialEvent.pointerId);
    }
  }

  eventBuffer = [];
  currentState = State.PASSIVE;
}

function handleVisibilitychange() {
  abort();
  reset();
}

function abort() {
  emitter.dispatchEvent('abort', eventBuffer);
  currentState = State.ABORTED;
}
