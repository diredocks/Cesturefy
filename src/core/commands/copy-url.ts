// NOTE: The clipboard API only works in content script

import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";
import { isHTTPURL } from "@utils/common";
import { sendTabMessage } from "@utils/message";

const CopyTabURLFn: CommandFn = async function (sender) {
  if (!sender.tab?.url) return false;
  sendTabMessage(sender.tab.id!, 'clipboardWriteText', sender.tab.url);
  return true;
};

const CopyLinkURLFn: CommandFn = async function (sender, data) {
  if (!(sender.tab?.id)) return false;

  let url;

  if (data?.selection && isHTTPURL(data.selection.text)) {
    url = data.selection.text;
  } else if (data?.link?.href && isHTTPURL(data.link.href)) {
    url = data.link.href;
  }

  if (url) {
    sendTabMessage(sender.tab.id, 'clipboardWriteText', url);
  }

  return true;
};

const CopyImageURLFn: CommandFn = async function (sender, data) {
  if (!(sender.tab?.id)) return false;
  if (data?.target.imageData) {
    sendTabMessage(sender.tab.id, 'clipboardWriteText', data.target.imageData.src);
  }
  return true;
};

export const CopyTabURL = defineCommand(CopyTabURLFn, {}, 'url', ['clipboardWrite']);
export const CopyLinkURL = defineCommand(CopyLinkURLFn, {}, 'url', ['clipboardWrite']);
export const CopyImageURL = defineCommand(CopyImageURLFn, {}, 'image', ['clipboardWrite']);
