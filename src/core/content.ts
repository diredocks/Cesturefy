import { mouseController } from "@controller/mouse";
import TraceCommandView from "@view/trace-command/trace-command";
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

  TraceCommandView.initialize(e.clientX, e.clientY);

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
  TraceCommandView.terminate();
  sendBackgroundMessage('gestureEnd', pattern.getPattern());
  pattern.clear();
});

mouseController.addEventListener('abort', (_es) => {
  TraceCommandView.terminate();
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
  TraceCommandView.updateTrace(points);
}

const handleMatchingGesture: Handler<"matchingGesture", ContentMessages> = (m) => {
  TraceCommandView.updateCommand(m.data);
};

const contentHandlers: HandlerMap<ContentMessages> = {
  matchingGesture: handleMatchingGesture,
};

registerHandlers(contentHandlers);
