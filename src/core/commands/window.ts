import type { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

interface WindowSettings { }

const maximizeWindowFn: CommandFn<WindowSettings> = async function (sender) {
  if (!sender.tab || !sender.tab.windowId) return true;
  const window = await chrome.windows.get(sender.tab.windowId);
  if (window.state !== "maximized") {
    await chrome.windows.update(sender.tab.windowId, { state: "maximized" });
  }
  return true;
};


const minimizeWindowFn: CommandFn<WindowSettings> = async function (sender) {
  if (!sender.tab || !sender.tab.windowId) return true;
  await chrome.windows.update(sender.tab.windowId, { state: "minimized" });
  return true;
};

const toggleWindowSizeFn: CommandFn<WindowSettings> = async function (sender) {
  if (!sender.tab || !sender.tab.windowId) return true;
  const window = await chrome.windows.get(sender.tab.windowId);
  await chrome.windows.update(sender.tab.windowId, {
    state: window.state === "maximized" ? "normal" : "maximized",
  });
  return true;
};

const toggleFullscreenFn: CommandFn<WindowSettings> = async function (sender) {
  if (!sender.tab || !sender.tab.windowId) return true;
  const window = await chrome.windows.get(sender.tab.windowId);
  await chrome.windows.update(sender.tab.windowId, {
    state: window.state === "fullscreen" ? "maximized" : "fullscreen",
  });
  return true;
};

const enterFullscreenFn: CommandFn<WindowSettings> = async function (sender) {
  if (!sender.tab || !sender.tab.windowId) return true;
  const window = await chrome.windows.get(sender.tab.windowId);
  if (window.state !== "fullscreen") {
    await chrome.windows.update(sender.tab.windowId, { state: "fullscreen" });
  }
  return true;
};

const newWindowFn: CommandFn<WindowSettings> = async function () {
  await chrome.windows.create({});
  return true;
};


const closeWindowFn: CommandFn<WindowSettings> = async function (sender) {
  if (!sender.tab || !sender.tab.windowId) return true;
  await chrome.windows.remove(sender.tab.windowId);
  return true;
};

export const NewWindow = defineCommand(newWindowFn, {}, "window");
export const CloseWindow = defineCommand(closeWindowFn, {}, "window.controls");
export const EnterFullscreen = defineCommand(enterFullscreenFn, {}, "window.controls");
export const ToggleFullscreen = defineCommand(toggleFullscreenFn, {}, "toggle");
export const ToggleWindowSize = defineCommand(toggleWindowSizeFn, {}, "toggle");
export const MaximizeWindow = defineCommand(maximizeWindowFn, {}, "window.controls");
export const MinimizeWindow = defineCommand(minimizeWindowFn, {}, "window.controls");


