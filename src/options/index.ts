import { fetchHTMLAsFragment } from "@options/utils/common";
import { configManager } from "@model/config-manager";

// resources
const res = [];

// load and insert external html fragments
for (let e of document.querySelectorAll<HTMLElement>("[data-include]")) {
  const fetchingHTML = fetchHTMLAsFragment(
    chrome.runtime.getURL(e.dataset.include!),
  );
  fetchingHTML.then((fragment) => e.appendChild(fragment));
  // add to resources
  res.push(fetchingHTML);
}

// make sure all fragments loaded, or insertions would fail
export const ContentLoaded = Promise.all(res);
ContentLoaded.then(main);

const manifest = chrome.runtime.getManifest();

function main() {
  // insert text from manifest
  for (const element of document.querySelectorAll<HTMLElement>(
    "[data-manifest]",
  )) {
    element.textContent = manifest[element.dataset.manifest!];
  }

  // insert text from language files
  for (const element of document.querySelectorAll<HTMLElement>("[data-i18n]")) {
    element.textContent = chrome.i18n.getMessage(element.dataset.i18n!);
  }

  // apply onchange handler and add title to every theme button
  for (const el of document.querySelectorAll<HTMLInputElement>(
    "#themeSwitch .theme-button",
  )) {
    const themeButton = el as HTMLInputElement;
    themeButton.addEventListener("change", onThemeButtonChange);
    themeButton.title = chrome.i18n.getMessage(`${themeButton.value}Theme`);
  }
  // apply theme class
  const themeValue = configManager.getPath(["Settings", "General", "theme"]);
  document.documentElement.classList.add(`${themeValue}-theme`);

  window.addEventListener("hashchange", onPageNavigation, true);
  // set default page if not specified
  if (!window.location.hash) location.replace("#Gestures");
  // and trigger page navigation handler
  else onPageNavigation();

  // set loaded class and render everything
  document.documentElement.classList.add("loaded");
}

function onPageNavigation() {
  // update the navbar entries highlighting
  const activeItem = document.querySelector(
    "#Sidebar .navigation .nav-item > a.active",
  );
  const nextItem = document.querySelector(
    '#Sidebar .navigation .nav-item > a[href="' + window.location.hash + '"]',
  );

  if (activeItem) {
    activeItem.classList.remove("active");
  }

  if (nextItem) {
    nextItem.classList.add("active");
    // update document title
    const sectionKey =
      nextItem.querySelector<HTMLElement>("[data-i18n]")?.dataset.i18n;
    document.title = `${manifest["name"]} - ${chrome.i18n.getMessage(sectionKey!)}`;
  }
}

function onThemeButtonChange(this: HTMLInputElement, _event: Event) {
  // remove current theme class if any
  document.documentElement.classList.forEach((className) => {
    if (className.endsWith("-theme")) {
      document.documentElement.classList.remove(className);
    }
  });

  // apply theme class + transition class
  document.documentElement.classList.add(
    `${this.value}-theme`,
    "theme-transition",
  );

  // remove temporary transition
  window.setTimeout(() => {
    document.documentElement.classList.remove("theme-transition");
  }, 400);
}
