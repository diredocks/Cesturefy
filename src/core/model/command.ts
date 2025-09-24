import { commandDefaults, CommandMap, CommandName } from "@commands/commands";
import { CommandFn } from "@utils/types";

export interface CommandJSON<TSettings = Record<string, unknown>> {
  name: string;
  settings?: Partial<TSettings>;
}

export default class Command<TSettings = Record<string, unknown>> {
  private _settings: Partial<TSettings> = {};
  private _defaults: TSettings;
  private _name: string;

  constructor(
    name: string,
    public fn: CommandFn<TSettings>,
    defaults: TSettings,
    initialSettings?: Partial<TSettings>,
  ) {
    if (initialSettings) this._settings = { ...initialSettings };
    this._defaults = { ...defaults };
    this._name = name;
  }

  toString() {
    return chrome.i18n.getMessage(`commandLabel${this.getName()}`)
  }

  getName() {
    return this._name;
  }

  setName(value: string) {
    this._name = value;
  }

  getSetting<K extends keyof TSettings>(key: K): TSettings[K] {
    return this._settings[key] ?? this._defaults[key] // default must exists
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
    return { name: this.getName(), settings: { ...this._settings } };
  }

  static fromJSON<TSettings = Record<string, unknown>>(
    json: CommandJSON<TSettings>
  ): Command<TSettings> {
    const fn = CommandMap[json.name as CommandName];
    if (!fn) throw new Error(`No function found for name "${json.name}"`);

    const defaults = commandDefaults[json.name as CommandName] as TSettings;
    if (!defaults) throw new Error(`No default settings found for command "${json.name}"`);

    return new Command<TSettings>(json.name, fn, defaults, json.settings);
  }
}
