import { PopupBox } from "@options/components/popup-box";
import { ContentLoaded } from "@options/index";
import { configManager } from "@utils/config-manager";

ContentLoaded.then(main);

function main() {
  const resetButton = document.getElementById("resetButton")!;
  resetButton.onclick = onResetButton;
  const backupButton = document.getElementById("backupButton")!;
  backupButton.onclick = onBackupButton;
}

function onResetButton() {
  const popup = document.getElementById("resetConfirm")! as PopupBox;
  popup.addEventListener("close", (event) => {
    if (!event.detail) return;
    configManager.clear().then(window.location.reload);
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
