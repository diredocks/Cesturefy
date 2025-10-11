// TODO: spilit popup and item
import { PopupBox } from "@options/components/popup-box";
import { ContentLoaded } from "@options/index";
import { GestureJSON } from "@model/gesture";
import { configManager } from "@model/config-manager";
import { Vectors } from "@utils/types";
import { createGestureThumbnail } from "@options/utils/common";
import { mouseController } from "@controller/mouse";
import { matcher } from "@utils/match";
import Gesture from "@model/gesture";
import { CommandSelect } from "@options/components/command-select";
import Pattern from "@utils/pattern";
import { sendBackgroundMessage } from "@utils/message";

ContentLoaded.then(main);

let currentItem: HTMLElement | null = null;
let currentPopupPattern: Vectors | null = null;
const GestureMap: Map<HTMLElement, Gesture> = new Map();

function main() {
  const gesturePopup = document.getElementById("gesturePopup") as PopupBox;
  gesturePopup.addEventListener("close", onGesturePopupClose);

  const gesturePopupForm = document.getElementById(
    "gesturePopupForm",
  ) as HTMLFormElement;
  gesturePopupForm.addEventListener("submit", onGesturePopupFormSubmit);

  const gesturePopupCommandSelect = document.getElementById(
    "gesturePopupCommandSelect",
  ) as CommandSelect;
  gesturePopupCommandSelect.addEventListener("change", onCommandSelectChange);

  const newGestureButton = document.getElementById(
    "gestureAddButton",
  ) as HTMLButtonElement;
  newGestureButton.addEventListener("click", onAddButtonClick);

  const gestureSearchToggleButton = document.getElementById(
    "gestureSearchToggleButton",
  ) as HTMLButtonElement;
  gestureSearchToggleButton.addEventListener("click", onSearchToggle);

  const gestureSearchInput = document.getElementById(
    "gestureSearchInput",
  ) as HTMLInputElement;
  gestureSearchInput.addEventListener("input", onSearchInput);
  gestureSearchInput.placeholder = chrome.i18n.getMessage(
    "gestureSearchPlaceholder",
  );

  // create and add all existing gesture items
  const fragment = document.createDocumentFragment();
  for (let gestureJSON of configManager.getPath([
    "Gestures",
  ]) as GestureJSON[]) {
    const gesture = new Gesture(gestureJSON);
    const gestureListItem = createGestureListItem(gesture);
    // use the reference to the gestureItem as the Map key to the gesture object
    GestureMap.set(gestureListItem, gesture);
    fragment.prepend(gestureListItem);
  }
  const gestureList = document.getElementById("gestureContainer")!;
  gestureList.appendChild(fragment);
  gestureList.dataset.noResultsHint = chrome.i18n.getMessage(
    "gestureHintNoSearchResults",
  );

  // add mouse gesture controller event listeners
  mouseGestureControllerSetup();
}

function onSearchToggle() {
  const gestureSearchForm = document.getElementById(
    "gestureSearchForm",
  )! as HTMLFormElement;
  const gestureSearchInput = document.getElementById("gestureSearchInput")!;

  if (gestureSearchForm.classList.toggle("show")) {
    gestureSearchInput.focus();
  } else {
    gestureSearchForm.reset();
    onSearchInput();
  }
}

function onSearchInput() {
  const gestureList = document.getElementById("gestureContainer")!;
  const gestureAddButtonItem =
    gestureList.firstElementChild as HTMLButtonElement;
  const searchQuery = (
    document.getElementById("gestureSearchInput")! as HTMLInputElement
  ).value
    .toLowerCase()
    .trim();
  const searchQueryKeywords = searchQuery.split(" ");

  for (const [gestureListItem, gesture] of GestureMap) {
    // get the gesture string and transform all letters to lower case
    const gestureString = gesture.toString().toLowerCase();
    // check if all keywords are matching the command name
    const isMatching = searchQueryKeywords.every((keyword) =>
      gestureString.includes(keyword),
    );
    // hide all unmatching commands and show all matching commands
    gestureListItem.hidden = !isMatching;
  }

  // hide gesture add button item on search input
  gestureAddButtonItem.hidden = !!searchQuery;

  // toggle "no search results" hint if all items are hidden
  gestureList.classList.toggle(
    "empty",
    !gestureList.querySelectorAll(".gl-item:not([hidden])").length,
  );
}

function onAddButtonClick() {
  currentItem = null;
  openGesturePopup();
}

async function openGesturePopup(gesture?: Gesture) {
  const gesturePopup = document.getElementById("gesturePopup") as PopupBox;
  const heading = gesturePopup.querySelector<HTMLElement>(
    "#gesturePopupHeading",
  )!;
  const commandSelect = gesturePopup.querySelector<
    HTMLSelectElement & { command?: unknown }
  >("#gesturePopupCommandSelect")!;
  const labelInput = gesturePopup.querySelector<HTMLInputElement>(
    "#gesturePopupLabelInput",
  )!;
  const patternContainer = gesturePopup.querySelector<HTMLElement>(
    "#gesturePopupPatternContainer",
  )!;

  const currentUserMouseButton = configManager.getPath([
    "Settings",
    "Gesture",
    "mouseButton",
  ]) as number;
  const mouseButtonLabelMap: Record<number, string> = {
    1: "gesturePopupMouseButtonLeft",
    2: "gesturePopupMouseButtonRight",
    4: "gesturePopupMouseButtonMiddle",
  };

  patternContainer.classList.remove("alert");
  patternContainer.dataset.gestureRecordingHint = chrome.i18n.getMessage(
    "gesturePopupRecordingAreaText",
    chrome.i18n.getMessage(mouseButtonLabelMap[currentUserMouseButton]),
  );
  patternContainer.title = "";

  mouseController.mouseButton = configManager.getPath([
    "Settings",
    "Gesture",
    "mouseButton",
  ]);
  mouseController.currentOS = await sendBackgroundMessage("OSRequest", {});
  mouseController.enable();

  if (gesture) {
    heading.textContent = chrome.i18n.getMessage(
      "gesturePopupTitleEditGesture",
    );
    commandSelect.command = gesture.getCommand();
    labelInput.placeholder = gesture.getCommand().toString();
    labelInput.value = gesture.getLabel() ?? "";
    currentPopupPattern = gesture.getPattern();

    const thumbnail = createGestureThumbnail(gesture.getPattern());
    patternContainer.append(thumbnail);

    // exclude current gesture pattern
    const mostSimilarGesture = matcher.getGestureByPattern(
      currentPopupPattern,
      Array.from(GestureMap.values()).filter((g) => g !== gesture),
    );
    if (mostSimilarGesture) {
      patternContainer.classList.add("alert");
      patternContainer.title = chrome.i18n.getMessage(
        "gesturePopupNotificationSimilarGesture",
        mostSimilarGesture.toString(),
      );
    } else {
      patternContainer.classList.remove("alert");
      patternContainer.title =
        patternContainer.dataset.gestureRecordingHint ?? "";
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
  const heading = gesturePopup.querySelector<HTMLElement>(
    "#gesturePopupHeading",
  )!;
  const commandSelect = gesturePopup.querySelector<
    HTMLSelectElement & { command?: unknown }
  >("#gesturePopupCommandSelect")!;
  const labelInput = gesturePopup.querySelector<HTMLInputElement>(
    "#gesturePopupLabelInput",
  )!;
  const patternContainer = gesturePopup.querySelector<HTMLElement>(
    "#gesturePopupPatternContainer",
  )!;

  heading.textContent = chrome.i18n.getMessage("gesturePopupTitleNewGesture");
  commandSelect.command = null;
  labelInput.value = "";
  labelInput.placeholder = "";
  patternContainer.innerHTML = "";
}

function createGestureListItem(gesture: Gesture): HTMLLIElement {
  const li = document.createElement("li");
  li.addEventListener("pointerover", onItemPointerenter);
  li.addEventListener("pointerleave", onItemPointerleave);
  li.addEventListener("click", onItemClick);
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
  const animationsAreRunning = animations.some(
    (animation) => animation.playState === "running",
  );
  if (this.classList.contains("demo")) {
    if (!animationsAreRunning) {
      this.classList.remove("demo");
    } else {
      this.querySelector(".gl-thumbnail-trail")!.addEventListener(
        "animationend",
        () => {
          this.classList.remove("demo");
        },
        { once: true },
      );
    }
  }
}

function onItemClick(this: HTMLElement, e: MouseEvent) {
  const target = e.target as HTMLElement | null;

  if (target?.classList.contains("gl-remove-button")) {
    handleDeleteItem(this);
  } else {
    handleEditItem(this);
  }
}

function handleDeleteItem(item: HTMLElement) {
  const gesture = GestureMap.get(item);
  if (!gesture) return;

  GestureMap.delete(item);
  removeGestureListItem(item);

  configManager.setPath(
    ["Gestures"],
    Array.from(GestureMap.values()).map((g) => g.toJSON()),
  );
}

function handleEditItem(item: HTMLElement) {
  currentItem = item;
  openGesturePopup(GestureMap.get(currentItem));
}

function removeGestureListItem(gestureListItem: HTMLElement): void {
  const gestureList = document.getElementById(
    "gestureContainer",
  ) as HTMLElement | null;
  if (!gestureList) return;

  // get child index for current gesture item
  const gestureItemIndex = Array.prototype.indexOf.call(
    gestureList.children,
    gestureListItem,
  );

  // select all visible gesture items starting from given gesture item index
  const gestureItems = gestureList.querySelectorAll<HTMLElement>(
    `.gl-item:not([hidden]):nth-child(n + ${gestureItemIndex + 1})`,
  );

  // cache all grid item positions
  const itemPositionCache = new Map<HTMLElement, { x: number; y: number }>();
  gestureItems.forEach((gestureItem) => {
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
      `translate(${previousItemPosition.x - currentItemPosition.x}px, ${previousItemPosition.y - currentItemPosition.y}px)`,
    );
    currentGestureItem.style.setProperty("transition", "transform 0.3s");
  }

  gestureListItem.addEventListener("animationend", handleAnimationEnd);
  gestureListItem.classList.add("gl-item-animate-remove");
}

function onGesturePopupFormSubmit(event: Event) {
  event.preventDefault();

  const gesturePopupCommandSelect = document.getElementById(
    "gesturePopupCommandSelect",
  )! as CommandSelect;
  const gesturePopupLabelInput = document.getElementById(
    "gesturePopupLabelInput",
  )! as HTMLInputElement;

  if (!gesturePopupCommandSelect || !gesturePopupLabelInput) return;
  if (!gesturePopupCommandSelect.value || !currentPopupPattern) return;

  if (!currentItem) {
    const newGesture = Gesture.fromJSON({
      pattern: currentPopupPattern,
      label:
        gesturePopupLabelInput.value === ""
          ? undefined
          : gesturePopupLabelInput.value,
      command: {
        name: gesturePopupCommandSelect.value.name,
        settings: gesturePopupCommandSelect.value.settings,
      },
    });

    const gestureListItem = createGestureListItem(newGesture);
    GestureMap.set(gestureListItem, newGesture);

    // update config using configManager and toJSON
    configManager.setPath(
      ["Gestures"],
      Array.from(GestureMap.values()).map((g) => g.toJSON()),
    );

    addGestureListItem(gestureListItem);
  } else {
    const currentGesture = GestureMap.get(currentItem)!;
    currentGesture.setPattern(currentPopupPattern);
    currentGesture.setLabel(
      gesturePopupLabelInput.value === ""
        ? undefined
        : gesturePopupLabelInput.value,
    );
    currentGesture.setCommand(gesturePopupCommandSelect.command!);

    // update config using configManager and toJSON
    configManager.setPath(
      ["Gestures"],
      Array.from(GestureMap.values()).map((g) => g.toJSON()),
    );

    updateGestureListItem(currentItem, currentGesture);
  }

  const gesturePopup = document.getElementById(
    "gesturePopup",
  )! as HTMLDialogElement;
  gesturePopup.open = false;
}

function updateGestureListItem(gestureListItem: HTMLElement, gesture: Gesture) {
  gestureListItem.addEventListener(
    "animationend",
    () => {
      gestureListItem.classList.remove("gl-item-animate-update");
    },
    { once: true },
  );
  gestureListItem.classList.add("gl-item-animate-update");

  const currentGestureThumbnail =
    gestureListItem.querySelector(".gl-thumbnail");
  if (!currentGestureThumbnail) return;

  const newGestureThumbnail = createGestureThumbnail(gesture.getPattern());
  newGestureThumbnail.classList.add("gl-thumbnail");

  currentGestureThumbnail.replaceWith(newGestureThumbnail);

  const commandField = gestureListItem.querySelector(".gl-command");
  if (commandField) commandField.textContent = gesture.toString();
}

function onCommandSelectChange(this: CommandSelect, _e: Event) {
  const gesturePopupLabelInput = document.getElementById(
    "gesturePopupLabelInput",
  )! as HTMLInputElement;
  gesturePopupLabelInput.placeholder = chrome.i18n.getMessage(
    `commandLabel${this.value.name}`,
  );
}

export function addGestureListItem(gestureListItem: HTMLElement): void {
  const gestureList = document.getElementById(
    "gestureContainer",
  )! as HTMLElement;
  const gestureAddButtonItem = gestureList.firstElementChild! as HTMLElement;

  // prepend new entry, this pushes all elements by the height / width of one entry
  gestureAddButtonItem.after(gestureListItem);

  // select all visible gesture items
  const gestureItems = gestureList.querySelectorAll<HTMLElement>(
    ".gl-item:not([hidden])",
  );

  if (gestureItems.length > 0) {
    const gridComputedStyle = window.getComputedStyle(gestureList);

    const gridRowGap = parseFloat(
      gridComputedStyle.getPropertyValue("grid-row-gap"),
    );
    const gridColumnGap = parseFloat(
      gridComputedStyle.getPropertyValue("grid-column-gap"),
    );

    const gridRowSizes = gridComputedStyle
      .getPropertyValue("grid-template-rows")
      .split(" ")
      .map(parseFloat)
      .filter((n) => !Number.isNaN(n));

    const gridColumnSizes = gridComputedStyle
      .getPropertyValue("grid-template-columns")
      .split(" ")
      .map(parseFloat)
      .filter((n) => !Number.isNaN(n));

    for (let i = 0; i < gestureItems.length; i++) {
      const gestureItem = gestureItems[i];

      const gridColumnSize = gridColumnSizes[i % gridColumnSizes.length];
      const gridRowSize = gridRowSizes[0] ?? 0;

      if ((i + 1) % gridColumnSizes.length === 0) {
        // translate last element of row one row up and to the right end
        gestureItem.style.setProperty(
          "transform",
          `translate(${(gridColumnSize + gridColumnGap) * (gridColumnSizes.length - 1)}px, ${-gridRowSize - gridRowGap}px)`,
        );
      } else {
        gestureItem.style.setProperty(
          "transform",
          `translateX(${-gridColumnSize - gridColumnGap}px)`,
        );
      }
    }
  }

  // remove animation class on animation end
  gestureListItem.addEventListener(
    "animationend",
    (event) => {
      const target = event.currentTarget as HTMLElement;
      target.classList.remove("gl-item-animate-add");

      // remove transform so all elements move to their new position
      for (const gestureItem of gestureItems) {
        gestureItem.addEventListener(
          "transitionend",
          (e) => {
            const t = e.currentTarget as HTMLElement;
            t.style.removeProperty("transition");
          },
          { once: true },
        );
        gestureItem.style.setProperty("transition", "transform .3s");
        gestureItem.style.removeProperty("transform");
      }
    },
    { once: true },
  );

  // setup gesture item add animation
  gestureListItem.classList.add("gl-item-animate-add");
  gestureListItem.style.transform += `scale(1.6)`;

  // trigger reflow
  void gestureListItem.offsetHeight;

  gestureListItem.style.setProperty("transition", "transform .3s");
  gestureListItem.style.transform = gestureListItem.style.transform.replace(
    "scale(1.6)",
    "",
  );
}

function mouseGestureControllerSetup() {
  const gesturePopupCanvas = document.getElementById(
    "gesturePopupCanvas",
  )! as HTMLCanvasElement;
  const canvasContext = gesturePopupCanvas.getContext("2d")!;

  mouseController.addEventListener("start", (b) => {
    // TODO: detect if the gesture started on the recording area
    //
    // if (!e.target!.closest("#gesturePopupRecordingArea")) {
    //   // cancel gesture and event handler if the first click was not within the recording area
    //   mouseController.cancel();
    //   return;
    // }

    // TODO: applying settings
    // initialize canvas properties (correct width and height are only known after the popup has been opened)
    gesturePopupCanvas.width = gesturePopupCanvas.offsetWidth;
    gesturePopupCanvas.height = gesturePopupCanvas.offsetHeight;
    canvasContext.lineCap = "round";
    canvasContext.lineJoin = "round";
    canvasContext.lineWidth = 10;
    canvasContext.strokeStyle = "#fab12f";

    // get first event and remove it from the array
    const firstEvent = b.shift()!;
    const lastEvent = b[b.length - 1] || firstEvent;
    // translate the canvas coordiantes by the position of the canvas element
    const clientRect = gesturePopupCanvas.getBoundingClientRect();
    canvasContext.setTransform(1, 0, 0, 1, -clientRect.x, -clientRect.y);
    // dradditionalArrowWidth all occurred events
    canvasContext.beginPath();
    canvasContext.moveTo(firstEvent.clientX, firstEvent.clientY);
    for (let event of b) canvasContext.lineTo(event.clientX, event.clientY);
    canvasContext.stroke();

    canvasContext.beginPath();
    canvasContext.moveTo(lastEvent.clientX, lastEvent.clientY);
  });

  mouseController.addEventListener("update", (_b, e) => {
    // include fallback if getCoalescedEvents is not defined
    const events = e.getCoalescedEvents?.() ?? [e];

    const lastEvent = events[events.length - 1];
    for (let event of events)
      canvasContext.lineTo(event.clientX, event.clientY);
    canvasContext.stroke();

    canvasContext.beginPath();
    canvasContext.moveTo(lastEvent.clientX, lastEvent.clientY);
  });

  mouseController.addEventListener("abort", () => {
    // clear canvas
    canvasContext.setTransform(1, 0, 0, 1, 0, 0);
    canvasContext.clearRect(
      0,
      0,
      gesturePopupCanvas.width,
      gesturePopupCanvas.height,
    );
  });

  mouseController.addEventListener("end", (b) => {
    // clear canvas
    canvasContext.setTransform(1, 0, 0, 1, 0, 0);
    canvasContext.clearRect(
      0,
      0,
      gesturePopupCanvas.width,
      gesturePopupCanvas.height,
    );

    // setup pattern extractor
    const patternConstructor = new Pattern();

    // gather all events in one array
    // calling getCoalescedEvents for an event other then pointermove will return an empty array
    const coalescedEvents = b.flatMap((event) => {
      const events = event.getCoalescedEvents?.();
      // if events is null/undefined or empty (length == 0) return plain event
      return events?.length > 0 ? events : [event];
    });

    // build gesture pattern
    for (const event of coalescedEvents) {
      patternConstructor.addPoint(event.clientX, event.clientY);
    }
    // update current pattern
    currentPopupPattern = patternConstructor.getPattern();

    // update popup gesture pattern
    const gestureThumbnail = createGestureThumbnail(currentPopupPattern);
    const gesturePopupPatternContainer = document.getElementById(
      "gesturePopupPatternContainer",
    )!;
    // remove previous pattern if any
    if (gesturePopupPatternContainer.firstChild)
      gesturePopupPatternContainer.firstChild.remove();
    gesturePopupPatternContainer.append(gestureThumbnail);

    const mostSimilarGesture = matcher.getGestureByPattern(
      currentPopupPattern,
      Array.from(GestureMap.values()),
    );
    // if there is a similar gesture report it to the user
    if (mostSimilarGesture) {
      // activate alert symbol and change title
      gesturePopupPatternContainer.classList.add("alert");
      gesturePopupPatternContainer.title = chrome.i18n.getMessage(
        "gesturePopupNotificationSimilarGesture",
        mostSimilarGesture.toString(),
      );
    } else {
      gesturePopupPatternContainer.classList.remove("alert");
      gesturePopupPatternContainer.title =
        gesturePopupPatternContainer.dataset.gestureRecordingHint ?? "";
    }
  });
}
