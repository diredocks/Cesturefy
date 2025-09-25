import { ContentLoaded } from "@options/index"
import { configManager } from "@utils/config-manager";
import { DefaultConfig } from "@utils/config";

const res: Promise<unknown>[] = [configManager.loaded, ContentLoaded];

const loaded = Promise.all(res);
loaded.then(main);

async function main() {
  await configManager.fromJSON(DefaultConfig, false);

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
    // TODO: input.addEventListener('change', onChage);
  }
}
