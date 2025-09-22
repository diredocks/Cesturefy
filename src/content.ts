import MouseController from "@controller/mouse";
import TraceView from "@views/trace/trace";
import Pattern from "@utils/pattern";
import { Message, BackgroundMessages } from "@utils/messaging";

const pattern = new Pattern(0.12, 10);

main();

// TODO: later for config
async function main() {
  MouseController.enable();
}

MouseController.emitter.addEventListener('start', (es, e) => {
  if (!e) return;

  TraceView.initialize(e.clientX, e.clientY);

  const coalescedEvents = es.flatMap(e => {
    const es = e.getCoalescedEvents();
    // if events is null/undefined or empty (length == 0) return plain event
    return (es?.length > 0) ? es : [e];
  });

  mouseGestureUpdate(coalescedEvents);
});

MouseController.emitter.addEventListener('update', (_es, e) => {
  if (!e) return;

  const coalescedEvents = e.getCoalescedEvents();
  mouseGestureUpdate(coalescedEvents);
});

MouseController.emitter.addEventListener('end', (_es, _e) => {
  TraceView.terminate();
  sendBackgroundMessage('gestureEnd', pattern.getPattern());
});

function mouseGestureUpdate(es: (PointerEvent)[]) {
  for (const e of es) {
    const patternChange = pattern.addPoint(e.clientX, e.clientY);
    if (patternChange) {
      sendBackgroundMessage('gestureChange', pattern.getPattern());
    }
  }

  const points = es.map(e => ({ x: e.clientX, y: e.clientY }));
  TraceView.updateTrace(points);
}

function sendBackgroundMessage<K extends keyof BackgroundMessages>(
  subject: K,
  data: BackgroundMessages[K]
) {
  const msg: Message<K, BackgroundMessages> = { subject, data };
  return chrome.runtime.sendMessage(msg);
}
