import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";
import { displayNotification, getMessage } from "@utils/common";

interface SendMessageToOtherAddonSettings {
  extensionId: string;
  message: string;
  parseJSON: boolean;
}

const fn: CommandFn<SendMessageToOtherAddonSettings> = async function () {
  let message: any = this.getSetting("message");

  if (this.getSetting("parseJSON")) {
    try {
      message = JSON.parse(message);
    } catch (error) {
      displayNotification(
        getMessage("commandErrorNotificationTitle").replace("$1", getMessage("commandLabelSendMessageToOtherAddon")),
        getMessage("commandErrorNotificationMessageNotSerializeable"),
        "https://github.com/Robbendebiene/Gesturefy/wiki/Send-message-to-other-addon#error-not-serializeable",
      );
      console.error(error);
      return false;
    }
  }

  try {
    await chrome.runtime.sendMessage(this.getSetting("extensionId"), message);
    return true;
  } catch (error: any) {
    if (
      error?.message ===
      "Could not establish connection. Receiving end does not exist."
    ) {
      displayNotification(
        getMessage("commandErrorNotificationTitle").replace("$1", getMessage("commandLabelSendMessageToOtherAddon")),
        getMessage("commandErrorNotificationMessageMissingRecipient"),
        "https://github.com/Robbendebiene/Gesturefy/wiki/Send-message-to-other-addon#error-missing-recipient",
      );
    }
    console.error(error);
    return false;
  }
};

export const SendMessageToOtherAddon = defineCommand(
  fn,
  {
    extensionId: "",
    message: "",
    parseJSON: false,
  },
  "advanced",
);
