import type { CommandFn } from "@utils/types";

export interface NewTabSettings {
  focus?: boolean;
  position?: 'before' | 'after' | 'start' | 'end' | 'default';
}

export const NewTabDefaults: Required<NewTabSettings> = {
  focus: true,
  position: 'default',
};

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
    case 'default':
    default:
      // intended because default is end
      break;
  }
  await chrome.tabs.create({ active: this.getSetting('focus'), index });

  return true;
}
