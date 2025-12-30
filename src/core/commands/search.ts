// TODO: DRY

import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";
import { sendTabMessage } from "@utils/message";

interface SearchSettings {
  searchEngineURL: string;
  openEmptySearch: boolean;
}

const SearchClipboardFn: CommandFn<SearchSettings> = async function (sender) {
  if (!sender.tab?.id) return false;

  const clipboardText = await sendTabMessage(
    sender.tab.id,
    "clipboardReadText",
    {},
  );

  if (clipboardText.trim() === "" && !this.getSetting("openEmptySearch")) {
    return true;
  }

  // either use default search engine
  let searchEngineURL = this.getSetting("searchEngineURL");
  if (!searchEngineURL) {
    chrome.search.query({ tabId: sender.tab.id, text: clipboardText });
    return true;
  }
  // or specified search engine url
  // if contains placeholder replace it
  if (searchEngineURL.includes("%s")) {
    searchEngineURL = searchEngineURL.replace(
      "%s",
      encodeURIComponent(clipboardText),
    );
  }
  // else append to url
  else {
    searchEngineURL = searchEngineURL + encodeURIComponent(clipboardText);
  }
  await chrome.tabs.update(sender.tab.id, {
    url: searchEngineURL,
  });

  return true;
};

export const SearchClipboard = defineCommand(
  SearchClipboardFn,
  {
    searchEngineURL: "",
    openEmptySearch: false,
  },
  "clipboard",
  ["search", "clipboardRead"],
);

const SearchTextSelectionFn: CommandFn<SearchSettings> = async function (
  sender,
  data,
) {
  if (!sender.tab?.id || !data) return false;

  const selectionText = data.selection?.text;
  if (!selectionText) return false;

  if (selectionText.trim() === "" && !this.getSetting("openEmptySearch")) {
    return true;
  }

  let searchEngineURL = this.getSetting("searchEngineURL");
  if (!searchEngineURL) {
    chrome.search.query({ tabId: sender.tab.id, text: selectionText });
    return true;
  }

  if (searchEngineURL.includes("%s")) {
    searchEngineURL = searchEngineURL.replace(
      "%s",
      encodeURIComponent(selectionText),
    );
  } else {
    searchEngineURL = searchEngineURL + encodeURIComponent(selectionText);
  }
  await chrome.tabs.update(sender.tab.id, {
    url: searchEngineURL,
  });

  return true;
};

export const SearchTextSelection = defineCommand(
  SearchTextSelectionFn,
  {
    searchEngineURL: "",
    openEmptySearch: false,
  },
  "selection",
  ["search"],
);

interface SearchNewTabSettings {
  searchEngineURL: string;
  openEmptySearch: boolean;
  position?: "before" | "after" | "start" | "end" | "default";
  focus?: boolean;
}

const SearchClipboardNewTabFn: CommandFn<SearchNewTabSettings> =
  async function (sender) {
    if (!sender.tab?.id) return false;

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
    const tab = await chrome.tabs.create({
      index,
      active: this.getSetting("focus"),
      url: "about:blank",
      openerTabId: sender.tab.id,
    });

    const clipboardText = await sendTabMessage(
      sender.tab.id,
      "clipboardReadText",
      {},
    );

    if (clipboardText.trim() === "" && !this.getSetting("openEmptySearch")) {
      return true;
    }

    let searchEngineURL = this.getSetting("searchEngineURL");
    if (!searchEngineURL) {
      chrome.search.query({ tabId: tab.id, text: clipboardText });
      return true;
    }

    if (searchEngineURL.includes("%s")) {
      searchEngineURL = searchEngineURL.replace(
        "%s",
        encodeURIComponent(clipboardText),
      );
    } else {
      searchEngineURL = searchEngineURL + encodeURIComponent(clipboardText);
    }
    await chrome.tabs.update(tab.id, { url: searchEngineURL });

    return true;
  };

export const SearchClipboardInNewTab = defineCommand(
  SearchClipboardNewTabFn,
  {
    searchEngineURL: "",
    openEmptySearch: false,
    position: "default",
    focus: false,
  },
  "clipboard",
  ["search"],
);

const SearchTextSelectionNewTabFn: CommandFn<SearchNewTabSettings> =
  async function (sender, data) {
    if (!sender.tab?.id || !data) return false;

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
    const tab = await chrome.tabs.create({
      index,
      active: this.getSetting("focus"),
      url: "about:blank",
      openerTabId: sender.tab.id,
    });

    const selectionText = data.selection?.text;
    if (!selectionText) return false;

    if (selectionText.trim() === "" && !this.getSetting("openEmptySearch")) {
      return true;
    }

    let searchEngineURL = this.getSetting("searchEngineURL");
    if (!searchEngineURL) {
      chrome.search.query({ tabId: tab.id, text: selectionText });
      return true;
    }

    if (searchEngineURL.includes("%s")) {
      searchEngineURL = searchEngineURL.replace(
        "%s",
        encodeURIComponent(selectionText),
      );
    } else {
      searchEngineURL = searchEngineURL + encodeURIComponent(selectionText);
    }
    await chrome.tabs.update(tab.id, { url: searchEngineURL });

    return true;
  };

export const SearchTextSelectionInNewTab = defineCommand(
  SearchTextSelectionNewTabFn,
  {
    searchEngineURL: "",
    openEmptySearch: false,
    position: "default",
    focus: false,
  },
  "selection",
  ["search"],
);
