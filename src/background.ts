import { Message, BackgroundMessages, BackgroundHandlerMap, BackgroundHandler } from "@utils/messaging";

const handleGestureChange: BackgroundHandler<'gestureChange'> = (m, sender) => {
  console.log(m.data);
};

const handleGestureEnd: BackgroundHandler<'gestureEnd'> = (m, sender) => {
  console.log(m.data);
};

const backgroundHandlers: BackgroundHandlerMap = {
  gestureChange: handleGestureChange,
  gestureEnd: handleGestureEnd,
};

chrome.runtime.onMessage.addListener(
  <K extends keyof BackgroundMessages>(
    m: Message<K, BackgroundMessages>,
    sender: chrome.runtime.MessageSender,
    res: any
  ) => {
    backgroundHandlers[m.subject](m, sender, res);
  }
);
