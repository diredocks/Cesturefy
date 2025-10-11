import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

const TogglePinFn: CommandFn = async function (sender) {
  if (!sender.tab?.id) return false;

  await chrome.tabs.update(sender.tab.id, { pinned: !sender.tab.pinned });
  return true;
};

export const TogglePin = defineCommand(TogglePinFn, {}, "toggle");

const ToggleMuteFn: CommandFn = async function (sender) {
  if (!sender.tab?.id) return false;

  await chrome.tabs.update(sender.tab.id, {
    muted: !sender.tab.mutedInfo?.muted,
  });
  return true;
};

export const ToggleMute = defineCommand(ToggleMuteFn, {}, "toggle");

const ToggleBookmarkFn: CommandFn = async function (sender) {
  const bookmarks = await chrome.bookmarks.search({ url: sender.tab?.url });

  if (bookmarks.length > 0) {
    await chrome.bookmarks.remove(bookmarks[0].id);
  } else {
    await chrome.bookmarks.create({
      url: sender.tab?.url,
      title: sender.tab?.title,
    });
  }

  return true;
};

export const ToggleBookmark = defineCommand(ToggleBookmarkFn, {}, "toggle", [
  "bookmarks",
]);
