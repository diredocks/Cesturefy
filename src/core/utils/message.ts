import Context from "@model/context";
import { Vectors } from "@utils/types";

export type MessageMap = Record<string, any>;

export type Message<K extends keyof M, M extends MessageMap = MessageMap> = {
  subject: K;
  data: M[K];
};

export type Handler<K extends keyof M, M extends MessageMap = MessageMap> = (
  msg: Message<K, M>,
  sender: chrome.runtime.MessageSender,
  res?: any,
) => void;

export type HandlerMap<M extends MessageMap> = {
  [K in keyof M]: Handler<K, M>;
};

export function registerHandlers<M extends MessageMap>(
  handlers: HandlerMap<M>,
) {
  chrome.runtime.onMessage.addListener(
    (m: Message<keyof M, M>, sender, sendResponse) => {
      const handler = handlers[m.subject];
      if (!handler) return;

      const result: any = handler(m as any, sender);
      // if async handler
      if (result instanceof Promise) {
        result
          .then(sendResponse)
          .catch((err) => sendResponse({ error: err?.message || err }));
        return true;
      }
      // else sync handler
      return sendResponse(result);
    },
  );
}

export function sendBackgroundMessage<
  K extends keyof M,
  M extends BackgroundMessages,
>(subject: K, data: M[K]) {
  const msg: Message<K, M> = { subject, data };
  return chrome.runtime.sendMessage(msg);
}

export function sendTabMessage<K extends keyof M, M extends ContentMessages>(
  tabId: number,
  subject: K,
  data: M[K],
  callback?: any,
) {
  const msg: Message<K, M> = { subject, data };
  return chrome.tabs.sendMessage(tabId, msg, callback);
}

export type BackgroundMessages = {
  gestureChange: { vectors: Vectors; context: Context };
  gestureEnd: { vectors: Vectors; context: Context };
  OSRequest: {};
  rockerLeft: { context: Context };
  rockerRight: { context: Context };
  wheelUp: { context: Context };
  wheelDown: { context: Context };
};

export type ContentMessages = {
  matchingGesture: string | null; // null possible due to not matched any gesture
  clipboardWriteText: string;
  clipboardReadText: {};
  clipboardWriteImage: string; // url to image
};

export function waitForVoidMessage(subject: string): Promise<any> {
  return new Promise<void>((resolve) => {
    const listener = (m: any, _sender: any, sendResponse: any) => {
      if (m.subject != subject) {
        return;
      }
      chrome.runtime.onMessage.removeListener(listener);
      resolve();
      // sendResponse is called to feed callback
      // fixes "...channel closed before a response was received"
      sendResponse(null);
    };
    chrome.runtime.onMessage.addListener(listener);
  });
}

export type PopupMessages = {
  popupRequest: { mousePositionX: number; mousePositionY: number };
  popupInitiation: { width: number; height: number };
  popupTermination: {};
};

export type PopupIframeMessages = {
  popupConnection: { id: string; label: string; icon?: string }[];
};
