import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

const toRootURLFn: CommandFn = async function (sender) {
  if (!sender.tab || !sender.tab.id) return true;

  const url = new URL(sender.tab.url!);

  if (url.pathname !== "/" || url.search || url.hash) {
    await chrome.tabs.update(sender.tab.id, { url: url.origin });
    // confirm success
    return true;
  }
  return true;
}


const urlLevelUpFn: CommandFn = async function (sender) {
  if (!sender.tab || !sender.tab.id) return true;

  const url = new URL(sender.tab.url!);
  const newPath = url.pathname.replace(/\/([^/]+)\/?$/, '');

  if (newPath !== url.pathname) {
    await chrome.tabs.update(sender.tab.id, { url: url.origin + newPath });
    return true;
  }
  return true;
}

export const ToRootURL = defineCommand(toRootURLFn, {}, 'url');
export const URLLevelUp = defineCommand(urlLevelUpFn, {}, 'url');
