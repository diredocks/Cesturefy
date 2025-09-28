import { Vectors } from "@utils/types";

export type MessageMap = Record<string, any>;

export type Message<
  K extends keyof M,
  M extends MessageMap = MessageMap
> = {
  subject: K;
  data: M[K];
};

export type Handler<
  K extends keyof M,
  M extends MessageMap = MessageMap
> = (
  msg: Message<K, M>,
  sender: chrome.runtime.MessageSender,
  res?: any
) => void;

export type HandlerMap<M extends MessageMap> = {
  [K in keyof M]: Handler<K, M>;
};

export function registerHandlers<M extends MessageMap>(
  handlers: HandlerMap<M>
) {
  chrome.runtime.onMessage.addListener(
    (m: Message<keyof M, M>, sender, res) => {
      const handler = handlers[m.subject];
      if (handler) handler(m as any, sender, res);
    }
  );
}

export function sendBackgroundMessage<
  K extends keyof M,
  M extends MessageMap
>(subject: K, data: M[K]) {
  const msg: Message<K, M> = { subject, data };
  return chrome.runtime.sendMessage(msg);
}

export function sendTabMessage<
  K extends keyof M,
  M extends MessageMap
>(tabId: number, subject: K, data: M[K]) {
  const msg: Message<K, M> = { subject, data };
  return chrome.tabs.sendMessage(tabId, msg);
}

export type BackgroundMessages = {
  gestureChange: Vectors;
  gestureEnd: Vectors;
  OSRequest: boolean;
};

export type ContentMessages = {
  matchingGesture: string | null; // NOTE: null possible due to not matched any gesture
  currentOS: string;
};
