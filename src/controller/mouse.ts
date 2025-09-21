// TODO: implement dispatch and abort

import { preventDefault, getDistance } from "../utils/common";

export default {
  enable,
  disable,
};

enum MouseButtonEvents {
  NoChanged = -1,
  NoPress = 0,
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

let lastRightClickTime = 0;
const doubleClickThreshold = 300; // ms

function handleContextMenu(e: MouseEvent) {
  const now = Date.now();

  if (now - lastRightClickTime < doubleClickThreshold) {
    lastRightClickTime = 0;
    reset();
    return;
  }

  preventDefault(e);
  lastRightClickTime = now;
}

function initialize(e: PointerEvent) {
  eventBuffer.push(e);
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

function handlePointermove(e: PointerEvent) {
  if (!e.isTrusted) return;

  if (e.buttons === MouseButton.RIGHT) {
    update(e);
  }
  else if (e.button !== MouseButtonEvents.NoChanged) {
    terminate(e);
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
        currentState = State.ACTIVE;
        enablePreventDefault();
      }
      break;
    }
    case State.ACTIVE: {
      console.log(e.clientX, e.clientY);
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
    // dispatch all bound functions on end and pass the latest event and an array of the buffered mouse events
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
  reset();
}
