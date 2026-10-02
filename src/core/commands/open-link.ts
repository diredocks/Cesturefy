import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

const OpenLinkFn: CommandFn = async function (sender, data) {
  if (!data?.link?.href) return false;

  let url = data.link.href;
  await chrome.tabs.update(sender.tab!.id, { url });

  return true;
};

type TabPosition = "before" | "after" | "start" | "end" | "default";

function resolveTabIndex(
  position: TabPosition,
  sender: chrome.runtime.MessageSender,
): number | undefined {
  switch (position) {
    case "before":
      return sender.tab!.index;
    case "after":
      return sender.tab!.index + 1;
    case "start":
      return 0;
    case "end":
      return 999;
    default:
      return undefined;
  }
}

interface OpenLinkNewTabSettings {
  position?: TabPosition;
  focus?: boolean;
  emptyTab?: boolean;
}

const OpenLinkNewTabFn: CommandFn<OpenLinkNewTabSettings> = async function (
  sender,
  data,
) {
  const url = data?.link?.href;
  if (!url && !this.getSetting("emptyTab")) return false;

  await chrome.tabs.create({
    ...(url && { url }),
    active: this.getSetting("focus"),
    index: resolveTabIndex(this.getSetting("position"), sender),
  });

  return true;
};

interface OpenLinkNewWindowSettings {
  emptyWindow?: boolean;
}

function makeOpenLinkInWindowFn(
  incognito = false,
): CommandFn<OpenLinkNewWindowSettings> {
  return async function (_sender, data) {
    const url = data?.link?.href;
    if (!url && !this.getSetting("emptyWindow")) return false;

    await chrome.windows.create({
      ...(url && { url }),
      ...(incognito && { incognito: true as const }),
    });

    return true;
  };
}

const OpenLinkInNewWindowFn = makeOpenLinkInWindowFn(false);
const OpenLinkInNewPrivateWindowFn = makeOpenLinkInWindowFn(true);

export const OpenLink = defineCommand(OpenLinkFn, {}, "link");
export const OpenLinkInNewTab = defineCommand(
  OpenLinkNewTabFn,
  {
    position: "after",
    focus: true,
    emptyTab: false,
  },
  "link",
);
export const OpenLinkInNewWindow = defineCommand(
  OpenLinkInNewWindowFn,
  {
    emptyWindow: false,
  },
  "link",
);
export const OpenLinkInNewPrivateWindow = defineCommand(
  OpenLinkInNewPrivateWindowFn,
  {
    emptyWindow: false,
  },
  "link",
);
