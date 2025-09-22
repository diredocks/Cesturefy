import {
  Handler, HandlerMap,
  registerHandlers, sendTabMessage,
  BackgroundMessages, ContentMessages
} from "@utils/messaging/messagingB";

const handleGestureChange: Handler<"gestureChange", BackgroundMessages> = (m, sender) => {
  if (sender.tab?.id) {
    sendTabMessage<"matchingGesture", ContentMessages>(
      sender.tab.id,
      "matchingGesture",
      "Hello"
    );
  }
};

const handleGestureEnd: Handler<"gestureEnd", BackgroundMessages> = (m) => {
  console.log("gesture ended", m.data);
};

const backgroundHandlers: HandlerMap<BackgroundMessages> = {
  gestureChange: handleGestureChange,
  gestureEnd: handleGestureEnd,
};

registerHandlers(backgroundHandlers);
