// TODO: popup close refresh
import { CommandName, commands } from "@commands/index";
import { PopupBox } from "@options/components/popup-box";
import { ContentLoaded } from "@options/index";
import { ConfigSchema } from "@model/config";
import { configManager } from "@model/config-manager";
import { CommandPermission } from "@utils/types";

ContentLoaded.then(main);

function main() {
  const resetButton = document.getElementById("resetButton")!;
  resetButton.addEventListener('click', onResetButton);
  const backupButton = document.getElementById("backupButton")!;
  backupButton.addEventListener('click', onBackupButton);
  const restoreButton = document.getElementById("restoreButton") as HTMLInputElement;
  restoreButton.addEventListener("change", onRestoreButton);
}

async function onResetButton() {
  const popup = document.getElementById("resetConfirm")! as PopupBox;
  popup.addEventListener("close", async (event) => {
    if (!event.detail) return;
    await removePermissions();
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
    const popup = document.getElementById("restoreAlertWrongFile") as any;
    popup.addEventListener("close", () => window.location.reload(), { once: true });
    popup.open = true;
    return;
  }

  try {
    // FIXME: mouseButton from Gesturefy is string, causing wrong behaviour
    const restoredConfig = await readJsonFile(file) as Partial<ConfigSchema>;

    const gestures = restoredConfig.Gestures ?? [];
    const permissions = new Set<CommandPermission>();

    for (const g of gestures) {
      const def = commands[g.command.name as CommandName];
      if (!def) throw new Error(`Command not found: ${g.command.name}`);
      def.permissions?.forEach(p => permissions.add(p));
    }

    if (permissions.size > 0) {
      const ok = await chrome.permissions.request({
        origins: ["<all_urls>"],
        permissions: [...permissions],
      });
      if (!ok) return;
    }

    configManager.clear();
    configManager.fromJSON(restoredConfig);

    const popup = document.getElementById("restoreAlertSuccess") as any;
    popup.addEventListener("close", () => window.location.reload(), { once: true });
    popup.open = true;
  } catch {
    const popup = document.getElementById("restoreAlertNoConfigFile") as any;
    popup.addEventListener("close", () => window.location.reload(), { once: true });
    popup.open = true;
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

export async function removePermissions() {
  // FIXME: removing <all_urls> from origins doesnot work and IDK why
  const manifest = chrome.runtime.getManifest();

  const optionalPermissions = new Set(manifest.optional_permissions ?? []);
  // const optionalOrigins = new Set(manifest.optional_host_permissions ?? []);

  const current = await chrome.permissions.getAll();

  const permsToRemove = current.permissions?.filter((p) =>
    optionalPermissions.has(p)
  ) ?? [];

  // const originsToRemove = current.origins?.filter((o) =>
  //   optionalOrigins.has(o)
  // ) ?? [];

  if (permsToRemove.length === 0) {
    return false;
  }

  return await chrome.permissions.remove({
    permissions: permsToRemove,
    // origins: originsToRemove,
  });
}
