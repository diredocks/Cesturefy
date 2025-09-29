import type { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";
import { sendTabMessage } from "@utils/message";

interface CopyTextSelectionSettings { };

const CopyTextSelectionFn: CommandFn<CopyTextSelectionSettings> = async function (sender, data) {
  if (!sender.tab?.id) return false;
  if (data?.selection?.text) {
    sendTabMessage(sender.tab.id, 'clipboardWriteText', data?.selection.text);
  }
  return true;
}

export const CopyTextSelection = defineCommand(CopyTextSelectionFn, {}, 'url', ['clipboardWrite']);
