import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

const fn: CommandFn = async function (sender, data) {
  if (!sender.tab || !data) return false;
  if (!sender.tab.id) return false;

  const recentlyClosed = (await chrome.sessions.getRecentlyClosed()).filter(
    (s) => "tab" in s,
  );
  if (recentlyClosed.length === 0) return false;

  const dataset = recentlyClosed
    .filter((s) => s.tab?.title != undefined)
    .map((s) => ({
      id: s.tab!.sessionId,
      label: s.tab!.title,
      icon: s.tab!.favIconUrl || null,
    }));

  const popupCreatedSuccessfully = await chrome.tabs.sendMessage(
    sender.tab.id,
    {
      subject: "popupRequest",
      data: {
        mousePositionX: data.mouse.endpoint.x,
        mousePositionY: data.mouse.endpoint.y,
      },
    },
    { frameId: 0 },
  );

  if (!popupCreatedSuccessfully) return false;

  const channel = chrome.tabs.connect(sender.tab.id, {
    name: "popupConnection",
  });

  channel.postMessage(dataset);

  channel.onMessage.addListener((message) => {
    chrome.sessions.restore(message.id);
    channel.disconnect();
  });

  return true;
};

export const PopupRecentlyClosedTabs = defineCommand(fn, {}, "popup", [
  "tabs",
  "sessions",
]);
