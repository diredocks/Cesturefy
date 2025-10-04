import { mouseController } from "@controller/mouse";
import { traceCommand } from "@view/trace-command";
import Pattern from "@utils/pattern";
import {
  Handler, HandlerMap, registerHandlers,
  sendBackgroundMessage, ContentMessages
} from "@utils/message";
import { configManager } from "@model/config-manager";
import { DefaultConfig } from "@model/config";
import { matchesURL } from "@utils/common";
import Context, { MouseData } from "@model/context";
import { rockerController } from "@controller/rocker";

const pattern = new Pattern();
let exclusions: string[] = DefaultConfig.Exclusions;
let displayTrace: boolean = DefaultConfig.Settings.Gesture.Trace.display;
let displayCommand: boolean = DefaultConfig.Settings.Gesture.Command.display;

let contextData: Context;

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
    if (configManager.getPath(['Settings', 'Rocker', 'active'])) {
      rockerController.enable();
    } else {
      rockerController.disable();
    }
  }
}

mouseController.addEventListener('register', (_es, e) => {
  // collect contextual data, run as early as possible
  contextData = Context.fromEvent(e);
});

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

mouseController.addEventListener('end', (_es, e) => {
  traceCommand.terminate(); // safe to call even if its not displayed

  // set last mouse event as endpoint
  contextData.mouse = new MouseData({ x: e.clientX, y: e.clientY });
  sendBackgroundMessage('gestureEnd',
    { vectors: pattern.getPattern(), context: contextData });

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
      sendBackgroundMessage('gestureChange',
        { vectors: pattern.getPattern(), context: contextData });
    }
  }

  if (displayTrace) {
    const points = es.map(e => ({ x: e.clientX, y: e.clientY }));
    traceCommand.updateTrace(points);
  }
}

rockerController.addEventListener('rockerright', () => {
  sendBackgroundMessage('rockerRight', { context: contextData });
});

rockerController.addEventListener('rockerleft', () => {
  sendBackgroundMessage('rockerLeft', { context: contextData });
});

const handleMatchingGesture: Handler<"matchingGesture", ContentMessages> = (m) => {
  traceCommand.updateCommand(m.data);
};

const handleCurrentOS: Handler<"currentOS", ContentMessages> = (m) => {
  mouseController.currentOS = m.data;
};

const handleClipboardWriteText: Handler<"clipboardWriteText", ContentMessages> = async (m) => {
  await navigator.clipboard.writeText(m.data);
};

const handleClipboardReadText: Handler<"clipboardReadText", ContentMessages> = async (_m, _s, callback) => {
  // Handler will call a callback defined BY CALLER
  callback(await navigator.clipboard.readText());
}

const contentHandlers: HandlerMap<ContentMessages> = {
  matchingGesture: handleMatchingGesture,
  currentOS: handleCurrentOS,
  clipboardWriteText: handleClipboardWriteText,
  clipboardReadText: handleClipboardReadText,
};

registerHandlers(contentHandlers);
sendBackgroundMessage('OSRequest', true);
