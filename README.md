# <sub><img src="https://github.com/diredocks/Cesturefy/blob/main/src/static/images/iconx48.png" height="38" width="38"></sub>esturefy

#### Still your favorite gesture extension, now on Chromium-based browsers

Cesturefy is a Chromium adaptation of the popular [Robbendebiene/Gesturefy](https://github.com/Robbendebiene/Gesturefy) mouse gesture extension originally for Firefox, bringing the same smooth gesture control to Chrome, Edge, and other Chromium-based browsers.

#### [<img height="62" src="https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/add-ons-badge-images/microsoft-edge-add-ons-badge.png">](https://microsoftedge.microsoft.com/addons/detail/cesturefy/jefejapoeaijdkiilodmeagdmddhfign) [<img height="62" src="https://developer.chrome.com/static/docs/webstore/branding/image/HRs9MPufa1J1h5glNhut.png">](https://chromewebstore.google.com/detail/cesturefy/bifgfhokfobhebifcogneljkpaaloonp)

## Features

 - Mouse gestures (moving the mouse while holding the left, middle, or right button)
 - Rocker gestures (left-click while holding the right mouse button and vice versa)
 - Provides special commands like popup, [user script](docs/user-script.md) and multi purpose command
 - Wheel gestures (scroll wheel while holding the left, middle, or right button)
 - (80/91) different [predefined commands](docs/commands-todo.md)
 - Customizable gesture trace and status information style
 - Light, dark and highcontrast theme

## Limitations

- Cesturefy does not work on Chrome internal pages like `chrome://extensions` or other restricted pages. This is due to browser security restrictions.
- The page must be partially loaded to perform gestures.
- Gestures cannot be properly performed inside iframe pages, because Chrome does not provide the [mozInnerScreenX/Y](https://developer.mozilla.org/en-US/docs/Web/API/Window/mozInnerScreenX) API.
- On Linux and macOS, right-click menu gestures require a double click to trigger. Chrome does not support the [browserSettings.contextMenuShowEvent](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserSettings/contextMenuShowEvent) API.

## License

This project is licensed under the terms of the [GNU General Public License v3.0](https://github.com/diredocks/Cesturefy/blob/main/LICENSE).

## Privacy

Cesturefy does not collect any data of any kind.

* Cesturefy has no home server.
* Cesturefy doesn't embed any analytic or telemetry hooks in its code.

**GitHub** is used to host the Cesturefy project. **GitHub, Inc.** (a subsidiary of **Microsoft Corporation**) owns **GitHub** and is unrelated to Cesturefy.
