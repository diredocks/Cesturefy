import { ContentLoaded } from "@options/index";
import { configManager } from "@model/config-manager";

ContentLoaded.then(main);

function main() {
  const exclusionsContainer = document.getElementById(
    "exclusionsContainer",
  ) as HTMLUListElement;
  exclusionsContainer.dataset.noEntriesHint = chrome.i18n.getMessage(
    "exclusionsHintNoEntries",
  );

  const exclusionsForm = document.getElementById(
    "exclusionsForm",
  ) as HTMLFormElement;
  exclusionsForm.addEventListener("submit", onFormSubmit);
  const urlPatternInput = exclusionsForm.elements.namedItem(
    "urlPattern",
  ) as HTMLInputElement;
  urlPatternInput.placeholder = chrome.i18n.getMessage(
    "exclusionsPlaceholderURL",
  );
  urlPatternInput.title = chrome.i18n.getMessage("exclusionsPlaceholderURL");
  urlPatternInput.addEventListener("change", onInputChange);

  // add existing exclusions entries
  for (const urlPattern of configManager.get("Exclusions")) {
    const exclusionsEntry = createExclusionsEntry(urlPattern);
    exclusionsContainer.appendChild(exclusionsEntry);
  }
}

function onInputChange(this: HTMLInputElement) {
  const value = this.value.trim();
  const exclusions = configManager.getPath(["Exclusions"]) as string[];

  if (exclusions.includes(value)) {
    this.setCustomValidity(
      chrome.i18n.getMessage("exclusionsNotificationAlreadyExists"),
    );
  } else if (this.validity.customError) {
    this.setCustomValidity("");
  }
}

function onFormSubmit(this: HTMLFormElement, event: Event) {
  event.preventDefault();

  const urlPatternInput = this.elements.namedItem(
    "urlPattern",
  ) as HTMLInputElement;
  const urlPattern = urlPatternInput.value.trim();

  if (!urlPattern) return;

  // create and add entry to the exclusions
  const exclusionsEntry = createExclusionsEntry(urlPattern);
  addExclusionsEntry(exclusionsEntry);

  // add new url pattern to the beginning of the array
  const exclusionsArray = configManager.get("Exclusions") as string[];
  exclusionsArray.unshift(urlPattern);
  configManager.setPath(["Exclusions"], exclusionsArray);

  // clear input field
  urlPatternInput.value = "";
}

function addExclusionsEntry(exclusionsEntry: HTMLLIElement) {
  const exclusionsContainer = document.getElementById(
    "exclusionsContainer",
  ) as HTMLElement;

  // append entry, hide it and move it out of flow to calculate its dimensions
  exclusionsContainer.prepend(exclusionsEntry);
  exclusionsEntry.style.setProperty("visibility", "hidden");
  exclusionsEntry.style.setProperty("position", "absolute");

  // calculate total entry height
  const computedStyle = window.getComputedStyle(exclusionsEntry);
  const outerHeight =
    parseInt(computedStyle.marginTop) +
    exclusionsEntry.offsetHeight +
    parseInt(computedStyle.marginBottom);

  // move all entries up by one entry including the new one
  for (const node of exclusionsContainer.children) {
    const el = node as HTMLElement;
    el.style.setProperty("transform", `translateY(-${outerHeight}px)`);
    el.style.removeProperty("transition"); // remove ongoing transitions if existing
  }

  // show new entry and bring it back to flow
  exclusionsEntry.style.removeProperty("visibility");
  exclusionsEntry.style.removeProperty("position");

  // trigger reflow
  void exclusionsContainer.offsetHeight;

  exclusionsEntry.addEventListener(
    "animationend",
    (event) => {
      (event.currentTarget as HTMLElement).classList.remove(
        "excl-entry-animate-add",
      );
    },
    { once: true },
  );
  exclusionsEntry.classList.add("excl-entry-animate-add");

  // move all entries down including the new one
  for (const node of exclusionsContainer.children) {
    const el = node as HTMLElement;
    el.addEventListener(
      "transitionend",
      (event) =>
        (event.currentTarget as HTMLElement).style.removeProperty("transition"),
      { once: true },
    );
    el.style.setProperty("transition", "transform 0.3s");
    el.style.removeProperty("transform");
  }
}

function createExclusionsEntry(urlPattern: string): HTMLLIElement {
  const exclusionsEntry = document.createElement("li");
  exclusionsEntry.classList.add("excl-entry");
  exclusionsEntry.dataset.urlPattern = urlPattern;

  exclusionsEntry.addEventListener("click", onEntryClick);

  const inputURLEntry = document.createElement("div");
  inputURLEntry.classList.add("excl-url-pattern");
  inputURLEntry.textContent = urlPattern;

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.classList.add("excl-remove-button", "icon-delete");

  exclusionsEntry.append(inputURLEntry, deleteButton);

  return exclusionsEntry;
}

function onEntryClick(this: HTMLLIElement, event: MouseEvent) {
  const target = event.target as HTMLElement;

  // if delete button received the click
  if (!target.classList.contains("excl-remove-button")) {
    return;
  }
  removeExclusionsEntry(this);

  const exclusionsForm = document.getElementById(
    "exclusionsForm",
  ) as HTMLFormElement;
  const urlPatternInput = exclusionsForm.elements.namedItem(
    "urlPattern",
  ) as HTMLInputElement;

  // remove input field invalidity if it was previously a duplicate
  if (this.dataset.urlPattern === urlPatternInput.value.trim()) {
    urlPatternInput.setCustomValidity("");
  }

  // remove url pattern from array
  const exclusionsArray = configManager.getPath(["Exclusions"]) as string[];
  const urlPattern = this.dataset.urlPattern ?? "";
  const newExclusions = exclusionsArray.filter((item) => item !== urlPattern);
  configManager.setPath(["Exclusions"], newExclusions);
}

function removeExclusionsEntry(exclusionsEntry: HTMLLIElement) {
  // calculate total entry height
  const computedStyle = window.getComputedStyle(exclusionsEntry);
  const outerHeight =
    parseInt(computedStyle.marginTop) +
    exclusionsEntry.offsetHeight +
    parseInt(computedStyle.marginBottom);

  let node = exclusionsEntry.nextElementSibling as HTMLElement | null;
  while (node) {
    node.addEventListener(
      "transitionend",
      (event) => {
        const target = event.currentTarget as HTMLElement;
        target.style.removeProperty("transition");
        target.style.removeProperty("transform");
      },
      { once: true },
    );
    node.style.setProperty("transition", "transform 0.3s");
    node.style.setProperty("transform", `translateY(-${outerHeight}px)`);
    node = node.nextElementSibling as HTMLElement | null;
  }

  exclusionsEntry.addEventListener(
    "animationend",
    (event) => {
      (event.currentTarget as HTMLElement).remove();
    },
    { once: true },
  );
  exclusionsEntry.classList.add("excl-entry-animate-remove");
}
