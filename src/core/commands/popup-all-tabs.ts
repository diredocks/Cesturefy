// FIXME: icon of internal page is broken, fallback needed
import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

interface PopupAllTabsSettings {
  excludeDiscarded?: boolean;
  order?: 'lastAccessedAsc' | 'lastAccessedDesc' | 'alphabeticalAsc' | 'alphabeticalDesc' | 'none';
}

const fn: CommandFn<PopupAllTabsSettings> = async function (sender, data) {
  if (!sender.tab || !data) return false;
  if (!sender.tab.id) return false;

  const tabs = await chrome.tabs.query({
    windowId: sender.tab.windowId,
    discarded: this.getSetting("excludeDiscarded"),
  });
  if (tabs.length === 0) return false;

  switch (this.getSetting("order")) {
    case "lastAccessedAsc":
      tabs.sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0));
      break;
    case "lastAccessedDesc":
      tabs.sort((a, b) => (a.lastAccessed ?? 0) - (b.lastAccessed ?? 0));
      break;
    case "alphabeticalAsc":
      tabs.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      break;
    case "alphabeticalDesc":
      tabs.sort((a, b) => -(a.title || "").localeCompare(b.title || ""));
      break;
  }

  const dataset = tabs
    .filter(tab => tab.title != undefined) // filter out internal pages
    .map(tab => ({
      id: tab.id,
      label: tab.title,
      icon: tab.favIconUrl || null,
    }));

  const popupCreatedSuccessfully = await chrome.tabs.sendMessage(sender.tab.id, {
    subject: "popupRequest",
    data: {
      mousePositionX: data.mouse.endpoint.x,
      mousePositionY: data.mouse.endpoint.y
    },
  }, { frameId: 0 });

  // if popup creation failed exit this command function
  if (!popupCreatedSuccessfully) return false;

  const channel = chrome.tabs.connect(sender.tab.id, {
    name: "popupConnection"
  });

  channel.postMessage(dataset);

  channel.onMessage.addListener((message) => {
    chrome.tabs.update(Number(message.id), { active: true });
    // immediately disconnect the channel since keeping the popup open doesn't make sense
    channel.disconnect();
  });

  return true;
}

export const PopupAllTabs = defineCommand(fn, {
  excludeDiscarded: false,
  order: "none",
}, 'popup', ['tabs']);
