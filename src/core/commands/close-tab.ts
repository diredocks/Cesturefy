import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

interface CloseTabSettings {
  closePinned?: boolean;
  nextFocus?: "next" | "previous" | "recent" | "default";
}

const fn: CommandFn<CloseTabSettings> = async function (sender) {
  if (!sender.tab || !sender.tab.id) return true;
  const tab = sender.tab;

  if (!this.getSetting("closePinned") && tab.pinned) return true; // skip pinned tab

  const tabs = await chrome.tabs.query({
    windowId: tab.windowId,
    active: false,
  });
  if (tabs.length > 0) {
    let nextTab;

    switch (this.getSetting("nextFocus")) {
      case "next":
        // get closest tab to the right (if not found it will return the closest tab to the left)
        nextTab = tabs.reduce((acc, cur) =>
          (acc.index <= tab.index && cur.index > acc.index) ||
          (cur.index > tab.index && cur.index < acc.index)
            ? cur
            : acc,
        );
        break;
      case "previous":
        // get closest tab to the left (if not found it will return the closest tab to the right)
        nextTab = tabs.reduce((acc, cur) =>
          (acc.index >= tab.index && cur.index < acc.index) ||
          (cur.index < tab.index && cur.index > acc.index)
            ? cur
            : acc,
        );
        break;
      case "recent":
        // get the previous tab
        const withAccessed = tabs.filter((t) => t.lastAccessed !== undefined);
        nextTab = withAccessed.reduce((acc, cur) =>
          acc.lastAccessed! > cur.lastAccessed! ? acc : cur,
        );
        break;
      case "default":
      default:
        nextTab = null;
        break;
    }

    if (nextTab) await chrome.tabs.update(nextTab.id, { active: true });
  }

  await chrome.tabs.remove(sender.tab.id);
  return true;
};

export const CloseTab = defineCommand(
  fn,
  {
    closePinned: false,
    nextFocus: "default",
  },
  "tabs",
);
