import mouseController from "./controller/mouse";

main();

// TODO: later for config
async function main() {
  mouseController.enable();
  mouseController.emitter.addEventListener('update', (e, _) => { console.log(e.clientX, e.clientY); });
}
