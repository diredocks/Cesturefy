import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";
import { displayNotification } from "@utils/common";

interface OpenCustomSettings {
  url?: string;
}

const OpenCustomURLFn: CommandFn<OpenCustomSettings> = async function (sender) {
  try {
    await chrome.tabs.update(sender.tab?.id, {
      url: this.getSetting("url"),
    });
  } catch (error) {
    displayNotification(
      chrome.i18n.getMessage(
        "commandErrorNotificationTitle",
        chrome.i18n.getMessage("commandLabelOpenCustomURL"),
      ),
      chrome.i18n.getMessage("commandErrorNotificationMessageIllegalURL"),
      "https://github.com/Robbendebiene/Gesturefy/wiki/Illegal-URL",
    );
    return false;
  }
  return true;
};

export const OpenCustomURL = defineCommand(
  OpenCustomURLFn,
  { url: "" },
  "open",
);

const OpenCustomURLNewWindowFn: CommandFn<OpenCustomSettings> =
  async function () {
    try {
      await chrome.windows.create({
        url: this.getSetting("url"),
      });
    } catch (error) {
      displayNotification(
        chrome.i18n.getMessage(
          "commandErrorNotificationTitle",
          chrome.i18n.getMessage("commandLabelOpenCustomURL"),
        ),
        chrome.i18n.getMessage("commandErrorNotificationMessageIllegalURL"),
        "https://github.com/Robbendebiene/Gesturefy/wiki/Illegal-URL",
      );
      return false;
    }
    return true;
  };

export const OpenCustomURLInNewWindow = defineCommand(
  OpenCustomURLNewWindowFn,
  { url: "" },
  "open",
);

const OpenCustomURLNewPrivateWindowFn: CommandFn<OpenCustomSettings> =
  async function () {
    try {
      await chrome.windows.create({
        url: this.getSetting("url"),
        incognito: true,
      });
    } catch (error) {
      displayNotification(
        chrome.i18n.getMessage(
          "commandErrorNotificationTitle",
          chrome.i18n.getMessage("commandLabelOpenCustomURL"),
        ),
        chrome.i18n.getMessage("commandErrorNotificationMessageIllegalURL"),
        "https://github.com/Robbendebiene/Gesturefy/wiki/Illegal-URL",
      );
      return false;
    }
    return true;
  };

export const OpenCustomURLInNewPrivateWindow = defineCommand(
  OpenCustomURLNewPrivateWindowFn,
  { url: "" },
  "open",
);

interface OpenCustomNewTabSettings {
  position?: "before" | "after" | "start" | "end" | "default";
  focus?: boolean;
  url?: string;
}

const OpenCustomURLNewTabFn: CommandFn<OpenCustomNewTabSettings> =
  async function (sender) {
    let index;
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

    try {
      await chrome.tabs.create({
        url: this.getSetting("url"),
        active: this.getSetting("focus"),
        index: index,
      });
    } catch (error) {
      displayNotification(
        chrome.i18n.getMessage(
          "commandErrorNotificationTitle",
          chrome.i18n.getMessage("commandLabelOpenCustomURLInNewTab"),
        ),
        chrome.i18n.getMessage("commandErrorNotificationMessageIllegalURL"),
        "https://github.com/Robbendebiene/Gesturefy/wiki/Illegal-URL",
      );
      return false;
    }

    return true;
  };

export const OpenCustomURLInNewTab = defineCommand(
  OpenCustomURLNewTabFn,
  { position: "default", focus: false, url: "" },
  "open",
);
