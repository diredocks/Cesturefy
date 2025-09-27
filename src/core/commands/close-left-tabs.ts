import type { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

const fn: CommandFn = async function (sender) {
  if (!sender.tab?.id || sender.tab.index === undefined) return true;

  const tabs = await chrome.tabs.query({
    windowId: sender.tab.windowId,
    pinned: false,
  });

  const toClose = tabs.filter((tab) => tab.index < sender.tab!.index);
  if (toClose.length > 0) {
    const tabIds = toClose.map((tab) => tab.id!).filter(Boolean);
    await chrome.tabs.remove(tabIds);
  }

  return true;
};

export const CloseLeftTabs = defineCommand(fn, {}, "tabs");
