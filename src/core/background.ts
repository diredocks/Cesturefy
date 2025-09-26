import Gesture, { GestureJSON } from "@model/gesture";
import { configManager } from "@utils/config-manager";
import { getGestureByPattern } from "@utils/match";
import {
  Handler, HandlerMap,
  registerHandlers, sendTabMessage,
  BackgroundMessages, ContentMessages
} from "@utils/message";

let gestures: Gesture[];

const applyGestures = () => {
  gestures = (configManager.get('Gestures') as GestureJSON[]).map(g => Gesture.fromJSON(g));
};

configManager.addEventListener('loaded', applyGestures);
configManager.addEventListener('changed', applyGestures);

const handleGestureChange: Handler<"gestureChange", BackgroundMessages> = (m, sender) => {
  const matchedGesture = getGestureByPattern(m.data, gestures, 0.15);
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
  const matchedGesture = getGestureByPattern(m.data, gestures, 0.15);
  if (matchedGesture) {
    matchedGesture.getCommand().execute(sender);
  }
};

const backgroundHandlers: HandlerMap<BackgroundMessages> = {
  gestureChange: handleGestureChange,
  gestureEnd: handleGestureEnd,
};

registerHandlers(backgroundHandlers);
