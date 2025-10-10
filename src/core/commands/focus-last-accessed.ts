import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

const FocusPreviousSelectedTabFn: CommandFn = async function (sender) {
  if (!sender.tab?.id) return true;

  const tabs = await chrome.tabs.query({
    windowId: sender.tab.windowId,
    active: false,
  });

  if (tabs.length > 0) {
    const lastAccessedTab = tabs.reduce((acc, cur) => (acc.lastAccessed! > cur.lastAccessed! ? acc! : cur!));
    await chrome.tabs.update(lastAccessedTab.id!, { active: true });
  }

  return true;
};

export const FocusPreviousSelectedTab = defineCommand(FocusPreviousSelectedTabFn, {}, 'focus');
