import { CommandMap, CommandName } from "@commands/commands";
import { CommandFn } from "@utils/types";

export interface CommandJSON<TSettings = Record<string, unknown>> {
  name: string;
  settings?: Partial<TSettings>;
}

export default class Command<TSettings = Record<string, unknown>> {
  private _settings: Partial<TSettings> = {};

  constructor(
    public name: string,
    public fn: CommandFn<TSettings>,
    initialSettings?: Partial<TSettings>
  ) {
    if (initialSettings) {
      this._settings = { ...initialSettings };
    }
  }

  getSetting<K extends keyof TSettings>(key: K): TSettings[K] | undefined {
    return this._settings[key];
  }

  setSetting<K extends keyof TSettings>(key: K, value: TSettings[K]): void {
    this._settings[key] = value;
  }

  hasSetting<K extends keyof TSettings>(key: K): boolean {
    return key in this._settings;
  }

  deleteSetting<K extends keyof TSettings>(key: K): void {
    delete this._settings[key];
  }

  hasSettings(): boolean {
    return Object.keys(this._settings).length > 0;
  }

  clearSettings(): void {
    this._settings = {};
  }

  async execute(sender: chrome.runtime.MessageSender, data?: any) {
    return this.fn.call(this, sender, data);
  }

  toJSON(): CommandJSON<TSettings> {
    return { name: this.name, settings: { ...this._settings } };
  }

  static fromJSON<TSettings = Record<string, unknown>>(
    json: CommandJSON<TSettings>
  ): Command<TSettings> {
    const fn = CommandMap[json.name as CommandName];
    if (!fn) throw new Error(`No function found for name "${json.name}"`);
    return new Command<TSettings>(json.name, fn, json.settings);
  }
}
