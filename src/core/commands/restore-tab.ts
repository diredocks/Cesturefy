import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";
import { closedTabWindows } from "core/background";

interface RestoreTabSettings {
  currentWindowOnly?: boolean;
}

const fn: CommandFn<RestoreTabSettings> = async function (sender) {
  if (this.getSetting("currentWindowOnly") && sender.tab?.windowId) {
    const targetIndex = closedTabWindows.findIndex(
      (closed) => closed.windowId === sender.tab!.windowId,
    );
    if (targetIndex < 0) return false;
    const [target] = closedTabWindows.splice(targetIndex, 1);
    await chrome.sessions.restore(target.sessionId);
    return true;
  }

  const sessions = await chrome.sessions.getRecentlyClosed();
  const sessionId = sessions[0].tab?.sessionId ?? sessions[0].window?.sessionId;
  if (!sessionId) return false;

  await chrome.sessions.restore(sessionId);
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
