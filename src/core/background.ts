import Gesture, { GestureJSON } from "@model/gesture";
import { configManager } from "@utils/config-manager";
import { matcher } from "@utils/match";
import {
  Handler, HandlerMap,
  registerHandlers, sendTabMessage,
  BackgroundMessages, ContentMessages
} from "@utils/message";

let gestures: Gesture[];

const applyGestures = () => {
  gestures = (configManager.getPath(['Gestures']) as GestureJSON[]).map(g => new Gesture(g));
};

configManager.addEventListener('loaded', applyGestures);
configManager.addEventListener('change', applyGestures);

const handleGestureChange: Handler<"gestureChange", BackgroundMessages> = (m, sender) => {
  const matchedGesture = matcher.getGestureByPattern(m.data, gestures);
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
  const matchedGesture = matcher.getGestureByPattern(m.data, gestures);
  if (matchedGesture) {
    matchedGesture.getCommand().execute(sender);
  }
};

const backgroundHandlers: HandlerMap<BackgroundMessages> = {
  gestureChange: handleGestureChange,
  gestureEnd: handleGestureEnd,
};

registerHandlers(backgroundHandlers);
