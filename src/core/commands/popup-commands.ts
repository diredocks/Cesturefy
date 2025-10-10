import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";
import Command, { CommandJSON } from "@model/command";

interface PopupCustomCommandListSettings {
  commands: CommandJSON[];
};

const fn: CommandFn<PopupCustomCommandListSettings> = async function (sender, data) {
  if (!sender.tab || !data) return false;
  if (!sender.tab.id) return false;

  const commands = this.getSetting("commands").map(cmd =>
    Command.fromJSON(cmd)
  );

  const dataset = commands.map((command, index) => ({
    id: index,
    label: command.toString(),
    icon: null
  }));

  const popupCreatedSuccessfully = await chrome.tabs.sendMessage(sender.tab.id, {
    subject: "popupRequest",
    data: {
      mousePositionX: data.mouse.endpoint.x,
      mousePositionY: data.mouse.endpoint.y
    },
  }, { frameId: 0 });

  if (!popupCreatedSuccessfully) return false;

  const channel = chrome.tabs.connect(sender.tab.id, {
    name: "popupConnection"
  });

  channel.postMessage(dataset);

  channel.onMessage.addListener(async (message) => {
    const command = commands[message.id];
    const returnValue = await command.execute(sender, data);
    if (returnValue === true) channel.disconnect();
  });

  return true;
};

export const PopupCustomCommandList = defineCommand(fn, { commands: [] }, 'popup');
