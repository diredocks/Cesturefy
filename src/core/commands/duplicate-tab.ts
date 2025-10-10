import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

interface DuplicateTabSettings {
  focus?: boolean;
  position?: 'before' | 'after' | 'start' | 'end' | 'default';
}

const fn: CommandFn<DuplicateTabSettings> = async function (sender) {
  if (!sender.tab?.id) {
    return true;
  }

  const duplicated = await chrome.tabs.duplicate(sender.tab.id);
  if (!duplicated?.id) {
    return true;
  }

  // if focus new tab, then don't focus prev tab
  if (!this.getSetting('focus'))
    chrome.tabs.update(sender.tab.id, { active: true });

  let index;
  switch (this.getSetting('position')) {
    case 'before':
      index = sender.tab.id;
      break;
    case 'after':
      index = sender.tab.index + 1;
      break;
    case 'start':
      index = 0;
      break;
    case 'end':
    case 'default':
    default:
      index = -1;
      break;
  }
  await chrome.tabs.move(duplicated.id, { index });

  return true;
};

export const DuplicateTab = defineCommand(fn, {
  focus: true,
  position: 'default'
}, 'tabs');
