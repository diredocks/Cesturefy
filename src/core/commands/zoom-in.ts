import type { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

interface ZoomInSettings {
  step?: number | string;
}

const fn: CommandFn<ZoomInSettings> = async function (sender) {
  if (!sender.tab?.id) {
    return true;
  }

  const zoomSetting = this.getSetting("step");
  const zoomStep = Number(zoomSetting);

  let zoomLevels = [0.3, 0.5, 0.67, 0.8, 0.9, 1, 1.1, 1.2, 1.33, 1.5, 1.7, 2, 2.4, 3];
  let maxZoom = 3;
  let newZoom: number;

  if (!zoomStep && typeof zoomSetting === "string" && zoomSetting.includes(",")) {
    zoomLevels = zoomSetting.split(",").map(z => parseFloat(z) / 100);
    maxZoom = Math.min(Math.max(...zoomLevels), maxZoom);
  }

  const currentZoom = await chrome.tabs.getZoom(sender.tab.id);

  if (zoomStep) {
    newZoom = Math.min(maxZoom, currentZoom + zoomStep / 100);
  } else {
    newZoom = zoomLevels.reduce((acc, cur) => cur > currentZoom && cur < acc ? cur : acc, maxZoom);
  }

  if (newZoom > currentZoom) {
    await chrome.tabs.setZoom(sender.tab.id, newZoom);
    return true;
  }

  return true;
};

export const ZoomIn = defineCommand(fn, { step: 0 }, "zoom");
