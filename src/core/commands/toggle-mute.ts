import type { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

const fn: CommandFn = async function (sender) {
  if (!sender.tab?.id) {
    return true;
  }
  await chrome.tabs.update(sender.tab.id, { muted: !sender.tab.mutedInfo?.muted });
  return true;
};

export const ToggleMute = defineCommand(fn, {}, "toggle");
