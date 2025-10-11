import { MouseButton } from "@utils/types";

export function preventDefault(e: Event) {
  if (e.isTrusted) {
    e.preventDefault();
    e.stopPropagation();
  }
}

export function getDistance(x1: number, y1: number, x2: number, y2: number) {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function vectorDirectionDifference(
  V1X: number,
  V1Y: number,
  V2X: number,
  V2Y: number,
): number {
  let angleDifference = Math.atan2(V1X, V1Y) - Math.atan2(V2X, V2Y);

  if (angleDifference > Math.PI) {
    angleDifference -= 2 * Math.PI;
  } else if (angleDifference <= -Math.PI) {
    angleDifference += 2 * Math.PI;
  }

  return angleDifference / Math.PI;
}

export function matchesURL(url: string, urlPattern: string): boolean {
  const pattern = urlPattern.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, (match) =>
    match === "*" ? ".*" : "\\" + match,
  );

  const regex = new RegExp("^" + pattern + "$");
  return regex.test(url);
}

export const isEmpty = (obj: object) => Object.keys(obj).length === 0;

export function isHTTPURL(url: string | undefined | null): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// TODO: Maybe we can remove this
export function toSingleButton(b: number) {
  switch (b) {
    case MouseButton.LEFT:
      return 0;
    case MouseButton.RIGHT:
      return 2;
    case MouseButton.MIDDLE:
      return 1;
    default:
      return -1;
  }
}

export function isEmbeddedFrame() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

export function displayNotification(
  title: string,
  message: string,
  link?: string,
): void {
  const createNotification = chrome.notifications.create({
    type: "basic",
    iconUrl: "/images/iconx48.png",
    title,
    message,
  });

  if (!link) return;

  createNotification.then((notificationId) => {
    const handleNotificationClick = (id: string) => {
      if (id !== notificationId) return;

      chrome.tabs.create({ url: link, active: true });
      chrome.notifications.onClicked.removeListener(handleNotificationClick);
    };

    chrome.notifications.onClicked.addListener(handleNotificationClick);
  });
}
