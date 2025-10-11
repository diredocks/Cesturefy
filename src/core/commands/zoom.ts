import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

interface ZoomSettings {
  step?: number | string;
}

const ZoomInFn: CommandFn<ZoomSettings> = async function (sender) {
  if (!sender.tab?.id) {
    return true;
  }

  const zoomSetting = this.getSetting("step");
  const zoomStep = Number(zoomSetting);

  let zoomLevels = [
    0.3, 0.5, 0.67, 0.8, 0.9, 1, 1.1, 1.2, 1.33, 1.5, 1.7, 2, 2.4, 3,
  ];
  let maxZoom = 3;
  let newZoom: number;

  if (
    !zoomStep &&
    typeof zoomSetting === "string" &&
    zoomSetting.includes(",")
  ) {
    zoomLevels = zoomSetting.split(",").map((z) => parseFloat(z) / 100);
    maxZoom = Math.min(Math.max(...zoomLevels), maxZoom);
  }

  const currentZoom = await chrome.tabs.getZoom(sender.tab.id);

  if (zoomStep) {
    newZoom = Math.min(maxZoom, currentZoom + zoomStep / 100);
  } else {
    newZoom = zoomLevels.reduce(
      (acc, cur) => (cur > currentZoom && cur < acc ? cur : acc),
      maxZoom,
    );
  }

  if (newZoom > currentZoom) {
    await chrome.tabs.setZoom(sender.tab.id, newZoom);
    return true;
  }

  return true;
};

export const ZoomIn = defineCommand(ZoomInFn, { step: 0 }, "zoom");

const ZoomOutFn: CommandFn<ZoomSettings> = async function (sender) {
  if (!sender.tab?.id) {
    return true;
  }

  const zoomSetting = this.getSetting("step");
  const zoomStep = Number(zoomSetting);

  let zoomLevels = [
    3, 2.4, 2, 1.7, 1.5, 1.33, 1.2, 1.1, 1, 0.9, 0.8, 0.67, 0.5, 0.3,
  ];
  let minZoom = 0.3;
  let newZoom: number;

  if (
    !zoomStep &&
    typeof zoomSetting === "string" &&
    zoomSetting.includes(",")
  ) {
    zoomLevels = zoomSetting.split(",").map((z) => parseFloat(z) / 100);
    minZoom = Math.max(Math.min(...zoomLevels), minZoom);
  }

  const currentZoom = await chrome.tabs.getZoom(sender.tab.id);

  if (zoomStep) {
    newZoom = Math.max(minZoom, currentZoom - zoomStep / 100);
  } else {
    newZoom = zoomLevels.reduce(
      (acc, cur) => (cur < currentZoom && cur > acc ? cur : acc),
      minZoom,
    );
  }

  if (newZoom < currentZoom) {
    await chrome.tabs.setZoom(sender.tab.id, newZoom);
    return true;
  }

  return true;
};

export const ZoomOut = defineCommand(ZoomOutFn, { step: 0 }, "zoom");

const ZoomResetFn: CommandFn = async function (sender) {
  if (!sender.tab?.id) {
    return true;
  }

  const [currentZoom, zoomSettings] = await Promise.all([
    chrome.tabs.getZoom(sender.tab.id),
    chrome.tabs.getZoomSettings(sender.tab.id),
  ]);

  if (
    zoomSettings.defaultZoomFactor &&
    currentZoom !== zoomSettings.defaultZoomFactor
  ) {
    await chrome.tabs.setZoom(sender.tab.id, zoomSettings.defaultZoomFactor);
    return true;
  }

  return true;
};

export const ZoomReset = defineCommand(ZoomResetFn, {}, "zoom");
