import type { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

interface ScrollBottomSettings {
  duration?: number;
}

const fn: CommandFn<ScrollBottomSettings> = async function (sender) {
  // Only proceed if there is a valid tab id
  if (!sender.tab?.id) return false;

  const duration = Number(this.getSetting("duration")) || 300;

  // Inject into the main frame (frameId 0)
  const results = await chrome.scripting.executeScript({
    target: { tabId: sender.tab.id, frameIds: [0] },
    func: (duration: number) => {
      // Helper: check if an element is vertically scrollable
      const isScrollableY = (el: Element | null) =>
        !!el && (el.scrollHeight ?? 0) > (el.clientHeight ?? 0);

      // Helper: smoothly scroll to a specific y position
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

      // Try scrolling TARGET if defined and scrollable, otherwise fallback to document.scrollingElement
      const target = (window as any).TARGET as Element | null | undefined;
      let scrollable: Element | null = null;

      if (target && isScrollableY(target)) {
        scrollable = target;
      } else {
        const docEl = document.scrollingElement as Element | null;
        if (isScrollableY(docEl)) scrollable = docEl;
      }

      if (!scrollable) return false;

      const canScrollBottom =
        ((scrollable as any).scrollTop ?? 0) < ((scrollable as any).scrollHeight - scrollable.clientHeight);
      if (canScrollBottom) scrollToY(scrollable.scrollHeight, duration, scrollable);

      return Boolean(canScrollBottom);
    },
    args: [duration],
    world: "MAIN",
  });

  // Take the result from the main frame
  const first = results?.[0]?.result;
  const didScroll = (typeof first === "boolean" ? first : false) as boolean;

  return didScroll;
};

export const ScrollBottom = defineCommand(
  fn,
  {
    duration: 300,
  },
  'scroll',
  ['scripting']
);
