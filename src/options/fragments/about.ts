import { CommandName, commands } from "@commands/index";
import { PopupBox } from "@options/components/popup-box";
import { FullyLoaded } from "@options/index";
import { ConfigSchema } from "@model/config";
import { configManager } from "@model/config-manager";
import { CommandPermission } from "@utils/types";

FullyLoaded.then(main);

function main() {
  const resetButton = document.getElementById("resetButton")!;
  resetButton.addEventListener("click", onResetButton);
  const backupButton = document.getElementById("backupButton")!;
  backupButton.addEventListener("click", onBackupButton);
  const restoreButton = document.getElementById(
    "restoreButton",
  ) as HTMLInputElement;
  restoreButton.addEventListener("change", onRestoreButton);
}

async function onResetButton() {
  const popup = document.getElementById("resetConfirm") as PopupBox;
  popup.addEventListener("close", async (event) => {
    if (!event.detail) return;
    await removeOptionalPermissions();
    await configManager.clear();
    window.location.reload();
  },
    { once: true },
  );
  popup.open = true;
}

function onBackupButton() {
  const manifest = chrome.runtime.getManifest();
  const linkElement = document.createElement("a");
  linkElement.download = `${manifest.name} ${manifest.version} ${new Date().toDateString()}.json`;
  linkElement.href = URL.createObjectURL(
    new Blob([JSON.stringify(configManager.toJSON(), null, "  ")], {
      type: "application/json",
    }),
  );
  document.body.appendChild(linkElement);
  linkElement.click();
  document.body.removeChild(linkElement);
}

async function onRestoreButton(this: HTMLInputElement): Promise<void> {
  const file = this.files?.[0];
  if (!file || file.type !== "application/json") {
    const popup = document.getElementById("restoreAlertWrongFile") as PopupBox;
    popup.open = true;
    return;
  }

  try {
    // FIXME: mouseButton from Gesturefy is string, causing wrong behaviour
    const restoredConfig =
      (await readJsonFile(file)) as Partial<ConfigSchema>;
    const usedCommands: CommandName[] = [];

    // Gestures
    if (restoredConfig.Gestures?.length) {
      for (const g of restoredConfig.Gestures) {
        if (g.command?.name)
          usedCommands.push(g.command.name as CommandName);
      }
    }
    // Rocker
    const rocker = restoredConfig.Settings?.Rocker;
    if (rocker) {
      if (rocker.rightMouseClick?.name)
        usedCommands.push(
          rocker.rightMouseClick.name as CommandName,
        );

      if (rocker.leftMouseClick?.name)
        usedCommands.push(
          rocker.leftMouseClick.name as CommandName,
        );
    }
    // Wheel
    const wheel = restoredConfig.Settings?.Wheel;
    if (wheel) {
      if (wheel.wheelUp?.name)
        usedCommands.push(wheel.wheelUp.name as CommandName);

      if (wheel.wheelDown?.name)
        usedCommands.push(wheel.wheelDown.name as CommandName);
    }

    const requiredPermissions = new Set<CommandPermission>();
    for (const name of usedCommands) {
      const def = commands[name];
      if (!def) continue;
      def.permissions?.forEach((p) =>
        requiredPermissions.add(p),
      );
    }

    const confirmPopup = document.getElementById("restoreConfirm") as PopupBox;
    confirmPopup.addEventListener("close", async (event) => {
      if (!event.detail) return;
      // Request optional permissions if needed
      if (requiredPermissions.size > 0) {
        const granted = await chrome.permissions.request({
          origins: ["<all_urls>"],
          permissions: [...requiredPermissions],
        });

        // TODO: restoreAlertNotGranted
        if (!granted) return;
      }
      proceedRestore(restoredConfig);
    },
      { once: true },
    );
    confirmPopup.open = true;
  } catch {
    const popup = document.getElementById("restoreAlertNoConfigFile") as PopupBox;
    popup.open = true;
  }
}

function proceedRestore(restoredConfig: Partial<ConfigSchema>) {
  configManager.clear();
  configManager.fromJSON(restoredConfig);

  const popup = document.getElementById("restoreAlertSuccess") as PopupBox;

  popup.addEventListener("close", () => window.location.reload(),
    { once: true },
  );

  popup.open = true;
}

function readJsonFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const text = typeof reader.result === "string" ? reader.result : "";
        resolve(JSON.parse(text));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    };
    reader.onerror = () => reject(new Error("File read error"));
    reader.readAsText(file);
  });
}

async function removeOptionalPermissions() {
  const manifest = chrome.runtime.getManifest();
  const optionalPermissions = new Set(manifest.optional_permissions ?? []);
  const current = await chrome.permissions.getAll();

  const permsToRemove =
    current.permissions?.filter((p) =>
      optionalPermissions.has(p),
    ) ?? [];

  if (permsToRemove.length === 0) {
    return false;
  }

  return chrome.permissions.remove({
    permissions: permsToRemove,
  });
}
