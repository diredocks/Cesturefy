// runtime.sendMessage will be route to content script
// due to broker in background script

import { PopupIframeMessages } from "@utils/message";

window.addEventListener("contextmenu", preventContextmenu, true);
window.addEventListener("pointerdown", preventAutoscroll, true);
window.addEventListener("DOMContentLoaded", handleDOMContentLoaded);

const handler = (port: chrome.runtime.Port) => {
  if (port.name === "popupConnection") {
    channel = port;
    channel.onMessage.addListener(initializePopup);
    channel.onDisconnect.addListener(terminatePopup);
  }
};

chrome.runtime.onConnect.addListener(handler);

let channel: chrome.runtime.Port | null = null;

const initializePopup = async (msg: PopupIframeMessages["popupConnection"]) => {
  const list = document.createElement("ul");
  list.id = "list";

  const itemTemplate = document.createElement("li");
  itemTemplate.classList.add("item");

  const icon = document.createElement("img");
  icon.alt = "\u200B";

  const text = document.createElement("span");
  itemTemplate.append(icon, text);

  for (const element of msg) {
    const item = itemTemplate.cloneNode(true) as HTMLLIElement;
    item.dataset.id = element.id;
    item.addEventListener("click", handleItemSelection);
    item.addEventListener("auxclick", handleItemSelection);

    if (element.icon) {
      // FIXME: fallback for null, this also fixes internal pages
      (item.firstElementChild as HTMLImageElement).src = element.icon;
    }
    (item.lastElementChild as HTMLSpanElement).textContent = element.label;
    list.append(item);
  }

  document.body.appendChild(list);

  const requiredDimensions = {
    width: list.offsetWidth,
    height: list.scrollHeight,
  };

  const response = await chrome.runtime.sendMessage({
    subject: "popupInitiation",
    data: requiredDimensions,
  });

  const availableDimensions = response;

  // If popup is above mouse, reverse the list so most recent is closest to cursor
  if (response.reverseList) {
    const items = Array.from(list.children);
    items.reverse();
    list.innerHTML = "";
    items.forEach((item) => list.appendChild(item));
    // Scroll to bottom so the most recent (now at bottom) is visible
    window.scrollTo(0, document.body.scrollHeight);
  }

  window.focus();
  window.onblur = terminatePopup;

  if (availableDimensions.height < requiredDimensions.height) {
    const buttonUp = document.createElement("div");
    buttonUp.classList.add("button", "up", "hidden");
    buttonUp.addEventListener("mouseover", handleScrollButtonMouseover);

    const buttonDown = document.createElement("div");
    buttonDown.classList.add("button", "down");
    buttonDown.addEventListener("mouseover", handleScrollButtonMouseover);

    window.addEventListener(
      "scroll",
      () => {
        const scrollTop = document.scrollingElement!.scrollTop;
        const isOnTop = scrollTop <= 0;
        buttonUp.classList.toggle("hidden", isOnTop);

        const isOnBottom =
          Math.round(scrollTop) >=
          Math.round(requiredDimensions.height - availableDimensions.height);
        buttonDown.classList.toggle("hidden", isOnBottom);
      },
      { passive: true },
    );

    document.body.append(buttonUp, buttonDown);
  }
};

const terminatePopup = () => {
  if (channel) {
    channel.disconnect();
    channel = null;
  }

  chrome.runtime.sendMessage({ subject: "popupTermination" });
};

function handleItemSelection(event: MouseEvent) {
  const el = event.currentTarget as HTMLElement | null;
  if (!el || !channel) return;
  channel.postMessage({
    button: event.button,
    id: el.dataset.id,
  });
  event.preventDefault();
}

function handleScrollButtonMouseover(event: MouseEvent) {
  const button = event.currentTarget as HTMLElement;
  const direction = button.classList.contains("up") ? -4 : 4;
  const startTimestamp = event.timeStamp;

  function step(timestamp: number) {
    if (!button.matches(":hover")) return;
    if (timestamp - startTimestamp > 300) window.scrollBy(0, direction);
    window.requestAnimationFrame(step);
  }
  window.requestAnimationFrame(step);
}

function preventContextmenu(event: MouseEvent) {
  event.preventDefault();
}

function preventAutoscroll(event: MouseEvent) {
  if (event.button === 1) event.preventDefault();
}

function handleDOMContentLoaded() {
  const urlParams = new URLSearchParams(window.location.search);
  const theme = urlParams.get("theme");
  if (theme) document.documentElement.classList.add(`${theme}-theme`);
  // once dom and script itself ready
  chrome.runtime.sendMessage({ subject: "popupReady" });
}
