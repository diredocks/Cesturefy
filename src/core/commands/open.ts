import type { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

interface OpenSettings { }

const OpenAddonSettingsFn: CommandFn<OpenSettings> = async function (sender) {
  await chrome.runtime.openOptionsPage();
  return true;
}

const ViewPageSourceCodeFn: CommandFn<OpenSettings> = async function (sender) {
  if (!sender.tab?.id) return true;

  await chrome.tabs.create({
    active: true,
    index: sender.tab.index + 1,
    url: "view-source:" + sender.tab.url
  });

  return true;
}

export const OpenAddonSettings = defineCommand(OpenAddonSettingsFn, {}, 'open');
export const ViewPageSourceCode = defineCommand(ViewPageSourceCodeFn, {}, 'open');
