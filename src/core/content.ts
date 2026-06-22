import { mouseController } from "@controller/mouse";
import { wheelController } from "@controller/wheel";
import { rockerController } from "@controller/rocker";
import { traceCommand } from "@view/trace-command";
import Pattern from "@utils/pattern";
import {
  Handler,
  HandlerMap,
  registerHandlers,
  sendBackgroundMessage,
  ContentMessages,
} from "@utils/message";
import { configManager } from "@model/config-manager";
import { DefaultConfig } from "@model/config";
import { matchesURL } from "@utils/common";
import Context, { MouseData } from "@model/context";
import popupCommand from "@view/popup-command";

const pattern = new Pattern();
let exclusions: string[] = DefaultConfig.Exclusions;
let displayTrace: boolean = DefaultConfig.Settings.Gesture.Trace.display;
let displayCommand: boolean = DefaultConfig.Settings.Gesture.Command.display;

let contextData: Context;
let gestureTargetElement: HTMLElement | null = null;

const applySettings = () => {
  mouseController.mouseButton = configManager.getPath([
    "Settings",
    "Gesture",
    "mouseButton",
  ]);
  mouseController.distanceThreshold = configManager.getPath([
    "Settings",
    "Gesture",
    "distanceThreshold",
  ]);
  mouseController.isTimeoutAbort = configManager.getPath([
    "Settings",
    "Gesture",
    "Timeout",
    "active",
  ]);
  mouseController.timeout = configManager.getPath([
    "Settings",
    "Gesture",
    "Timeout",
    "duration",
  ]);
  mouseController.suppressionKey = configManager.getPath([
    "Settings",
    "Gesture",
    "suppressionKey",
  ]);
  wheelController.mouseButton = configManager.getPath([
    "Settings",
    "Wheel",
    "mouseButton",
  ]);
  displayTrace = configManager.getPath([
    "Settings",
    "Gesture",
    "Trace",
    "display",
  ]);
  displayCommand = configManager.getPath([
    "Settings",
    "Gesture",
    "Command",
    "display",
  ]);
  exclusions = configManager.getPath(["Exclusions"]);
  popupCommand.theme = configManager.getPath(["Settings", "General", "theme"]);

  // NOTE: window.location.href is returning the frame URL for frames and not the tab URL
  const isExcluded = exclusions.some((url) =>
    matchesURL(window.location.href, url),
  );
  if (!isExcluded) {
    mouseController.enable();

    if (configManager.getPath(["Settings", "Rocker", "active"])) {
      rockerController.enable();
    } else {
      rockerController.disable();
    }

    if (configManager.getPath(["Settings", "Wheel", "active"])) {
      wheelController.enable();
    } else {
      wheelController.disable();
    }
  }
};

configManager.addEventListener("loaded", applySettings);
configManager.addEventListener("change", applySettings);

configManager.loaded.then(() => main());

async function main() {
  mouseController.currentOS = await sendBackgroundMessage("OSRequest", {});
}

mouseController.addEventListener("register", (_es, e) => {
  // collect contextual data, run as early as possible
  contextData = Context.fromEvent(e);
  const composedPath = e.composedPath();
  gestureTargetElement = (composedPath[0] ?? e.target) as HTMLElement;
});

mouseController.addEventListener("start", (es, e) => {
  if (displayTrace || displayCommand) {
    traceCommand.initialize(e.clientX, e.clientY);
  }

  const coalescedEvents = es.flatMap((e) => {
    const es = e.getCoalescedEvents?.();
    // if events is null/undefined or empty (length == 0) return plain event
    return es?.length > 0 ? es : [e];
  });

  mouseGestureUpdate(coalescedEvents);
});

mouseController.addEventListener("update", (_es, e) => {
  const coalescedEvents = e.getCoalescedEvents?.() ?? [e];
  mouseGestureUpdate(coalescedEvents);
});

mouseController.addEventListener("end", (_es, e) => {
  traceCommand.terminate(); // safe to call even if its not displayed

  // set last mouse event as endpoint
  contextData.mouse = new MouseData({ x: e.clientX, y: e.clientY });
  sendBackgroundMessage("gestureEnd", {
    vectors: pattern.getPattern(),
    context: contextData,
  });

  pattern.clear();
});

mouseController.addEventListener("abort", (_es) => {
  traceCommand.terminate();
  pattern.clear();
});

function mouseGestureUpdate(es: PointerEvent[]) {
  for (const e of es) {
    const patternChange = pattern.addPoint(e.clientX, e.clientY);
    if (patternChange && displayCommand) {
      sendBackgroundMessage("gestureChange", {
        vectors: pattern.getPattern(),
        context: contextData,
      });
    }
  }

  if (displayTrace) {
    const points = es.map((e) => ({ x: e.clientX, y: e.clientY }));
    traceCommand.updateTrace(points);
  }
}

rockerController.addEventListener("rockerright", () => {
  sendBackgroundMessage("rockerRight", { context: contextData });
});

rockerController.addEventListener("rockerleft", () => {
  sendBackgroundMessage("rockerLeft", { context: contextData });
});

wheelController.addEventListener("wheelup", () => {
  sendBackgroundMessage("wheelUp", { context: contextData });
});

wheelController.addEventListener("wheeldown", () => {
  sendBackgroundMessage("wheelDown", { context: contextData });
});

const handleMatchingGesture: Handler<"matchingGesture", ContentMessages> = (
  m,
) => {
  traceCommand.updateCommand(m.data);
};

const handleClipboardWriteText: Handler<
  "clipboardWriteText",
  ContentMessages
> = async (m) => {
  await navigator.clipboard.writeText(m.data);
};

const handleClipboardReadText: Handler<
  "clipboardReadText",
  ContentMessages
> = async () => {
  return await navigator.clipboard.readText();
};

const handleClipboardWriteImage: Handler<
  "clipboardWriteImage",
  ContentMessages
> = async (m) => {
  const response = await fetch(m.data);
  const mimeType = response.headers.get("Content-Type") || "image/png";

  let blob: Blob;

  if (mimeType === "image/png" || mimeType === "image/jpeg") {
    blob = await response.blob();
  } else {
    // convert from other formats to PNG
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous"; // CORS
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = m.data;
    });
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0);
    blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), "image/png"),
    );
  }

  // FIXME: this doesn't work soemtimes like in Wikipedia and idk why
  await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
};

function insertTextAtCaret(text: string, target: HTMLElement | null): boolean {
  if (
    (target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement) &&
    !target.disabled &&
    !target.readOnly
  ) {
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    const value = target.value;

    target.value = value.slice(0, start) + text + value.slice(end);
    target.selectionStart = target.selectionEnd = start + text.length;
    target.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }

  if (target?.isContentEditable) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const node = document.createTextNode(text);
    range.insertNode(node);
    range.setStartAfter(node);
    range.setEndAfter(node);
    selection.removeAllRanges();
    selection.addRange(range);

    target.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }

  return false;
}

const handleInsertText: Handler<"insertText", ContentMessages> = (m) => {
  insertTextAtCaret(m.data, gestureTargetElement);
};

const contentHandlers: HandlerMap<ContentMessages> = {
  matchingGesture: handleMatchingGesture,
  clipboardWriteText: handleClipboardWriteText,
  clipboardReadText: handleClipboardReadText,
  clipboardWriteImage: handleClipboardWriteImage,
  insertText: handleInsertText,
};

registerHandlers(contentHandlers);
