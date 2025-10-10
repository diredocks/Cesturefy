import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

const CloseLeftTabsFn: CommandFn = async function (sender) {
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

export const CloseLeftTabs = defineCommand(CloseLeftTabsFn, {}, "tabs");

const CloseRightTabsFn: CommandFn = async function (sender) {
  if (!sender.tab?.id || sender.tab.index === undefined) return true;

  const tabs = await chrome.tabs.query({
    windowId: sender.tab.windowId,
    pinned: false,
  });

  const toClose = tabs.filter((tab) => tab.index > sender.tab!.index);
  if (toClose.length > 0) {
    const tabIds = toClose.map((tab) => tab.id!).filter(Boolean);
    await chrome.tabs.remove(tabIds);
  }

  return true;
};

export const CloseRightTabs = defineCommand(CloseRightTabsFn, {}, "tabs");

const CloseOtherTabsFn: CommandFn = async function (sender) {
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

export const CloseOtherTabs = defineCommand(CloseOtherTabsFn, {}, "tabs");
