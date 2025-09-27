import type { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

const fn: CommandFn = async function (sender) {
  if (!sender.tab?.id) {
    return true;
  }
  await chrome.tabs.goForward(sender.tab.id);
  return true;
};

export const PageForth = defineCommand(fn, {}, "tabs");
