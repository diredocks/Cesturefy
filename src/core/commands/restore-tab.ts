import { defineCommand } from "@commands/commands";
import { takeClosedTabWindowByWindowId } from "@utils/closed-tab-windows";
import type { CommandFn } from "@utils/types";

interface RestoreTabSettings {
  currentWindowOnly?: boolean;
}

const fn: CommandFn<RestoreTabSettings> = async function (sender) {
  if (this.getSetting("currentWindowOnly") && sender.tab?.windowId) {
    const target = takeClosedTabWindowByWindowId(sender.tab.windowId);
    if (!target) return false;
    await chrome.sessions.restore(target.sessionId);
    return true;
  }

  await chrome.sessions.restore();
  return true;
};

export const RestoreTab = defineCommand(
  fn,
  {
    currentWindowOnly: false,
  },
  "tabs",
  ["sessions"],
);
