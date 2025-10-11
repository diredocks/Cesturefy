import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

interface ReloadTabSettings {
  cache?: boolean;
}

const fn: CommandFn<ReloadTabSettings> = async function (sender) {
  if (!sender.tab?.id) return true;

  await chrome.tabs.reload(sender.tab.id, {
    bypassCache: this.getSetting("cache"),
  });

  return true;
};

export const ReloadTab = defineCommand(
  fn,
  {
    cache: false,
  },
  "load",
  ["sessions"],
);
