import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

interface FocusFSettings {
  includePinned?: boolean;
}

interface FocusLSettings {}

const FocusFirstTabFn: CommandFn<FocusFSettings> = async function (sender) {
  if (!sender.tab?.id) return true;

  const queryInfo: chrome.tabs.QueryInfo = {
    windowId: sender.tab.windowId,
    active: false,
  };

  if (!this.getSetting("includePinned")) queryInfo.pinned = false;

  const tabs = await chrome.tabs.query(queryInfo);

  if (tabs.some((cur) => cur.index < sender.tab!.index)) {
    const firstTab = tabs.reduce((acc, cur) =>
      acc.index < cur.index ? acc : cur,
    );
    await chrome.tabs.update(firstTab.id!, { active: true });
  }

  return true;
};

const FocusLastTabFn: CommandFn<FocusLSettings> = async function (sender) {
  if (!sender.tab?.id) return true;

  const tabs = await chrome.tabs.query({
    windowId: sender.tab.windowId,
    active: false,
  });

  if (tabs.some((cur) => cur.index > sender.tab!.index)) {
    const lastTab = tabs.reduce((acc, cur) =>
      acc.index > cur.index ? acc : cur,
    );
    await chrome.tabs.update(lastTab.id!, { active: true });
  }

  return true;
};

export const FocusFirstTab = defineCommand(
  FocusFirstTabFn,
  {
    includePinned: false,
  },
  "focus",
);
export const FocusLastTab = defineCommand(FocusLastTabFn, {}, "focus");
