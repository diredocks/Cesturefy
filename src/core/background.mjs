import Gesture, { GestureJSON } from "@model/gesture";
import { configManager } from "@model/config-manager";
import { matcher } from "@utils/match";
import {
  Handler, HandlerMap,
  registerHandlers, sendTabMessage,
  BackgroundMessages, ContentMessages
} from "@utils/message";
import Command from "@model/command";

let gestures: Gesture[];

const applyGestures = () => {
  gestures = (configManager.getPath(['Gestures']) as GestureJSON[]).map(g => new Gesture(g));
};

configManager.addEventListener('loaded', applyGestures);
configManager.addEventListener('change', applyGestures);

const handleGestureChange: Handler<"gestureChange", BackgroundMessages> = (m, sender) => {
  const matchedGesture = matcher.getGestureByPattern(m.data.vectors, gestures);
  if (!sender.tab?.id) {
    return;
  }
  sendTabMessage<"matchingGesture", ContentMessages>(
    sender.tab.id,
    "matchingGesture",
    (matchedGesture !== null) ? matchedGesture.toString() : null,
  );
};

const handleGestureEnd: Handler<"gestureEnd", BackgroundMessages> = (m, sender) => {
  const matchedGesture = matcher.getGestureByPattern(m.data.vectors, gestures);
  if (matchedGesture) {
    matchedGesture.getCommand().execute(sender, m.data.context);
  }
};

const handleOSRequest: Handler<"OSRequest", BackgroundMessages> = async () => {
  return (await chrome.runtime.getPlatformInfo()).os;
};

const handleRockerLeft: Handler<"rockerLeft", BackgroundMessages> = async (m, sender) => {
  const rockerCommand = Command.fromJSON(configManager.getPath(['Settings', 'Rocker', 'leftMouseClick']));
  rockerCommand.execute(sender, m.data.context);
};

const handleRockerRight: Handler<"rockerRight", BackgroundMessages> = async (m, sender) => {
  const rockerCommand = Command.fromJSON(configManager.getPath(['Settings', 'Rocker', 'rightMouseClick']));
  rockerCommand.execute(sender, m.data.context);
};

const handleWheelUp: Handler<"wheelUp", BackgroundMessages> = async (m, sender) => {
  const wheelCommand = Command.fromJSON(configManager.getPath(['Settings', 'Wheel', 'wheelUp']));
  wheelCommand.execute(sender, m.data.context);
};

const handleWheelDown: Handler<"wheelDown", BackgroundMessages> = async (m, sender) => {
  const wheelCommand = Command.fromJSON(configManager.getPath(['Settings', 'Wheel', 'wheelDown']));
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
const popupCommandViewSubjects = ["popupInitiation", "popupTermination", "popupReady"];
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!popupCommandViewSubjects.includes(message.subject)) {
    return;
  }
  chrome.tabs.sendMessage(sender.tab!.id!, message, { frameId: 0 },
    (response) => sendResponse(response));
  return true;
});
