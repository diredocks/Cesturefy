import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

interface NewTabSettings {
  focus?: boolean;
  position?: 'before' | 'after' | 'start' | 'end' | 'default';
}

const fn: CommandFn<NewTabSettings> = async function (sender) {
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

export const NewTab = defineCommand(fn, {
  focus: true,
  position: 'default',
}, 'tabs');
