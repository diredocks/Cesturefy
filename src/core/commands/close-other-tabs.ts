import type { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

const fn: CommandFn = async function (sender) {
  if (!sender.tab?.id) return true;

  const tabs = await chrome.tabs.query({
    windowId: sender.tab.windowId,
    pinned: false,
    active: false,
  });

  if (tabs.length > 0) {
    const tabIds = tabs.map((tab) => tab.id!).filter(Boolean);
    await chrome.tabs.remove(tabIds);
  }

  return true;
};

export const CloseOtherTabs = defineCommand(fn, {}, "tabs");
