import { PopupBox } from "@options/components/popup-box";
import { ContentLoaded } from "@options/index";
import { ConfigSchema } from "@utils/config";
import { configManager } from "@utils/config-manager";

ContentLoaded.then(main);

function main() {
  const resetButton = document.getElementById("resetButton")!;
  resetButton.addEventListener('click', onResetButton);
  const backupButton = document.getElementById("backupButton")!;
  backupButton.addEventListener('click', onBackupButton);
  const restoreButton = document.getElementById("restoreButton") as HTMLInputElement;
  restoreButton.addEventListener("change", onRestoreButton);
}

function onResetButton() {
  const popup = document.getElementById("resetConfirm")! as PopupBox;
  popup.addEventListener("close", (event) => {
    if (!event.detail) return;
    configManager.clear().then(() => window.location.reload());
  }, { once: true });
  popup.open = true;
}

function onBackupButton() {
  const manifest = chrome.runtime.getManifest();
  const linkElement = document.createElement("a");
  linkElement.download = `${manifest.name}_${manifest.version}_${new Date().getTime()}.json`;
  // creates a json file with the current config
  linkElement.href = URL.createObjectURL(
    new Blob([JSON.stringify(configManager.toJSON(), null, '  ')], { type: 'application/json' })
  );
  document.body.appendChild(linkElement);
  linkElement.click();
  document.body.removeChild(linkElement);
}

async function onRestoreButton(this: HTMLInputElement, _event: Event): Promise<void> {
  const file = this.files?.[0];
  if (!file || file.type !== "application/json") {
    (document.getElementById("restoreAlertWrongFile") as any).open = true;
    return;
  }

  try {
    const restoredConfig = await readJsonFile(file);

    configManager.clear();
    configManager.fromJSON(restoredConfig as Partial<ConfigSchema>);

    const popup = document.getElementById("restoreAlertSuccess") as any;
    popup.addEventListener("close", () => window.location.reload(), { once: true });
    popup.open = true;
  } catch {
    (document.getElementById("restoreAlertNoConfigFile") as any).open = true;
  }
}

function readJsonFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const result = typeof reader.result === "string" ? reader.result : "";
        resolve(JSON.parse(result));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    };
    reader.onerror = () => reject(new Error("File read error"));
    reader.readAsText(file);
  });
}
