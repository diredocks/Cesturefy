// NOTE: The clipboard API only works in content script

import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";
import { sendTabMessage } from "@utils/message";
import { isHTTPURL } from "@utils/common";

const OpenURLFromClipboardFn: CommandFn = async function (sender) {
  if (!sender.tab?.url) return false;

  const clipboardText = await sendTabMessage(
    sender.tab.id!,
    "clipboardReadText",
    {},
  );
  if (isHTTPURL(clipboardText)) {
    await chrome.tabs.update(sender.tab!.id, { url: clipboardText });
  }

  return true;
};

export const OpenURLFromClipboard = defineCommand(
  OpenURLFromClipboardFn,
  {},
  "clipboard",
  ["clipboardRead"],
);

const OpenURLFromClipboardInNewWindowFn: CommandFn = async function (sender) {
  if (!sender.tab?.url) return false;

  const clipboardText = await sendTabMessage(
    sender.tab.id!,
    "clipboardReadText",
    {},
  );
  if (isHTTPURL(clipboardText)) {
    await chrome.windows.create({ url: clipboardText });
  }

  return true;
};

export const OpenURLFromClipboardInNewWindow = defineCommand(
  OpenURLFromClipboardInNewWindowFn,
  {},
  "clipboard",
  ["clipboardRead"],
);

const OpenURLFromClipboardInNewPrivateWindowFn: CommandFn = async function (
  sender,
) {
  if (!sender.tab?.url) return false;

  const clipboardText = await sendTabMessage(
    sender.tab.id!,
    "clipboardReadText",
    {},
  );
  if (isHTTPURL(clipboardText)) {
    await chrome.windows.create({ url: clipboardText, incognito: true });
  }

  return true;
};

export const OpenURLFromClipboardInNewPrivateWindow = defineCommand(
  OpenURLFromClipboardInNewPrivateWindowFn,
  {},
  "clipboard",
  ["clipboardRead"],
);

interface OpenURLNewTabSettings {
  position?: "before" | "after" | "start" | "end" | "default";
  focus?: boolean;
}

const OpenURLFromClipboardInNewTabFn: CommandFn<OpenURLNewTabSettings> =
  async function (sender) {
    if (!sender.tab) return false;

    const clipboardText = await sendTabMessage(
      sender.tab.id!,
      "clipboardReadText",
      {},
    );
    let url: string | null = null;

    if (isHTTPURL(clipboardText)) {
      url = clipboardText.trim();
    }

    if (!url) return false;

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

export const OpenURLFromClipboardInNewTab = defineCommand(
  OpenURLFromClipboardInNewTabFn,
  {
    position: "after",
    focus: true,
  },
  "clipboard",
  ["clipboardRead"],
);
