import MouseController from "@controller/mouse";
import TraceView from "@views/trace/trace";

main();

// TODO: later for config
async function main() {
  MouseController.enable();
}

MouseController.emitter.addEventListener('start', (e, es) => {
  TraceView.initialize(e.clientX, e.clientY);

  const coalescedEvents = es.flatMap(e => {
    const es = e.getCoalescedEvents();
    // if events is null/undefined or empty (length == 0) return plain event
    return (es?.length > 0) ? es : [e];
  });

  mouseGestureUpdate(coalescedEvents);
});

MouseController.emitter.addEventListener('update', (e, _es) => {
  const coalescedEvents = e.getCoalescedEvents();
  mouseGestureUpdate(coalescedEvents);
});

MouseController.emitter.addEventListener('end', (_e, _es) => {
  TraceView.terminate();
});

function mouseGestureUpdate(es: (PointerEvent)[]) {
  const points = es.map(e => ({ x: e.clientX, y: e.clientY }));
  TraceView.updateTrace(points);
} 
