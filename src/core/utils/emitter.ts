export class EventEmitter<
  Events extends Record<string, (...args: any[]) => void>,
> {
  private events: { [K in keyof Events]?: Set<Events[K]> } = {};

  addEventListener<K extends keyof Events>(eventName: K, callback: Events[K]) {
    (this.events[eventName] ??= new Set()).add(callback);
  }

  removeEventListener<K extends keyof Events>(
    eventName: K,
    callback: Events[K],
  ) {
    this.events[eventName]?.delete(callback);
  }

  dispatchEvent<K extends keyof Events>(
    eventName: K,
    ...args: Parameters<Events[K]>
  ) {
    this.events[eventName]?.forEach((cb) => cb(...args));
  }
}
