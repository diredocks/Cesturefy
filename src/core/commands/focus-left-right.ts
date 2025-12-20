import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

interface FocusLRSettings {
  excludeDiscarded?: boolean;
  cycling?: boolean;
}

const FocusRightTabFn: CommandFn<FocusLRSettings> = async function (sender) {
  if (!sender.tab?.id) return true;

  const queryInfo: chrome.tabs.QueryInfo = {
    windowId: sender.tab.windowId,
    active: false,
  };

  if (this.getSetting("excludeDiscarded")) queryInfo.discarded = false;

  const tabs = await chrome.tabs.query(queryInfo);

  const maxIndex = Math.max(...tabs.map((t) => t.index));

  let nextIndex: number;
  if (sender.tab.index < maxIndex) {
    nextIndex = sender.tab.index + 1;
  } else if (this.getSetting("cycling") && tabs.length > 0) {
    nextIndex = 0;
  } else {
    return true;
  }

  await chrome.tabs.highlight({
    windowId: sender.tab.windowId,
    tabs: nextIndex,
  });

  return true;
};

const FocusLeftTabFn: CommandFn<FocusLRSettings> = async function (sender) {
  if (!sender.tab?.id) return true;

  const queryInfo: chrome.tabs.QueryInfo = {
    windowId: sender.tab.windowId,
    active: false,
  };

  if (this.getSetting("excludeDiscarded")) queryInfo.discarded = false;

  const tabs = await chrome.tabs.query(queryInfo);

  const maxIndex = Math.max(...tabs.map((t) => t.index));

  let nextIndex: number;
  if (sender.tab.index > 0) {
    nextIndex = sender.tab.index - 1;
  } else if (this.getSetting("cycling") && tabs.length > 0) {
    nextIndex = maxIndex;
  } else {
    return true;
  }

  await chrome.tabs.highlight({
    windowId: sender.tab.windowId,
    tabs: nextIndex,
  });

  return true;
};

export const FocusRightTab = defineCommand(
  FocusRightTabFn,
  {
    excludeDiscarded: false,
    cycling: false,
  },
  "focus",
);

export const FocusLeftTab = defineCommand(
  FocusLeftTabFn,
  {
    excludeDiscarded: false,
    cycling: false,
  },
  "focus",
);
