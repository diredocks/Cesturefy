import { mouseController } from "@controller/mouse";
import { traceCommand } from "@view/trace-command";
import Pattern from "@utils/pattern";
import {
  Handler, HandlerMap, registerHandlers,
  sendBackgroundMessage, ContentMessages
} from "@utils/message";
import { configManager } from "@utils/config-manager";
import { DefaultConfig } from "@utils/config";
import { matchesURL } from "@utils/common";

const pattern = new Pattern();
let exclusions: string[] = DefaultConfig.Exclusions;
let displayTrace: boolean = DefaultConfig.Settings.Gesture.Trace.display;
let displayCommand: boolean = DefaultConfig.Settings.Gesture.Command.display;

const applySettings = () => {
  mouseController.mouseButton = configManager.getPath(['Settings', 'Gesture', 'mouseButton']);
  mouseController.distanceThreshold = configManager.getPath(['Settings', 'Gesture', 'distanceThreshold']);
  mouseController.isTimeoutAbort = configManager.getPath(['Settings', 'Gesture', 'Timeout', 'active']);
  mouseController.timeout = configManager.getPath(['Settings', 'Gesture', 'Timeout', 'duration']);
  mouseController.suppressionKey = configManager.getPath(['Settings', 'Gesture', 'suppressionKey']);
  displayTrace = configManager.getPath(['Settings', 'Gesture', 'Trace', 'display']);
  displayCommand = configManager.getPath(['Settings', 'Gesture', 'Command', 'display']);
  exclusions = configManager.getPath(['Exclusions']);
  main(); // TODO: eww refactor this
};

configManager.addEventListener('loaded', applySettings);
configManager.addEventListener('change', applySettings);

configManager.loaded.then(() => main());

function main() {
  // NOTE: window.location.href is returning the frame URL for frames and not the tab URL
  const isExcluded = exclusions.some(url => matchesURL(window.location.href, url));
  if (!isExcluded) {
    mouseController.enable();
  }
}

mouseController.addEventListener('start', (es, e) => {
  if (displayTrace || displayCommand) {
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
    if (patternChange && displayCommand) {
      sendBackgroundMessage('gestureChange', pattern.getPattern());
    }
  }

  if (displayTrace) {
    const points = es.map(e => ({ x: e.clientX, y: e.clientY }));
    traceCommand.updateTrace(points);
  }
}

const handleMatchingGesture: Handler<"matchingGesture", ContentMessages> = (m) => {
  traceCommand.updateCommand(m.data);
};

const handleCurrentOS: Handler<"currentOS", ContentMessages> = (m) => {
  mouseController.currentOS = m.data;
};

const contentHandlers: HandlerMap<ContentMessages> = {
  matchingGesture: handleMatchingGesture,
  currentOS: handleCurrentOS,
};

registerHandlers(contentHandlers);
sendBackgroundMessage('OSRequest', true);