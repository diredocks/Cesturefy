import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

interface UnloadTabSettings {
  nextFocus?: "next" | "previous" | "recent" | "default";
}

const fn: CommandFn<UnloadTabSettings> = async function (sender) {
  if (!sender.tab || !sender.tab.id) return true;
  const tab = sender.tab;

  const tabs = await chrome.tabs.query({
    windowId: tab.windowId,
    active: false,
  });

  if (tabs.length > 0) {
    let nextTab;

    switch (this.getSetting("nextFocus")) {
      case "default":
      default:
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
      case "recent": {
        // get the previous tab
        const withAccessed = tabs.filter((t) => t.lastAccessed !== undefined);
        nextTab = withAccessed.reduce((acc, cur) =>
          acc.lastAccessed! > cur.lastAccessed! ? acc : cur,
        );
        break;
      }
    }

    if (nextTab) {
      await chrome.tabs.update(nextTab.id, { active: true });
      // we can't discard the only tab
      await chrome.tabs.discard(tab.id);
      return true;
    }
  }

  return false;
};

export const UnloadTab = defineCommand(fn, { nextFocus: "default" }, "tabs");
