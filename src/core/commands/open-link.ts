import type { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

interface OpenLinkSettings { };

const OpenLinkFn: CommandFn<OpenLinkSettings> = async function (sender, data) {
  if (!(data?.link?.href)) return false;

  let url = data.link.href;
  await chrome.tabs.update(sender.tab!.id, { url });

  return true;
};

interface OpenLinkNewTabSettings {
  position?: "before" | "after" | "start" | "end";
  focus?: boolean;
}

const OpenLinkNewTabFn: CommandFn<OpenLinkNewTabSettings> = async function (sender, data) {
  if (!(data?.link?.href)) return false;

  let url = data.link.href;
  let index: number | undefined;

  switch (this.getSetting("position")) {
    case "before":
      index = sender.tab!.index;
      break;
    case "after":
      index = sender.tab!.index + 1;
      break;
    case "start":
      index = 0;
      break;
    case "end":
      index = 999;
      break;
    default:
      index = undefined;
  }

  await chrome.tabs.create({
    url,
    active: this.getSetting("focus"),
    index,
  });

  return true;
};

const OpenLinkInNewWindowFn: CommandFn<OpenLinkSettings> = async function (_sender, data) {
  if (!(data?.link?.href)) return false;

  let url = data.link.href;
  await chrome.windows.create({ url });

  return true;
};

export const OpenLink = defineCommand(OpenLinkFn, {}, 'link');
export const OpenLinkInNewTab = defineCommand(OpenLinkNewTabFn,
  {
    position: 'after',
    focus: true
  }, 'link');
export const OpenLinkInNewWindow = defineCommand(OpenLinkInNewWindowFn, {}, 'link');

