import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

const OpenAddonSettingsFn: CommandFn = async function () {
  await chrome.runtime.openOptionsPage();
  return true;
};

const ViewPageSourceCodeFn: CommandFn = async function (sender) {
  if (!sender.tab?.id) return true;

  await chrome.tabs.create({
    active: true,
    index: sender.tab.index + 1,
    url: "view-source:" + sender.tab.url,
  });

  return true;
};

const injectedCode = () => {
  window.print();
};

const OpenPrintPreviewFn: CommandFn = async function (sender) {
  await chrome.scripting.executeScript({
    target: { tabId: sender.tab?.id!, frameIds: [sender.frameId ?? 0] },
    func: injectedCode,
    world: "MAIN",
  });
  return true;
};

export const OpenAddonSettings = defineCommand(OpenAddonSettingsFn, {}, "open");
export const ViewPageSourceCode = defineCommand(
  ViewPageSourceCodeFn,
  {},
  "open",
);
export const OpenPrintPreview = defineCommand(
  OpenPrintPreviewFn,
  {},
  "capture",
  ["scripting"],
);
