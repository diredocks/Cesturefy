import type { CommandFn } from "@utils/types";

import { NewTab, NewTabDefaults } from "@commands/new-tab";
import { DuplicateTab, DuplicateTabDefaults } from "@commands/duplicate-tab";
import { CloseTab, CloseTabDefaults } from "@commands/close-tab";

export const commands = {
  NewTab,
  DuplicateTab,
  CloseTab,
} as const;

// TODO: MAKE IT DRY
// NOTE: make sure all fn has default value
export const commandDefaults = {
  NewTab: NewTabDefaults,
  DuplicateTab: DuplicateTabDefaults,
  CloseTab: CloseTabDefaults,
} as const;

export type CommandName = keyof typeof commands;
export const CommandMap: Record<CommandName, CommandFn<any>> = commands;
