import { CommandName, commands } from "@commands/index";
import { CommandFn, CommandGroup, CommandPermission } from "@utils/types";
import Context from "@model/context";

export interface CommandJSON<TSettings = Record<string, unknown>> {
  name: string;
  settings?: Partial<TSettings>;
}

export default class Command<TSettings = Record<string, unknown>> {
  private _settings: Partial<TSettings> = {};
  private _defaults: TSettings;
  private _name: string;
  private _group: CommandGroup;
  private _fn: CommandFn;
  private _permissions?: CommandPermission[];

  constructor(
    name: string,
    group: CommandGroup,
    fn: CommandFn<any>,
    defaults: TSettings,
    initialSettings?: Partial<TSettings>,
    permissions?: CommandPermission[],
  ) {
    if (initialSettings) this._settings = { ...initialSettings };
    this._defaults = { ...defaults };
    this._name = name;
    this._group = group;
    this._fn = fn;
    this._permissions = permissions;
  }

  toString() {
    return chrome.i18n.getMessage(`commandLabel${this.getName()}`);
  }

  getGroup() {
    return this._group;
  }

  getPermissions() {
    return this._permissions;
  }

  getName() {
    return this._name;
  }

  setName(value: string) {
    this._name = value;
  }

  getSetting<K extends keyof TSettings>(key: K): TSettings[K] {
    return this._settings[key] ?? this._defaults[key]; // default must exists
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

  async execute(sender: chrome.runtime.MessageSender, data?: Context) {
    // TODO: request permissions here?
    return this._fn.call(this, sender, data);
  }

  toJSON(): CommandJSON<TSettings> {
    return { name: this.getName(), settings: { ...this._settings } };
  }

  static fromJSON(json: CommandJSON) {
    const def = commands[json.name as CommandName];
    if (!def) throw new Error(`Command not found: ${json.name}`);

    return new Command<typeof def.defaults>(
      json.name as CommandName,
      def.group,
      def.fn,
      def.defaults,
      json.settings,
      def.permissions,
    );
  }
}
