import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";
import { isHTTPURL } from "@utils/common";

const fn: CommandFn = async function (sender, data) {
  if (!(sender.tab?.id)) return false;

  let url, title;
  if (data?.selection && isHTTPURL(data.selection.text)) {
    url = data.selection.text;
    title = data.selection.text;
  } else if (data?.link?.href && isHTTPURL(data.link.href)) {
    url = data.link.href;
    title = data?.link?.title || data?.link?.textContent || url
  }

  if (!url) return false;

  await chrome.bookmarks.create({ url, title });

  return true;
};

export const LinkToNewBookmark = defineCommand(fn, {}, 'link', ['bookmarks']);
