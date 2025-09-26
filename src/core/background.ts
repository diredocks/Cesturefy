import Gesture, { GestureJSON } from "@model/gesture";
import { DefaultConfig } from "@utils/config";
import { configManager } from "@utils/config-manager";
import { getGestureByPattern, MatchingAlgorithm } from "@utils/match";
import {
  Handler, HandlerMap,
  registerHandlers, sendTabMessage,
  BackgroundMessages, ContentMessages
} from "@utils/message";

let gestures: Gesture[];
// since pattern doesn't have a property to store
let tolerance: number = DefaultConfig.Settings.Gesture.deviationTolerance;
let algorithm: MatchingAlgorithm = DefaultConfig.Settings.Gesture.matchingAlgorithm;

const applyGestures = () => {
  gestures = (configManager.getPath(['Gestures']) as GestureJSON[]).map(g => new Gesture(g));
  tolerance = configManager.getPath(['Settings', 'Gesture', 'deviationTolerance']);
  algorithm = configManager.getPath(['Settings', 'Gesture', 'matchingAlgorithm']);
};

configManager.addEventListener('loaded', applyGestures);
configManager.addEventListener('change', applyGestures);

const handleGestureChange: Handler<"gestureChange", BackgroundMessages> = (m, sender) => {
  const matchedGesture = getGestureByPattern(m.data, gestures, tolerance, algorithm);
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
  const matchedGesture = getGestureByPattern(m.data, gestures, tolerance, algorithm);
  if (matchedGesture) {
    matchedGesture.getCommand().execute(sender);
  }
};

const backgroundHandlers: HandlerMap<BackgroundMessages> = {
  gestureChange: handleGestureChange,
  gestureEnd: handleGestureEnd,
};

registerHandlers(backgroundHandlers);
