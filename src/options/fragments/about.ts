import { PopupBox } from "@options/components/popup-box";
import { ContentLoaded } from "@options/index";
// import { fetchJSONAsObject } from "@options/utils/common";
// TODO: when config system ready

ContentLoaded.then(main);

function main() {
  const resetButton = document.getElementById("resetButton")!;
  resetButton.onclick = onResetButton;
}

function onResetButton() {
  const popup = document.getElementById("resetConfirm")! as PopupBox;
  popup.addEventListener("close", (event) => {
    if (event.detail) {
      window.location.reload();
    }
  }, { once: true });
  popup.open = true;
}
