import { ConfigSchema, DefaultConfig } from "@model/config";
import { EventEmitter } from "@utils/emitter";

export type ConfigEvents = Record<string, (...args: any[]) => void> & {
  change: (changes: Partial<ConfigSchema>) => void;
  loaded: () => void;
  reset: () => void;
};

type Path<T> = T extends object
  ? {
    [K in keyof T]: [K] | [K, ...Path<T[K]>];
  }[keyof T]
  : [];

type PathValue<T, P extends any[]> =
  P extends [infer K, ...infer Rest]
  ? K extends keyof T
  ? Rest extends []
  ? T[K]
  : PathValue<T[K], Rest>
  : never
  : T;

type StorageArea = "local" | "sync";

export class ConfigManager {
  private static _instance: ConfigManager;

  private _storageArea: StorageArea;
  private _storage: Partial<ConfigSchema>;
  private _defaults: ConfigSchema;
  private _autoUpdate = true;
  private _loaded: Promise<void>;
  private _events = new EventEmitter<ConfigEvents>();

  constructor(storageArea: StorageArea, defaults: ConfigSchema) {
    if (storageArea !== "local" && storageArea !== "sync") {
      throw new Error('Storage area must be "local" or "sync".');
    }

    this._storageArea = storageArea;
    this._storage = {};
    this._defaults = defaults;

    const loadStorage = chrome.storage[this._storageArea].get();
    this._loaded = loadStorage.then((values) => {
      this._storage = { ...values } as ConfigSchema;
      this._events.dispatchEvent("loaded");
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== this._storageArea) return;
      const newValues: Partial<ConfigSchema> = {};
      for (const key in changes) {
        newValues[key as keyof ConfigSchema] = changes[key].newValue;
      }
      if (this._autoUpdate) {
        this._storage = { ...this._storage, ...newValues };
      }
      this._events.dispatchEvent("change", newValues);
    });
  }

  public static get instance(): ConfigManager {
    if (!this._instance) {
      this._instance = new ConfigManager("local", DefaultConfig);
    }
    return this._instance;
  }

  addEventListener<K extends keyof ConfigEvents>(event: K, callback: ConfigEvents[K]) {
    this._events.addEventListener(event, callback);
  }

  removeEventListener<K extends keyof ConfigEvents>(event: K, callback: ConfigEvents[K]) {
    this._events.removeEventListener(event, callback);
  }

  get loaded() {
    return this._loaded;
  }

  get autoUpdate() {
    return this._autoUpdate;
  }

  set autoUpdate(value: boolean) {
    this._autoUpdate = value;
  }

  get(path: string): any {
    const res = this.getPath(path.split(".") as any);
    if (res === undefined) throw Error(`Config path "${path}" not found`);
    else return res;
  }

  set(path: string, value: any): Promise<void> {
    const res = this.getPath(path.split(".") as any);
    if (res === undefined) throw Error(`Config path "${path}" not found`);
    return this.setPath(path.split(".") as any, value);
  }

  getPath<P extends Path<ConfigSchema>>(path: P): PathValue<ConfigSchema, P> {
    // FIXME: Nested properties may be missing when accessing an object path
    let entry: any = this._storage;
    let fallback: any = this._defaults;
    for (const key of path) {
      //  FIXME: Default gestures shouldn't be all-or-none
      entry = entry?.[key];
      fallback = fallback?.[key];
    }
    return (entry !== undefined ? entry : fallback) as PathValue<ConfigSchema, P>;
  }

  async setPath<P extends Path<ConfigSchema>>(path: P, value: PathValue<ConfigSchema, P>): Promise<void> {
    let entry: any = this._storage;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (!(key in entry)) entry[key] = {};
      // FIXME: constrain type same as default settings' type
      entry = entry[key];
    }
    entry[path[path.length - 1]] = value;

    return chrome.storage[this._storageArea].set(this._storage);
  }

  clear(): Promise<void> {
    this._storage = { ...this._defaults };
    this._events.dispatchEvent("reset");
    return chrome.storage[this._storageArea].clear();
  }

  toJSON(): Partial<ConfigSchema> {
    return { ...this._storage };
  }

  async fromJSON(json: Partial<ConfigSchema>, persist: boolean = true): Promise<void> {
    this._storage = { ...json };
    if (persist) {
      await chrome.storage[this._storageArea].set(this._storage);
    }
    this._events.dispatchEvent("change", json);
  }
}

export const configManager = ConfigManager.instance;
