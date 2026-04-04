import type { ClosedTabWindow } from "@utils/types";

const closedTabWindows: ClosedTabWindow[] = [];

export function rememberClosedTabWindow(
  closedTabWindow: ClosedTabWindow,
): void {
  closedTabWindows.unshift(closedTabWindow);
}

export function takeClosedTabWindowByWindowId(
  windowId: number,
): ClosedTabWindow | undefined {
  const targetIndex = closedTabWindows.findIndex(
    (closed) => closed.windowId === windowId,
  );

  if (targetIndex < 0) {
    return undefined;
  }

  const [target] = closedTabWindows.splice(targetIndex, 1);
  return target;
}
