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

  let nextTab = tabs.reduce((acc, cur) => {
    if (acc.index <= sender.tab!.index && cur.index > acc.index) return cur;
    if (cur.index > sender.tab!.index && cur.index < acc.index) return cur;
    return acc;
  }, tabs[0]);

  if (
    !tabs.some((t) => t.index > sender.tab!.index) &&
    this.getSetting("cycling") &&
    tabs.length > 0
  ) {
    nextTab = tabs.reduce((acc, cur) => (acc.index < cur.index ? acc : cur));
  }

  if (nextTab) await chrome.tabs.update(nextTab.id!, { active: true });
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

  let nextTab = tabs.reduce((acc, cur) => {
    if (acc.index >= sender.tab!.index && cur.index < acc.index) return cur;
    if (cur.index < sender.tab!.index && cur.index > acc.index) return cur;
    return acc;
  }, tabs[0]);

  if (
    !tabs.some((t) => t.index < sender.tab!.index) &&
    this.getSetting("cycling") &&
    tabs.length > 0
  ) {
    nextTab = tabs.reduce((acc, cur) => (acc.index > cur.index ? acc : cur));
  }

  if (nextTab) await chrome.tabs.update(nextTab.id!, { active: true });
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
