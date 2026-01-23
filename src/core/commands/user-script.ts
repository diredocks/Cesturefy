import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";
import { displayNotification, getMessage } from "@utils/common";

interface UserScriptSettings {
  targetFrame: "allFrames" | "topFrame" | "sourceFrame";
  userScript: string;
}

const isUserScriptsAvailable = () => {
  try {
    // Method call which throws if API permission or toggle is not enabled.
    chrome.userScripts.getScripts();
    return true;
  } catch {
    // Not available.
    return false;
  }
};

const ExecuteUserScriptFn: CommandFn<UserScriptSettings> = async function (
  sender,
  data,
) {
  if (!isUserScriptsAvailable()) {
    displayNotification(
      getMessage("commandErrorNotificationTitle").replace("$1", getMessage("commandLabelExecuteUserScript")),
      getMessage("commandErrorNotificationMessageMissingUserScriptPermissions"),
      "https://developer.chrome.com/blog/chrome-userscript",
    );
    return false;
  }

  const frameId = () => {
    switch (this.getSetting("targetFrame")) {
      case "allFrames":
        return undefined;
      case "topFrame":
        return [0];
      case "sourceFrame":
        return [sender.frameId || 0];
    }
  };

  await chrome.userScripts.execute({
    target: {
      tabId: sender.tab?.id!,
      frameIds: frameId(),
    },
    js: [
      {
        code: `CTX = ${JSON.stringify(data)};` + this.getSetting("userScript"),
      },
    ],
  });

  return true;
};

export const ExecuteUserScript = defineCommand(
  ExecuteUserScriptFn,
  { targetFrame: "allFrames", userScript: "" },
  "advanced",
  ["userScripts"],
);
