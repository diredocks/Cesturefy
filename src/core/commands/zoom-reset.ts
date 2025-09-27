import type { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

const fn: CommandFn = async function (sender) {
  if (!sender.tab?.id) {
    return true;
  }

  const [currentZoom, zoomSettings] = await Promise.all([
    chrome.tabs.getZoom(sender.tab.id),
    chrome.tabs.getZoomSettings(sender.tab.id)
  ]);

  if (zoomSettings.defaultZoomFactor && currentZoom !== zoomSettings.defaultZoomFactor) {
    await chrome.tabs.setZoom(sender.tab.id, zoomSettings.defaultZoomFactor);
    return true;
  }

  return true;
};

export const ZoomReset = defineCommand(fn, {}, "zoom");
