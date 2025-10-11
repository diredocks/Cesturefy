import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

const injectedCode = () => {
  window.location.reload();
};

const ReloadFrameFn: CommandFn = async function (sender) {
  if (!sender.tab?.id) return true;

  await chrome.scripting.executeScript({
    target: { tabId: sender.tab.id, frameIds: [sender.frameId ?? 0] },
    func: injectedCode,
    world: "MAIN",
  });
  return true;
};

export const ReloadFrame = defineCommand(ReloadFrameFn, {}, "load", [
  "scripting",
]);
