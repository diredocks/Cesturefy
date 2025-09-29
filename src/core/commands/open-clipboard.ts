// NOTE: The clipboard API only works in content script

import type { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";
import { sendTabMessage } from "@utils/message";
import { isHTTPURL } from "@utils/common";

interface OpenURLSettings { }
interface OpenURLNewTabSettings {
  position?: "before" | "after" | "start" | "end" | "default";
  focus?: boolean;
}

const OpenURLFromClipboardFn: CommandFn<OpenURLSettings> = async function (sender) {
  if (!sender.tab?.url) return false;

  sendTabMessage(sender.tab.id!, 'clipboardReadText', true, async (clipboardText: string) => {
    if (isHTTPURL(clipboardText)) {
      await chrome.tabs.update(sender.tab!.id, { url: clipboardText });
    }
  });

  return true;
};

const OpenURLFromClipboardInNewTabFn: CommandFn<OpenURLNewTabSettings> = async function (sender) {
  if (!sender.tab) return false;

  sendTabMessage(sender.tab.id!, "clipboardReadText", true, async (clipboardText: string) => {
    let url: string | null = null;

    if (isHTTPURL(clipboardText)) {
      url = clipboardText.trim();
    }

    if (!url) return;

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
  });

  return true;
};

const OpenURLFromClipboardInNewWindowFn: CommandFn<OpenURLSettings> = async function (sender) {
  if (!sender.tab?.url) return false;

  sendTabMessage(sender.tab.id!, 'clipboardReadText', true, async (clipboardText: string) => {
    if (isHTTPURL(clipboardText)) {
      await chrome.windows.create({ url: clipboardText });
    }
  });

  return true;
};

export const OpenURLFromClipboard = defineCommand(OpenURLFromClipboardFn, {}, 'clipboard', ['clipboardRead']);
export const OpenURLFromClipboardInNewTab = defineCommand(
  OpenURLFromClipboardInNewTabFn,
  {
    position: "after",
    focus: true,
  },
  "clipboard",
  ["clipboardRead"]
);
export const OpenURLFromClipboardInNewWindow = defineCommand(OpenURLFromClipboardInNewWindowFn, {}, 'clipboard', ['clipboardRead']);
