import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";
import { sendTabMessage } from "@utils/message";

const CopyImageFn: CommandFn = async (sender, data) => {
  if (!sender.tab?.id || !data) return false;
  if (!data.target.imageData?.src) return false;
  if (!(data?.target.nodeName.toLocaleLowerCase() === "img")) return false;

  sendTabMessage(
    sender.tab.id,
    "clipboardWriteImage",
    data.target.imageData.src,
  );
  return true;
};

export const CopyImage = defineCommand(CopyImageFn, {}, "image", [
  "clipboardWrite",
]);
