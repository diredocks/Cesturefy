import { mouseController } from "@controller/mouse";
import { traceCommand } from "@view/trace-command";
import Pattern from "@utils/pattern";
import {
  Handler, HandlerMap, registerHandlers,
  sendBackgroundMessage, ContentMessages
} from "@utils/message";

const pattern = new Pattern(0.12, 10);

main();

// TODO: later for config
async function main() {
  mouseController.enable();
}

mouseController.addEventListener('start', (es, e) => {
  if (!e) return;

  traceCommand.initialize(e.clientX, e.clientY);

  const coalescedEvents = es.flatMap(e => {
    const es = e.getCoalescedEvents();
    // if events is null/undefined or empty (length == 0) return plain event
    return (es?.length > 0) ? es : [e];
  });

  mouseGestureUpdate(coalescedEvents);
});

mouseController.addEventListener('update', (_es, e) => {
  if (!e) return;

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
    if (patternChange) {
      sendBackgroundMessage('gestureChange', pattern.getPattern());
    }
  }

  const points = es.map(e => ({ x: e.clientX, y: e.clientY }));
  traceCommand.updateTrace(points);
}

const handleMatchingGesture: Handler<"matchingGesture", ContentMessages> = (m) => {
  traceCommand.updateCommand(m.data);
};

const contentHandlers: HandlerMap<ContentMessages> = {
  matchingGesture: handleMatchingGesture,
};

registerHandlers(contentHandlers);
