import type Command from "@model/command";

export interface Point {
  x: number;
  y: number;
}

export type Vector = [number, number];
export type Vectors = Vector[] | number[][];

export type CommandFn<TSettings = Record<string, unknown>> = (
  this: Command<TSettings>,
  sender: chrome.runtime.MessageSender,
  data?: any
) => Promise<boolean | null>;
