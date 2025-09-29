import { Point } from "@utils/types";

export default class Context {
  constructor(
    public target: ElementData,
    public mouse: MouseData,
    public link?: LinkData,
    public selection?: SelectionData,
  ) { }

  static fromEvent(event: MouseEvent): Context {
    const composedPath = event.composedPath();
    const rawTarget = (composedPath[0] ?? event.target) as HTMLElement;

    const img = getImageFromPoint(event.clientX, event.clientY);

    const target = img ?? rawTarget;

    const link = composedPath.find(
      (el) => el instanceof HTMLAnchorElement || el instanceof HTMLAreaElement
    );

    const imageData = img
      ? new ImageData(
        img.currentSrc || img.src,
        img.title,
        img.alt,
      )
      : undefined;

    const linkData = link
      ? new LinkData(
        link.href,
        link.title,
        link.textContent?.trim(),
      )
      : undefined

    return new Context(
      new ElementData(
        target.nodeName,
        target.textContent?.trim() ?? "",
        imageData,
      ),
      new MouseData({
        x: event.clientX,
        y: event.clientY,
      }),
      linkData,
      SelectionData.fromWindow(),
    );
  }
}

export class ElementData {
  constructor(
    public nodeName: string,
    public textContent: string,
    public imageData?: ImageData,
  ) { }
}

export class ImageData {
  constructor(
    public src: string,
    public title: string,
    public alt: string,
  ) { }
}

export class LinkData {
  constructor(
    public href: string,
    public title: string,
    public textContent: string,
  ) { }
}

export class SelectionData {
  constructor(public text: string = "") { }

  static fromWindow(): SelectionData {
    return new SelectionData(SelectionData._getTextSelection());
  }

  /** returns the selected text, if no text is selected it will return an empty string */
  private static _getTextSelection(): string {
    const active = document.activeElement as HTMLInputElement | null;

    if (
      active &&
      typeof active.selectionStart === "number" &&
      typeof active.selectionEnd === "number"
    ) {
      return active.value.slice(active.selectionStart, active.selectionEnd);
    }

    return window.getSelection()?.toString() ?? "";
  }
}

export class MouseData {
  constructor(public endpoint: Point) { }
}

function getImageFromPoint(
  x: number,
  y: number,
  root: HTMLElement | null = null,
  maxDepth = 5
): HTMLImageElement | null {

  // WARN: in some condition it just cannot get image lol

  if (maxDepth <= 0) return null;

  const el = document.elementFromPoint(x, y) as HTMLElement | null;
  if (!el) return null;

  if (el instanceof HTMLImageElement) return el;

  // if <picture> includes <img>
  if (el.tagName.toLowerCase() === "picture") {
    const img = el.querySelector("img");
    if (img) return img;
  }

  // if sub-elements hit
  const originalPointerEvents = el.style.pointerEvents;
  el.style.pointerEvents = "none";
  const nestedEl = document.elementFromPoint(x, y) as HTMLElement | null;
  el.style.pointerEvents = originalPointerEvents;

  if (nestedEl instanceof HTMLImageElement) return nestedEl;
  if (nestedEl?.tagName.toLowerCase() === "picture") {
    const img = nestedEl.querySelector("img");
    if (img) return img;
  }

  // if sub-level elements hit
  const parent = el.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children).filter((c) => c !== el) as HTMLElement[];
    for (const sibling of siblings) {
      if (sibling instanceof HTMLImageElement) return sibling;
      if (sibling.tagName.toLowerCase() === "picture") {
        const img = sibling.querySelector("img");
        if (img) return img;
      }
    }
  }

  // if nested element is not current element
  if (nestedEl && nestedEl !== el) {
    return getImageFromPoint(x, y, root, maxDepth - 1);
  }

  return null;
}
