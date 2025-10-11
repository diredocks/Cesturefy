import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

interface ReloadAllTabsSettings {
  cache?: boolean;
}

const fn: CommandFn<ReloadAllTabsSettings> = async function (sender) {
  if (!sender.tab?.windowId) return false;

  const tabs = await chrome.tabs.query({
    windowId: sender.tab.windowId,
  });

  await Promise.all(
    tabs.map((tab) =>
      tab.id
        ? chrome.tabs.reload(tab.id, {
            bypassCache: this.getSetting("cache"),
          })
        : Promise.resolve(),
    ),
  );

  return true;
};

export const ReloadAllTabs = defineCommand(fn, { cache: false }, "load");
