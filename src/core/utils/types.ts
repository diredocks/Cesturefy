import type Command from "@model/command";

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
  data?: any
) => Promise<boolean | null>;

export type CommandGroup = 'tabs' | 'load' | 'zoom' | 'history' | 'toggle' | 'scroll' | 'focus' | 'window' | 'move' | 'url' | 'image' | 'link' | 'selection' | 'window.controls' | 'clipboard' | 'input' | 'listen' | 'capture' | 'popup' | 'advanced';

export interface CommandDefinition<TSettings> {
  fn: CommandFn<TSettings>;
  defaults: Required<TSettings>;
  group: CommandGroup;
}
