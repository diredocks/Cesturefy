import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

interface ScrollSettings {
  duration?: number;
}

const injectedCode = (direction: "top" | "bottom", duration: number) => {
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

  const top = (el as any).scrollTop ?? 0;
  const max = (el.scrollHeight ?? 0) - (el.clientHeight ?? 0);
  const canScroll =
    direction === "top" ? top > 0 : top < max;

  if (canScroll) {
    const targetY = direction === "top" ? 0 : el.scrollHeight;
    scrollToY(targetY, duration, el);
  }
  return canScroll;
};

const createScrollFn = (direction: "top" | "bottom"): CommandFn<ScrollSettings> =>
  async function (sender) {
    if (!sender.tab?.id) return false;

    const duration = Number(this.getSetting("duration")) || 300;

    const results = await chrome.scripting.executeScript({
      target: { tabId: sender.tab.id, frameIds: [sender.frameId ?? 0] },
      func: injectedCode,
      args: [direction, duration],
      world: "MAIN",
    });

    return !!results?.[0]?.result;
  };

export const ScrollTop = defineCommand(
  createScrollFn("top"),
  { duration: 300 },
  "scroll",
  ["scripting"]
);

export const ScrollBottom = defineCommand(
  createScrollFn("bottom"),
  { duration: 300 },
  "scroll",
  ["scripting"]
);
