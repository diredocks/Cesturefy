import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

const moveTabToStart: CommandFn = async function (sender) {
  if (!sender.tab?.id) return true;

  const tabs = await chrome.tabs.query({
    windowId: sender.tab.windowId,
    pinned: sender.tab.pinned,
  });

  const mostLeftTab = tabs.reduce((acc, cur) =>
    cur.index < acc.index ? cur : acc,
  );

  if (mostLeftTab.index !== sender.tab.index) {
    await chrome.tabs.move(sender.tab.id, { index: mostLeftTab.index });
    return true;
  }
  return false;
};

const moveTabToEnd: CommandFn = async function (sender) {
  if (!sender.tab?.id) return true;

  const tabs = await chrome.tabs.query({
    windowId: sender.tab.windowId,
    pinned: sender.tab.pinned,
  });

  const mostRightTab = tabs.reduce((acc, cur) =>
    cur.index > acc.index ? cur : acc,
  );

  if (mostRightTab.index !== sender.tab.index) {
    await chrome.tabs.move(sender.tab.id, { index: mostRightTab.index + 1 });
    return true;
  }
  return false;
};

interface MoveTabRLSettings {
  shift: number;
  cycling: boolean;
}

const moveTabRight: CommandFn<MoveTabRLSettings> = async function (sender) {
  if (!sender.tab?.id) return true;

  const shift = this.getSetting("shift");
  const cycling = this.getSetting("cycling");

  const tabs = await chrome.tabs.query({
    windowId: sender.tab.windowId,
    pinned: sender.tab.pinned,
  });
  tabs.sort((a, b) => a.index - b.index);

  const currentIndex = tabs.findIndex((tab) => tab.index === sender.tab!.index);
  let nextIndex = currentIndex + shift;

  if (cycling) {
    nextIndex = ((nextIndex % tabs.length) + tabs.length) % tabs.length;
  } else {
    nextIndex = Math.min(nextIndex, tabs.length - 1);
  }

  if (nextIndex !== currentIndex) {
    await chrome.tabs.move(sender.tab.id, { index: tabs[nextIndex].index });
    return true;
  }
  return false;
};

const moveTabLeft: CommandFn<MoveTabRLSettings> = async function (sender) {
  if (!sender.tab?.id) return true;

  const shift = this.getSetting("shift");
  const cycling = this.getSetting("cycling");

  const tabs = await chrome.tabs.query({
    windowId: sender.tab.windowId,
    pinned: sender.tab.pinned,
  });
  tabs.sort((a, b) => a.index - b.index);

  const currentIndex = tabs.findIndex((tab) => tab.index === sender.tab!.index);
  let nextIndex = currentIndex - shift;

  if (cycling) {
    nextIndex = ((nextIndex % tabs.length) + tabs.length) % tabs.length;
  } else {
    nextIndex = Math.max(nextIndex, 0);
  }

  if (nextIndex !== currentIndex) {
    await chrome.tabs.move(sender.tab.id, { index: tabs[nextIndex].index });
    return true;
  }
  return false;
};

const moveTabToNewWindow: CommandFn = async function (sender) {
  if (!sender.tab?.id) return true;
  await chrome.windows.create({ tabId: sender.tab.id });
  return true;
};

interface MoveTabsToNewWindowSettings {
  includeCurrent: boolean;
  focus: boolean;
}

const moveRightTabsToNewWindow: CommandFn<MoveTabsToNewWindowSettings> =
  async function (sender) {
    if (!sender.tab?.id) return true;

    const includeCurrent = this.getSetting("includeCurrent");
    const focus = this.getSetting("focus");

    const query: chrome.tabs.QueryInfo = {
      windowId: sender.tab.windowId,
      pinned: false,
      active: includeCurrent ? undefined : false,
    };

    const tabs = await chrome.tabs.query(query);
    const rightTabs = tabs.filter((tab) => tab.index >= sender.tab!.index);
    const rightIds = rightTabs.map((tab) => tab.id).filter(Boolean) as number[];

    if (rightIds.length > 0) {
      const firstTabId = rightIds.shift()!;
      const window = await chrome.windows.create({
        tabId: firstTabId,
        state: focus ? undefined : "minimized",
      });
      if (rightIds.length > 0) {
        await chrome.tabs.move(rightIds, { windowId: window!.id, index: 1 });
      }
      return true;
    }
    return false;
  };

const moveLeftTabsToNewWindow: CommandFn<MoveTabsToNewWindowSettings> =
  async function (sender) {
    if (!sender.tab?.id) return true;

    const includeCurrent = this.getSetting("includeCurrent");
    const focus = this.getSetting("focus");

    const query: chrome.tabs.QueryInfo = {
      windowId: sender.tab.windowId,
      pinned: false,
      active: includeCurrent ? undefined : false,
    };

    const tabs = await chrome.tabs.query(query);
    const leftTabs = tabs.filter((tab) => tab.index <= sender.tab!.index);
    const leftIds = leftTabs.map((tab) => tab.id).filter(Boolean) as number[];

    if (leftIds.length > 0) {
      const lastTabId = leftIds.pop()!;
      const window = await chrome.windows.create({
        tabId: lastTabId,
        state: focus ? undefined : "minimized",
      });
      if (leftIds.length > 0) {
        await chrome.tabs.move(leftIds, { windowId: window!.id, index: 0 });
      }
      return true;
    }
    return false;
  };

export const MoveTabToStart = defineCommand(moveTabToStart, {}, "move");
export const MoveTabToEnd = defineCommand(moveTabToEnd, {}, "move");
export const MoveTabRight = defineCommand(
  moveTabRight,
  { shift: 1, cycling: false },
  "move",
);
export const MoveTabLeft = defineCommand(
  moveTabLeft,
  { shift: 1, cycling: false },
  "move",
);
export const MoveTabToNewWindow = defineCommand(moveTabToNewWindow, {}, "move");
export const MoveRightTabsToNewWindow = defineCommand(
  moveRightTabsToNewWindow,
  { includeCurrent: true, focus: true },
  "move",
);
export const MoveLeftTabsToNewWindow = defineCommand(
  moveLeftTabsToNewWindow,
  { includeCurrent: true, focus: true },
  "move",
);
