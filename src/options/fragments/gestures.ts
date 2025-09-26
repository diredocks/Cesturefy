import { PopupBox } from "@options/components/popup-box";
import { ContentLoaded } from "@options/index";
import { GestureJSON } from "@model/gesture";
import { configManager } from "@utils/config-manager";
import { Vectors } from "@utils/types";
import { createGestureThumbnail } from "@options/utils/common";
import { mouseController } from "@controller/mouse";
import { getGestureByPattern } from "@utils/match";
import Gesture from "@model/gesture";

ContentLoaded.then(main);

let currentItem: Gesture | null = null;
let currentPopupPattern: Vectors | null = null;
const Gestures = new Map();

function main() {
  const gesturePopup = document.getElementById("gesturePopup")!;
  gesturePopup.onclose = onGesturePopupClose;
  const newGestureButton = document.getElementById("gestureAddButton")!;
  newGestureButton.onclick = onAddButtonClick;

  // create and add all existing gesture items
  const fragment = document.createDocumentFragment();
  for (let gestureJSON of (configManager.get('Gestures') as GestureJSON[])) {
    const gesture = new Gesture(gestureJSON);
    const gestureListItem = createGestureListItem(gesture);
    // use the reference to the gestureItem as the Map key to the gesture object
    Gestures.set(gestureListItem, gesture);
    fragment.prepend(gestureListItem);
  }
  const gestureList = document.getElementById("gestureContainer")!;
  gestureList.appendChild(fragment);
  gestureList.dataset.noResultsHint = chrome.i18n.getMessage('gestureHintNoSearchResults');

}

function onAddButtonClick() {
  currentItem = null;
  openGesturePopup();
}

function openGesturePopup(gesture?: Gesture): void {
  const gesturePopup = document.getElementById("gesturePopup") as PopupBox;
  const heading = gesturePopup.querySelector<HTMLElement>("#gesturePopupHeading")!;
  const commandSelect = gesturePopup.querySelector<HTMLSelectElement & { command?: unknown }>("#gesturePopupCommandSelect")!;
  const labelInput = gesturePopup.querySelector<HTMLInputElement>("#gesturePopupLabelInput")!;
  const patternContainer = gesturePopup.querySelector<HTMLElement>("#gesturePopupPatternContainer")!;

  const currentUserMouseButton = configManager.get("Settings.Gesture.mouseButton") as number;
  const mouseButtonLabelMap: Record<number, string> = {
    1: "gesturePopupMouseButtonLeft",
    2: "gesturePopupMouseButtonRight",
    4: "gesturePopupMouseButtonMiddle",
  };

  patternContainer.classList.remove("alert");
  patternContainer.dataset.gestureRecordingHint = chrome.i18n.getMessage(
    "gesturePopupRecordingAreaText",
    chrome.i18n.getMessage(mouseButtonLabelMap[currentUserMouseButton])
  );
  patternContainer.title = "";

  // TODO: set currentUserMouseButton;
  mouseController.enable();

  if (gesture) {
    heading.textContent = chrome.i18n.getMessage("gesturePopupTitleEditGesture");
    commandSelect.command = gesture.getCommand();
    labelInput.placeholder = gesture.getCommand().toString();
    labelInput.value = gesture.getLabel() ?? "";
    currentPopupPattern = gesture.getPattern();

    const thumbnail = createGestureThumbnail(gesture.getPattern());
    patternContainer.append(thumbnail);

    const mostSimilarGesture = getGestureByPattern(currentPopupPattern, [gesture]);
    if (mostSimilarGesture) {
      patternContainer.classList.add("alert");
      patternContainer.title = chrome.i18n.getMessage(
        "gesturePopupNotificationSimilarGesture",
        mostSimilarGesture.toString()
      );
    } else {
      patternContainer.classList.remove("alert");
      patternContainer.title = patternContainer.dataset.gestureRecordingHint ?? "";
    }
  } else {
    heading.textContent = chrome.i18n.getMessage("gesturePopupTitleNewGesture");
    commandSelect.command = null;
    labelInput.value = "";
    labelInput.placeholder = "";
    patternContainer.innerHTML = "";
  }

  gesturePopup.open = true;
}

function onGesturePopupClose(): void {
  mouseController.disable();
  currentPopupPattern = null;

  const gesturePopup = document.getElementById("gesturePopup") as PopupBox;
  const heading = gesturePopup.querySelector<HTMLElement>("#gesturePopupHeading")!;
  const commandSelect = gesturePopup.querySelector<HTMLSelectElement & { command?: unknown }>("#gesturePopupCommandSelect")!;
  const labelInput = gesturePopup.querySelector<HTMLInputElement>("#gesturePopupLabelInput")!;
  const patternContainer = gesturePopup.querySelector<HTMLElement>("#gesturePopupPatternContainer")!;

  heading.textContent = chrome.i18n.getMessage("gesturePopupTitleNewGesture");
  commandSelect.command = null;
  labelInput.value = "";
  labelInput.placeholder = "";
  patternContainer.innerHTML = "";
}

function createGestureListItem(gesture: Gesture): HTMLLIElement {
  const li = document.createElement("li");
  li.addEventListener('pointerover', onItemPointerenter);
  li.addEventListener('pointerleave', onItemPointerleave);
  li.addEventListener('click', onItemClick);
  li.classList.add("gl-item");

  const thumbnail = createGestureThumbnail(gesture.getPattern());
  thumbnail.classList.add("gl-thumbnail");

  const commandField = document.createElement("div");
  commandField.classList.add("gl-command");
  commandField.textContent = gesture.toString();

  const removeButton = document.createElement("button");
  removeButton.classList.add("gl-remove-button", "icon-delete");

  li.append(thumbnail, commandField, removeButton);
  return li;
}

function onItemPointerenter(this: HTMLElement, _e: Event) {
  if (!this.classList.contains("demo")) {
    // add delay so it only triggers if the mouse stays on the item
    setTimeout(() => {
      if (this.matches(":hover")) this.classList.add("demo");
    }, 200);
  }
}

function onItemPointerleave(this: HTMLElement, _e: Event) {
  const animations = this.querySelector(".gl-thumbnail-trail")!.getAnimations();
  const animationsAreRunning = animations.some(animation => animation.playState === "running");
  if (this.classList.contains("demo")) {
    if (!animationsAreRunning) {
      this.classList.remove("demo");
    }
    else {
      this.querySelector(".gl-thumbnail-trail")!
        .addEventListener("animationend", () => {
          this.classList.remove("demo"), { once: true }
        });
    }
  }
}

function onItemClick(this: HTMLElement, e: MouseEvent) {
  const target = e.target as HTMLElement | null;

  // if delete button received the click
  if (target?.classList.contains("gl-remove-button")) {
    // remove gesture object and gesture list item
    Gestures.delete(this);
    removeGestureListItem(this);

    // update config
    configManager.setPath(['Gestures'],
      Array.from(Gestures.values())
        .map(g => g.toJSON())
    );
  } else {
    // open gesture popup and hold reference to current item
    currentItem = Gestures.get(this);
    // open gesture popup and pass related gesture object
    openGesturePopup(Gestures.get(this));
  }
}

function removeGestureListItem(gestureListItem: HTMLElement): void {
  const gestureList = document.getElementById("gestureContainer") as HTMLElement | null;
  if (!gestureList) return;

  // get child index for current gesture item
  const gestureItemIndex = Array.prototype.indexOf.call(gestureList.children, gestureListItem);

  // select all visible gesture items starting from given gesture item index
  const gestureItems = gestureList.querySelectorAll<HTMLElement>(
    `.gl-item:not([hidden]):nth-child(n + ${gestureItemIndex + 1})`
  );

  // cache all grid item positions
  const itemPositionCache = new Map<HTMLElement, { x: number; y: number }>();
  gestureItems.forEach(gestureItem => {
    itemPositionCache.set(gestureItem, {
      x: gestureItem.offsetLeft,
      y: gestureItem.offsetTop,
    });
  });

  // remove styles after transition
  const handleTransitionEnd = (event: TransitionEvent) => {
    const target = event.currentTarget as HTMLElement;
    target.style.removeProperty("transition");
    target.style.removeProperty("transform");
    target.removeEventListener("transitionend", handleTransitionEnd);
  };

  // remove element on animation end
  const handleAnimationEnd = (event: AnimationEvent) => {
    const target = event.currentTarget as HTMLElement;
    if (event.animationName === "animateRemoveItem") {
      target.remove();
      target.removeEventListener("animationend", handleAnimationEnd);
    }
  };

  // skip the first/current gesture item and loop through following siblings
  for (let i = 1; i < gestureItems.length; i++) {
    const currentGestureItem = gestureItems[i];
    const previousGestureItem = gestureItems[i - 1];
    const currentItemPosition = itemPositionCache.get(currentGestureItem)!;
    const previousItemPosition = itemPositionCache.get(previousGestureItem)!;

    currentGestureItem.addEventListener("transitionend", handleTransitionEnd);
    currentGestureItem.style.setProperty(
      "transform",
      `translate(${previousItemPosition.x - currentItemPosition.x}px, ${previousItemPosition.y - currentItemPosition.y}px)`
    );
    currentGestureItem.style.setProperty("transition", "transform 0.3s");
  }

  gestureListItem.addEventListener("animationend", handleAnimationEnd);
  gestureListItem.classList.add("gl-item-animate-remove");
}
