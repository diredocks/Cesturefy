import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

interface ScrollPageSettings {
  duration?: number;
  scrollProportion?: number;
}

const injectedCode = (
  direction: "up" | "down",
  scrollRatio: number,
  duration: number
) => {
  const isScrollableY = (el: Element | null) =>
    !!el && (el.scrollHeight ?? 0) > (el.clientHeight ?? 0);

  const scrollToY = (y: number, duration: number, el: Element | null) => {
    if (!el) return;
    const start = (el as any).scrollTop ?? 0;
    const change = y - start;
    const startTime = performance.now();

    const step = (time: number) => {
      const elapsed = time - startTime;
      const t = duration > 0 ? Math.min(elapsed / duration, 1) : 1;
      (el as any).scrollTop = start + change * t;
      if (t < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  const getScrollableElement = () => {
    const target = (window as any).TARGET as Element | null | undefined;
    if (target && isScrollableY(target)) return target;
    const docEl = document.scrollingElement as Element | null;
    if (isScrollableY(docEl)) return docEl;
    return null;
  };

  const el = getScrollableElement();
  if (!el) return false;

  const maxScroll = (el.scrollHeight ?? 0) - (el.clientHeight ?? 0);
  const delta = scrollRatio * (el.clientHeight ?? 0) * (direction === "up" ? -1 : 1);
  let newScrollTop = (el.scrollTop ?? 0) + delta;
  newScrollTop = Math.max(0, Math.min(newScrollTop, maxScroll));

  if ((el.scrollTop ?? 0) !== newScrollTop) {
    scrollToY(newScrollTop, duration, el);
    return true;
  }
  return false;
};

const createScrollPageFn = (direction: "up" | "down"): CommandFn<ScrollPageSettings> =>
  async function (sender) {
    if (!sender.tab?.id) return false;

    const duration = Number(this.getSetting("duration")) || 300;
    const scrollRatio = (Number(this.getSetting("scrollProportion")) || 50) / 100;

    const results = await chrome.scripting.executeScript({
      target: { tabId: sender.tab.id, frameIds: [sender.frameId ?? 0] },
      func: injectedCode,
      args: [direction, scrollRatio, duration],
      world: "MAIN",
    });

    return !!results?.[0]?.result;
  };

export const ScrollPageUp = defineCommand(
  createScrollPageFn("up"),
  {
    duration: 100,
    scrollProportion: 95,
  },
  "scroll",
  ["scripting"]
);

export const ScrollPageDown = defineCommand(
  createScrollPageFn("down"),
  {
    duration: 100,
    scrollProportion: 95,
  },
  "scroll",
  ["scripting"]
);
