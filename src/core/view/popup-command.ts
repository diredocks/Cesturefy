import { isEmbeddedFrame } from "@utils/common";
import { HandlerMap, PopupMessages, registerHandlers, Handler, waitForVoidMessage } from "@utils/message";

const PopupURL = new URL(chrome.runtime.getURL("/core/view/iframe-popup-command.html"));
const Popup: HTMLIFrameElement = document.createElementNS("http://www.w3.org/1999/xhtml", "iframe") as HTMLIFrameElement;
Popup.popover = "manual";

let mousePositionX = 0;
let mousePositionY = 0;

export default {
  get theme(): string | null {
    return PopupURL.searchParams.get("theme");
  },
  set theme(value: string | null) {
    if (value) PopupURL.searchParams.set("theme", value);
    else PopupURL.searchParams.delete("theme");
  },
};

const loadPopup: Handler<"popupRequest", PopupMessages> = async (msg) => {
  // if popup is still appended to DOM
  if (Popup.isConnected) {
    // trigger the terminate event in the iframe/popup via blur
    // wait for the popup termination message and its removal by the terminatePopup function
    // otherwise the termination message / terminatePopup function may remove the newly created popup
    await waitForVoidMessage("popupTermination");
    Popup.hidePopover();
    Popup.remove();
  }

  // popup is not working in a pure svg or other xml pages thus cancel the popup creation
  if (!document.body && document.documentElement.namespaceURI !== "http://www.w3.org/1999/xhtml") {
    return false;
  }

  Object.assign(Popup.style, {
    all: "initial",
    position: "fixed",
    top: "0",
    left: "0",
    border: "0",
    boxShadow: "1px 1px 4px rgba(0,0,0,0.3)",
    opacity: "0",
    transition: "opacity .3s",
    visibility: "hidden",
  });

  // This is needed because we use `module` in script element
  // making `Popup.onload` unrelieable
  const popupLoaded = waitForVoidMessage("popupReady");

  mousePositionX = msg.data.mousePositionX;
  mousePositionY = msg.data.mousePositionY;

  // appending the element to the DOM will start loading the iframe content
  const parent = document.body.tagName.toUpperCase() === "FRAMESET" ? document.documentElement : document.body;
  parent.appendChild(Popup);

  // required here because popovers are set to display=none which prevents iframe from loading
  Popup.showPopover();

  // navigate iframe (from about:blank to extension page) via window.location instead of setting the src
  // this prevents UUID leakage and therefore reduces potential fingerprinting
  // see https://bugzilla.mozilla.org/show_bug.cgi?id=1372288#c25
  Popup.contentWindow!.location = PopupURL.href;

  // return true when popup is loaded
  await popupLoaded;

  return true;
};

const initiatePopup: Handler<"popupInitiation", PopupMessages> = (msg) => {
  const docEl = document.documentElement;
  const body = document.body;

  const relativeScreenWidth = docEl.clientWidth || body.clientWidth || window.innerWidth;
  const relativeScreenHeight = docEl.clientHeight || body.clientHeight || window.innerHeight;

  // get the absolute maximum available height from the current position either from the top or bottom
  const maxAvailableHeight = Math.max(relativeScreenHeight - mousePositionY, mousePositionY);

  // get absolute list dimensions
  const width = msg.data.width;
  const height = Math.min(msg.data.height, maxAvailableHeight);

  // calculate absolute available space to the right and bottom
  const availableSpaceRight = relativeScreenWidth - mousePositionX;
  const availableSpaceBottom = relativeScreenHeight - mousePositionY;

  // get the ideal relative position based on the given available space and dimensions
  const x = availableSpaceRight >= width ? mousePositionX : mousePositionX - width;
  const y = availableSpaceBottom >= height ? mousePositionY : mousePositionY - height;

  // apply scale, position, dimensions to Popup / iframe and make it visible
  Popup.style.setProperty("width", `${Math.round(width)}px`, "important");
  Popup.style.setProperty("height", `${Math.round(height)}px`, "important");
  Popup.style.setProperty("transform-origin", "0 0", "important");
  Popup.style.setProperty("transform", `translate(${Math.round(x)}px, ${Math.round(y)}px)`, "important");
  Popup.style.setProperty("opacity", "1", "important");
  Popup.style.setProperty("visibility", "visible", "important");

  return { width, height };
};

const terminatePopup: Handler<"popupTermination", PopupMessages> = () => {
  Popup.hidePopover();
  Popup.remove();
  mousePositionX = 0;
  mousePositionY = 0;
};

const popupHandlers: HandlerMap<PopupMessages> = {
  popupRequest: loadPopup,
  popupInitiation: initiatePopup,
  popupTermination: terminatePopup,
};

// setup background/command message event listener for top frame
if (!isEmbeddedFrame()) {
  registerHandlers(popupHandlers);
}
