import { PopupBox } from "@options/components/popup-box";
import { ContentLoaded } from "@options/index";

ContentLoaded.then(main);

function main() {
  const newGestureButton = document.getElementById("gestureAddButton")!;
  newGestureButton.onclick = onAddButtonClick;
}

function onAddButtonClick() {
  openGesturePopup();
}

function openGesturePopup(gesture = null) {
  // open popup
  const gesturePopup = document.getElementById("gesturePopup")! as PopupBox;
  gesturePopup.open = true;
}
