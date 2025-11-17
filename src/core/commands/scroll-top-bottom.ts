import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";
import Context from "@model/context";

interface ScrollSettings {
  duration?: number;
}

const injectedCode = (
  direction: "top" | "bottom",
  duration: number,
  context: Context,
) => {
  const isScrollableY = (element: Element | null): boolean => {
    if (!(element instanceof Element)) {
      return false;
    }

    const style = window.getComputedStyle(element);

    if (
      element.scrollHeight > element.clientHeight &&
      style.overflowY !== "hidden" &&
      style.overflowY !== "clip"
    ) {
      if (element === document.scrollingElement) {
        return true;
      } else if (element.tagName.toLowerCase() === "textarea") {
        return true;
      } else if (style.overflowY !== "visible" && style.display !== "inline") {
        if (element === document.body) {
          const parentStyle = window.getComputedStyle(element.parentElement!);
          if (
            parentStyle.overflowY !== "visible" &&
            parentStyle.overflowY !== "clip"
          ) {
            return true;
          }
        } else {
          return true;
        }
      }
    }

    return false;
  };

  const getClosestScrollableParent = (
    startNode: Element | null,
  ): Element | null => {
    let node: Element | null = startNode;

    while (node != null && !isScrollableY(node)) {
      node =
        node.parentElement ??
        (node.parentNode instanceof ShadowRoot ? node.parentNode.host : null);
    }

    return node;
  };

  const scrollToY = (y: number, duration: number, el: Element) => {
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

  const getAllScrollableElements = (root = document.body): Element[] => {
    const scrollables: Element[] = [];

    const traverse = (node: Element) => {
      if (isScrollableY(node)) scrollables.push(node);
      Array.from(node.children).forEach((child) => traverse(child as Element));
    };

    traverse(root);
    return scrollables;
  };

  const getScrollableElement = () => {
    const target = getClosestScrollableParent(
      document.elementFromPoint(
        context.mouse.endpoint.x,
        context.mouse.endpoint.y,
      ),
    );
    if (target) return target;

    const scrollables = getAllScrollableElements();
    return scrollables.length > 0 ? scrollables[0] : null;
  };

  const el = getScrollableElement();
  if (!el) return false;

  const top = (el as any).scrollTop ?? 0;
  const max = (el.scrollHeight ?? 0) - (el.clientHeight ?? 0);
  const canScroll = direction === "top" ? top > 0 : top < max;

  if (canScroll) {
    const targetY = direction === "top" ? 0 : el.scrollHeight;
    scrollToY(targetY, duration, el);
  }
  return canScroll;
};

const createScrollFn = (
  direction: "top" | "bottom",
): CommandFn<ScrollSettings> =>
  async function (sender, context) {
    if (!sender.tab?.id) return false;

    const duration = Number(this.getSetting("duration")) || 300;

    const results = await chrome.scripting.executeScript({
      target: { tabId: sender.tab.id, frameIds: [sender.frameId ?? 0] },
      func: injectedCode,
      args: [direction, duration, context!],
      world: "MAIN",
    });

    return !!results?.[0]?.result;
  };

export const ScrollTop = defineCommand(
  createScrollFn("top"),
  { duration: 300 },
  "scroll",
  ["scripting"],
);

export const ScrollBottom = defineCommand(
  createScrollFn("bottom"),
  { duration: 300 },
  "scroll",
  ["scripting"],
);
