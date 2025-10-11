import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

interface RestoreTabSettings {
  currentWindowOnly?: boolean;
}

const fn: CommandFn<RestoreTabSettings> = async function (sender) {
  let sessions = await chrome.sessions.getRecentlyClosed();

  if (this.getSetting("currentWindowOnly") && sender.tab?.windowId) {
    sessions = sessions.filter(
      (s) => s.tab && s.tab.windowId === sender.tab!.windowId
    );
  }

  if (sessions.length > 0) {
    const mostRecent = sessions.reduce((prev, cur) =>
      prev.lastModified && cur.lastModified && prev.lastModified > cur.lastModified
        ? prev
        : cur
    );

    const sessionId =
      mostRecent.tab?.sessionId ?? mostRecent.window?.sessionId;
    if (sessionId) {
      await chrome.sessions.restore(sessionId);
    }
  }

  return true;
};

export const RestoreTab = defineCommand(
  fn,
  {
    currentWindowOnly: false,
  },
  "tabs",
  ["sessions"]
);
