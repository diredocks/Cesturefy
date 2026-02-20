import Gesture, { GestureJSON } from "@model/gesture";
import { configManager } from "@model/config-manager";
import { matcher } from "@utils/match";
import {
  Handler,
  HandlerMap,
  registerHandlers,
  sendTabMessage,
  BackgroundMessages,
  ContentMessages,
} from "@utils/message";
import Command from "@model/command";
import { setMessageGetter } from "@utils/common";

let gestures: Gesture[];
let customMessages: Record<string, { message: string }> | null = null;

// Custom getMessage function that uses custom language if set
function getMessage(key: string): string {
  if (customMessages && customMessages[key]) {
    return customMessages[key].message;
  }
  return chrome.i18n.getMessage(key);
}

// Load custom language messages
async function loadCustomLanguage(lang: string): Promise<void> {
  if (lang === "auto") {
    customMessages = null;
  } else {
    try {
      const url = chrome.runtime.getURL(`/_locales/${lang}/messages.json`);
      const response = await fetch(url, { method: "GET" });
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}`);
      }
      customMessages = await response.json();
    } catch (e) {
      console.warn(`Failed to load language ${lang}, falling back to browser default`);
      customMessages = null;
    }
  }
  
  // Update the global message getter so Command.toString() uses the correct language
  setMessageGetter(getMessage);
}

const applyGestures = () => {
  gestures = (configManager.getPath(["Gestures"]) as GestureJSON[]).map(
    (g) => new Gesture(g),
  );
};

const applyLanguage = async () => {
  const language = configManager.getPath(["Settings", "General", "language"]) || "auto";
  await loadCustomLanguage(language);
};

configManager.addEventListener("loaded", applyGestures);
configManager.addEventListener("change", applyGestures);
configManager.addEventListener("loaded", applyLanguage);
configManager.addEventListener("change", applyLanguage);

const handleGestureChange: Handler<"gestureChange", BackgroundMessages> = (
  m,
  sender,
) => {
  const matchedGesture = matcher.getGestureByPattern(m.data.vectors, gestures);
  if (!sender.tab?.id) {
    return;
  }
  sendTabMessage<"matchingGesture", ContentMessages>(
    sender.tab.id,
    "matchingGesture",
    matchedGesture !== null ? matchedGesture.toString() : null,
  );
};

const handleGestureEnd: Handler<"gestureEnd", BackgroundMessages> = (
  m,
  sender,
) => {
  const matchedGesture = matcher.getGestureByPattern(m.data.vectors, gestures);
  if (matchedGesture) {
    matchedGesture.getCommand().execute(sender, m.data.context);
  }
};

const handleOSRequest: Handler<"OSRequest", BackgroundMessages> = async () => {
  return (await chrome.runtime.getPlatformInfo()).os;
};

const handleRockerLeft: Handler<"rockerLeft", BackgroundMessages> = async (
  m,
  sender,
) => {
  const rockerCommand = Command.fromJSON(
    configManager.getPath(["Settings", "Rocker", "leftMouseClick"]),
  );
  rockerCommand.execute(sender, m.data.context);
};

const handleRockerRight: Handler<"rockerRight", BackgroundMessages> = async (
  m,
  sender,
) => {
  const rockerCommand = Command.fromJSON(
    configManager.getPath(["Settings", "Rocker", "rightMouseClick"]),
  );
  rockerCommand.execute(sender, m.data.context);
};

const handleWheelUp: Handler<"wheelUp", BackgroundMessages> = async (
  m,
  sender,
) => {
  const wheelCommand = Command.fromJSON(
    configManager.getPath(["Settings", "Wheel", "wheelUp"]),
  );
  wheelCommand.execute(sender, m.data.context);
};

const handleWheelDown: Handler<"wheelDown", BackgroundMessages> = async (
  m,
  sender,
) => {
  const wheelCommand = Command.fromJSON(
    configManager.getPath(["Settings", "Wheel", "wheelDown"]),
  );
  wheelCommand.execute(sender, m.data.context);
};

const backgroundHandlers: HandlerMap<BackgroundMessages> = {
  gestureChange: handleGestureChange,
  gestureEnd: handleGestureEnd,
  OSRequest: handleOSRequest,
  rockerLeft: handleRockerLeft,
  rockerRight: handleRockerRight,
  wheelUp: handleWheelUp,
  wheelDown: handleWheelDown,
};

registerHandlers(backgroundHandlers);

// It work as a broker, from `message-router`,
// iframe -> popup-command (part of content script)
const popupCommandViewSubjects = [
  "popupInitiation",
  "popupTermination",
  "popupReady",
];
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!popupCommandViewSubjects.includes(message.subject)) {
    return;
  }
  chrome.tabs.sendMessage(
    sender.tab!.id!,
    message,
    { frameId: 0 },
    (response) => sendResponse(response),
  );
  return true;
});

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});
