import type { CommandFn } from "@utils/types";

export interface NewTabSettings {
  focusNew?: boolean;
  position?: 'before' | 'after' | 'start' | 'end';
}

export const NewTab: CommandFn<NewTabSettings> = async function (sender) {
  if (!sender.tab?.id) {
    return true;
  }

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
    default:
      // intended because default is end
      break;
  }
  await chrome.tabs.create({ active: this.getSetting('focusNew'), index });

  return true;
}
