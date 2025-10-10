import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

const PageForthFn: CommandFn = async function (sender) {
  if (!sender.tab?.id) return false;
  await chrome.tabs.goForward(sender.tab.id);
  return true;
};

export const PageForth = defineCommand(PageForthFn, {}, "tabs");

const PageBackFn: CommandFn = async function (sender) {
  if (!sender.tab?.id) return false;
  await chrome.tabs.goBack(sender.tab.id);
  return true;
};

export const PageBack = defineCommand(PageBackFn, {}, "tabs");
