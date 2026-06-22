import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";
import { sendTabMessage } from "@utils/message";

interface InsertCustomTextSettings {
  text?: string;
}

const InsertCustomTextFn: CommandFn<InsertCustomTextSettings> =
  async function (sender) {
    if (!sender.tab?.id) return false;
    const text = this.getSetting("text");
    if (!text) return false;

    sendTabMessage(sender.tab.id, "insertText", text);
    return true;
  };

export const InsertCustomText = defineCommand(
  InsertCustomTextFn,
  { text: "" },
  "input",
);
