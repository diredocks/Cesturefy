import { mouseController } from "@controller/mouse";
import { traceCommand } from "@view/trace-command";
import Pattern from "@utils/pattern";
import {
  Handler, HandlerMap, registerHandlers,
  sendBackgroundMessage, ContentMessages
} from "@utils/message";
import { configManager } from "@utils/config-manager";

const pattern = new Pattern();

const applySettings = () => {
  mouseController.mouseButton = configManager.getPath(['Settings', 'Gesture', 'mouseButton']);
  mouseController.distanceThreshold = configManager.getPath(['Settings', 'Gesture', 'distanceThreshold']);
};

configManager.addEventListener('loaded', applySettings);
configManager.addEventListener('change', applySettings);

main();

function main() {
  mouseController.enable();
}

mouseController.addEventListener('start', (es, e) => {
  if (configManager.getPath(['Settings', 'Gesture', 'Trace', 'display']) ||
    configManager.getPath(['Settings', 'Gesture', 'Command', 'display'])) {
    traceCommand.initialize(e.clientX, e.clientY);
  }

  const coalescedEvents = es.flatMap(e => {
    const es = e.getCoalescedEvents();
    // if events is null/undefined or empty (length == 0) return plain event
    return (es?.length > 0) ? es : [e];
  });

  mouseGestureUpdate(coalescedEvents);
});

mouseController.addEventListener('update', (_es, e) => {
  const coalescedEvents = e.getCoalescedEvents();
  mouseGestureUpdate(coalescedEvents);
});

mouseController.addEventListener('end', (_es, _e) => {
  traceCommand.terminate();
  sendBackgroundMessage('gestureEnd', pattern.getPattern());
  pattern.clear();
});

mouseController.addEventListener('abort', (_es) => {
  traceCommand.terminate();
  pattern.clear();
});

function mouseGestureUpdate(es: (PointerEvent)[]) {
  for (const e of es) {
    const patternChange = pattern.addPoint(e.clientX, e.clientY);
    if (patternChange &&
      configManager.getPath(['Settings', 'Gesture', 'Command', 'display'])) {
      sendBackgroundMessage('gestureChange', pattern.getPattern());
    }
  }

  if (configManager.getPath(['Settings', 'Gesture', 'Trace', 'display'])) {
    const points = es.map(e => ({ x: e.clientX, y: e.clientY }));
    traceCommand.updateTrace(points);
  }
}

const handleMatchingGesture: Handler<"matchingGesture", ContentMessages> = (m) => {
  traceCommand.updateCommand(m.data);
};

const contentHandlers: HandlerMap<ContentMessages> = {
  matchingGesture: handleMatchingGesture,
};

registerHandlers(contentHandlers);
