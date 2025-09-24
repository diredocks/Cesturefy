import { NewTab } from "@commands/new-tab";
import { DuplicateTab } from "@commands/duplicate-tab";
import { CloseTab } from "@commands/close-tab";

export const commands = {
  NewTab,
  DuplicateTab,
  CloseTab,
} as const;

export type CommandName = keyof typeof commands;
