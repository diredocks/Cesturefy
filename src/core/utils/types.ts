import type Command from "@model/command";
import Context from "@model/context";

export interface Point {
  x: number;
  y: number;
}
export type Points = Point[];

export type Vector = [number, number];
export type Vectors = Vector[] | number[][];

export type CommandFn<TSettings = Record<string, unknown>> = (
  this: Command<TSettings>,
  sender: chrome.runtime.MessageSender,
  data?: Context
) => Promise<boolean>;

export type CommandGroup = 'tabs' | 'load' | 'zoom' | 'history' | 'toggle' | 'scroll' | 'focus' | 'window' | 'move' | 'url' | 'image' | 'link' | 'selection' | 'window.controls' | 'clipboard' | 'input' | 'listen' | 'capture' | 'popup' | 'advanced' | 'open';

export type CommandPermission = Extract<
  chrome.runtime.ManifestPermissions,
  'tabs' | 'sessions' | 'bookmarks' | 'scripting' | 'activeTab' | 'clipboardWrite' | 'clipboardRead' | 'search' | 'downloads'
>;

export interface CommandDefinition<TSettings> {
  fn: CommandFn<TSettings>;
  defaults: Required<TSettings>; // TODO: optional maybe?
  group: CommandGroup;
  permissions?: CommandPermission[];
}

export type RGBA = [number, number, number, number];
export type RGB = [number, number, number];

export type SuppressionKey = 'altKey' | 'ctrlKey' | 'shiftKey' | 'none';

export enum MouseButton {
  LEFT = 1,
  RIGHT = 2,
  MIDDLE = 4,
}
