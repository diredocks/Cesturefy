import type { CommandFn } from "@utils/types";

export interface DuplicateTabSettings {
  focusPrevTab?: boolean;
  position?: 'before' | 'after' | 'start' | 'end' | 'default';
}

export const DuplicateTabDefaults: Required<DuplicateTabSettings> = {
  focusPrevTab: true,
  position: 'default',
};

export const DuplicateTab: CommandFn<DuplicateTabSettings> = async function (sender) {
  if (!sender.tab?.id) {
    return true;
  }

  const duplicated = await chrome.tabs.duplicate(sender.tab.id);
  if (!duplicated?.id) {
    return true;
  }

  chrome.tabs.update(sender.tab.id, { active: this.getSetting('focusPrevTab') });

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
