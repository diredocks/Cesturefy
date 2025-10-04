// NOTE: Extras will reuse things we implement here
import { ContentLoaded } from "@options/index"
import { configManager } from "@model/config-manager";

const res: Promise<unknown>[] = [configManager.loaded, ContentLoaded];

const loaded = Promise.all(res);
loaded.then(main);

async function main() {
  // apply values to input fields and add their event function
  for (const input of document.querySelectorAll<HTMLInputElement>("[data-config]")) {
    const value = configManager.get(input.dataset.config!);
    if (input.type === "checkbox") {
      input.checked = value;
    }
    else if (input.type === "radio") {
      input.checked = input.value === value;
    }
    else input.value = value;
    input.addEventListener('change', onChange);
  }
  // toggle collapsables and add their event function
  for (const collapse of document.querySelectorAll<HTMLInputElement>("[data-collapse]")) {
    // if user dispatched the function, then hide with animation
    collapse.addEventListener("change", onCollapse);
    // else hide without animation
    applyCollapseState(collapse);
  }
}

function onChange(this: HTMLElement) {
  // check if valid, if there is no validity property check if value is set
  if (
    ("validity" in this && (this as any).validity.valid) ||
    (!("validity" in this) && "value" in this)
  ) {
    let value: string | number | boolean;

    if (this instanceof HTMLInputElement) {
      if (this.type === "checkbox") {
        value = this.checked;
      } else {
        value = isNaN(this.valueAsNumber) ? this.value : this.valueAsNumber;
      }
    } else if (this instanceof HTMLSelectElement) {
      // NOTE: select element can be used to seelect a enum, like mouseButton
      const num = Number(this.value);
      value = isNaN(num) ? this.value : num;
    } else {
      value = (this as any).value;
    }

    // save to config
    configManager.set(this.dataset.config!, value);
  }
}

function onCollapse(this: HTMLInputElement) {
  const targetElements = document.querySelectorAll<HTMLElement>(this.dataset["collapse"]!);

  for (const element of targetElements) {
    element.addEventListener(
      "transitionend",
      e => {
        (e.currentTarget as HTMLElement).classList.remove("animate");
      },
      { once: true }
    );
    element.classList.add("animate");

    if (!this.checked) {
      element.style.height = element.scrollHeight + "px";
      // trigger reflow
      void element.offsetHeight;
    }
  }

  applyCollapseState(this);
}

function applyCollapseState(collapse: HTMLInputElement) {
  const targetElements = document.querySelectorAll<HTMLElement>(collapse.dataset["collapse"]!);

  for (const element of targetElements) {
    if (element.style.height === "0px" && collapse.checked) {
      element.style.height = element.scrollHeight + "px";
    } else if (!collapse.checked) {
      element.style.height = "0px";
    }
  }
}
