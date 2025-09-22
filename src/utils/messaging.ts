import { Vector } from "@utils/types";

export type BaseMessageMap = Record<string, any>;

export type Message<
  K extends keyof BaseMessageMap = keyof BaseMessageMap,
  M extends BaseMessageMap = BaseMessageMap
> = {
  subject: K;
  data: M[K];
};

export type BaseHandler<
  M extends BaseMessageMap = BaseMessageMap,
  K extends Extract<keyof M, string> = Extract<keyof M, string>
> = (
  msg: Message<K, M>,
  sender: chrome.runtime.MessageSender,
  res?: any
) => void;

// BackgroundMessage

export type BackgroundMessages = {
  gestureChange: Vector[];
  gestureEnd: Vector[];
};

export type BackgroundMessageSubject = keyof BackgroundMessages; // "gestureChange" | "gestureEnd"

export type BackgroundHandler<K extends BackgroundMessageSubject> = BaseHandler<BackgroundMessages, K>;

export type BackgroundHandlerMap = {
  [K in BackgroundMessageSubject]: BackgroundHandler<K>;
};
