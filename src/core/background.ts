import Gesture from "@model/gesture";
import { getGestureByPattern } from "@utils/match";
import {
  Handler, HandlerMap,
  registerHandlers, sendTabMessage,
  BackgroundMessages, ContentMessages
} from "@utils/message";

const gesturesJson = [
  {
    pattern: [[1, 0]],
    command: { name: 'CloseTab', settings: { nextFocus: 'next' } },
  },
  {
    pattern: [[-1, 0]],
    command: { name: 'NewTab', settings: { position: 'end' } },
  },
  {
    pattern: [[1, -1]],
    command: { name: 'DuplicateTab', settings: { position: 'start', focusPrevTab: true } },
  },
];
const gestures: Gesture[] = gesturesJson.map(g => Gesture.fromJSON(g));

const handleGestureChange: Handler<"gestureChange", BackgroundMessages> = (m, sender) => {
  const matchedGesture = getGestureByPattern(m.data, gestures, 0.15);
  if (!sender.tab?.id) {
    return;
  }
  sendTabMessage<"matchingGesture", ContentMessages>(
    sender.tab.id,
    "matchingGesture",
    (matchedGesture !== null) ? matchedGesture.getLabel() : null,
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
