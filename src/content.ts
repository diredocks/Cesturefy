import MouseController from "@controller/mouse";
import TraceView from "@views/trace/trace";

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
});

function mouseGestureUpdate(es: (PointerEvent)[]) {
  const points = es.map(e => ({ x: e.clientX, y: e.clientY }));
  TraceView.updateTrace(points);
} 
