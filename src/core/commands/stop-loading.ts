import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

const fn: CommandFn = async function (sender) {
  if (!sender.tab?.id) {
    return true;
  }

  // Execute script in all frames to stop loading
  const stopLoadingResults = await chrome.scripting.executeScript({
    target: { tabId: sender.tab.id, allFrames: true },
    func: () => {
      const readyState = document.readyState;
      window.stop();
      return readyState;
    },
  });

  // If at least one frame was not finished loading
  const hasIncomplete = stopLoadingResults.some(result => result.result !== "complete");
  if (hasIncomplete) {
    return true;
  }

  return false;
};

export const StopLoading = defineCommand(fn, {}, 'load', ['scripting']);
