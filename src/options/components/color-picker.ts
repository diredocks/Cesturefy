import { PopupBox } from "@options/components/popup-box";
import { RGB, RGBA } from "@utils/types";
import { clamp, rgbToHSV, RGBAToHexA, HexAToRGBA } from "@options/utils/common";
import { MouseButton } from "@utils/types";

export class ColorPicker extends HTMLElement {
  readonly shadow!: ShadowRoot; // I JUST HAVE IT
  private _rgba: RGBA;

  constructor() {
    super();

    this._rgba = [0, 0, 0, 0];

    this.shadow = this.attachShadow({ mode: "open" });
    this.shadow.innerHTML = `
      <link rel="stylesheet" href="/options/components/color-picker.css">

      <div id="content"></div>

      <popup-box id="colorPickerPopup">
        <span slot="title">Color Picker</span>
        <div id="colorPicker" slot="content">
          <div class="cp-main">
            <div class="cp-panel" id="colorFieldPanel">
              <canvas id="colorField" width="256" height="256"></canvas>
              <div id="colorFieldCursor"></div>
            </div>

            <div class="cp-panel" id="colorScalePanel">
              <canvas id="colorScale" width="20" height="256"></canvas>
              <div id="colorScaleCursor"></div>
            </div>

            <div class="cp-panel" id="alphaScalePanel">
              <div id="alphaScale"></div>
              <div id="alphaScaleCursor"></div>
            </div>

            <div class="cp-panel">
              <form id="rgbaValueForm">
                <label>R<input name="R" type="number" step="1" min="0" max="255" required></label>
                <label>G<input name="G" type="number" step="1" min="0" max="255" required></label>
                <label>B<input name="B" type="number" step="1" min="0" max="255" required></label>
                <label>A<input name="A" type="number" step="0.01" min="0" max="1" required></label>
                <div id="colorPreview"></div>
              </form>
            </div>
          </div>
          <div class="cp-footer">
            <form id="hexValueForm">
              <input name="Hex" pattern="#[a-fA-F0-9]{8}" required>
              <button id="saveButton">Save</button>
            </form>
          </div>
        </div>
      </popup-box>
    `;

    const colorScale = this.$<HTMLCanvasElement>("colorScale");
    const ctx = colorScale.getContext("2d")!;
    const gradient = ctx.createLinearGradient(0, 0, 0, colorScale.height);
    gradient.addColorStop(0, "rgb(255,0,0)");
    gradient.addColorStop(0.16, "rgb(255,0,255)");
    gradient.addColorStop(0.33, "rgb(0,0,255)");
    gradient.addColorStop(0.49, "rgb(0,255,255)");
    gradient.addColorStop(0.65, "rgb(0,255,0)");
    gradient.addColorStop(0.84, "rgb(255,255,0)");
    gradient.addColorStop(1, "rgb(255,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, colorScale.width, colorScale.height);

    this.bindEvents();
  }

  static get observedAttributes(): string[] {
    return ["value"];
  }

  private $<T extends HTMLElement>(id: string): T {
    return this.shadow.getElementById(id) as T;
  }

  private bindEvents() {
    this.$<HTMLCanvasElement>("colorField").addEventListener(
      "pointerdown",
      this._handleColorFieldPointerdown.bind(this),
    );
    this.$("colorFieldCursor").addEventListener(
      "pointerdown",
      this._handleColorFieldPointerdown.bind(this),
    );

    this.$<HTMLCanvasElement>("colorScale").addEventListener(
      "pointerdown",
      this._handleColorScalePointerdown.bind(this),
    );
    this.$("colorScaleCursor").addEventListener(
      "pointerdown",
      this._handleColorScalePointerdown.bind(this),
    );

    this.$("alphaScale").addEventListener(
      "pointerdown",
      this._handleAlphaScalePointerdown.bind(this),
    );
    this.$("alphaScaleCursor").addEventListener(
      "pointerdown",
      this._handleAlphaScalePointerdown.bind(this),
    );

    this.$("rgbaValueForm").addEventListener(
      "input",
      this._handleRGBAInput.bind(this),
    );
    this.$("hexValueForm").addEventListener(
      "input",
      this._handleHexInput.bind(this),
    );
    this.$("hexValueForm").addEventListener(
      "submit",
      this._handleHexSubmit.bind(this),
    );

    this.$("saveButton").textContent = chrome.i18n.getMessage("buttonSave");

    this.addEventListener("click", this._handleHostElementClick.bind(this));
  }

  attributeChangedCallback(
    name: string,
    _old: string | null,
    value: string | null,
  ) {
    if (name === "value") {
      this._rgba = value ? HexAToRGBA(value) : [0, 0, 0, 0];
      this._updateRGBAInputs(...this._rgba);
      this._handleRGBAInput();

      this.$("content").style.setProperty("--color", `rgba(${this._rgba})`);
    }
  }

  get value(): string | null {
    return this.getAttribute("value");
  }

  set value(v: string | null) {
    if (v) this.setAttribute("value", v);
    else this.removeAttribute("value");
  }

  /**
   * Opens the color picker popup
   **/
  _openColorPicker() {
    const colorPickerPopup = this.shadow.getElementById(
      "colorPickerPopup",
    ) as PopupBox;
    colorPickerPopup.open = true;
  }

  /**
   * Opens the color picker popup
   **/
  _closeColorPicker() {
    const colorPickerPopup = this.shadow.getElementById(
      "colorPickerPopup",
    ) as PopupBox;
    colorPickerPopup.open = false;
  }

  /**
   * Get the color data of the color field (saturation & value field) at the given x and y position
   **/
  _getColorFieldData(x: number, y: number) {
    const colorField = this.shadow.getElementById(
      "colorField",
    ) as HTMLCanvasElement;

    x = clamp(x, 0, colorField.width - 1);
    y = clamp(y, 0, colorField.height - 1);

    // TODO: Maybe we need to cache canvas context
    // See also: https://stackoverflow.com/questions/74101155/chrome-warning-willreadfrequently-attribute-set-to-true
    return colorField.getContext("2d")!.getImageData(x, y, 1, 1).data;
  }

  /**
   * Get the color data of the color scale (hue field) at the given y position
   **/
  _getColorScaleData(y: number) {
    const colorScale = this.shadow.getElementById(
      "colorScale",
    ) as HTMLCanvasElement;

    y = clamp(y, 0, colorScale.height - 1);

    // See also: https://stackoverflow.com/questions/74101155/chrome-warning-willreadfrequently-attribute-set-to-true
    return colorScale.getContext("2d")!.getImageData(0, y, 1, 1).data;
  }

  /**
   * Get the alpha value of the alpha scale at the given y position
   **/
  _getAlphaScaleData(y: number) {
    const alphaScale = this.shadow.getElementById("alphaScale")!;
    const alphaHeight = alphaScale.offsetHeight;

    y = clamp(y, 0, alphaHeight - 1);

    // calculate alpha value
    const alpha = 1 - (1 / alphaHeight) * y;
    // round alpha value by 2 decimal places
    return Math.round(alpha * 100) / 100;
  }

  /**
   * Update the position of the color field (saturation & value field) cursor
   * By the given x and y coordinates
   **/
  _updateColorFieldCursor(x: number, y: number) {
    const colorField = this.shadow.getElementById(
      "colorField",
    ) as HTMLCanvasElement;
    const colorPicker = this.shadow.getElementById("colorPicker")!;

    x = clamp(x, 0, colorField.width - 1);
    y = clamp(y, 0, colorField.height - 1);

    colorPicker.style.setProperty("--colorFieldX", x.toString());
    colorPicker.style.setProperty("--colorFieldY", y.toString());
  }

  /**
   * Update the position of the color scale (hue field) cursor
   * By the given y coordinates
   **/
  _updateColorScaleCursor(y: number) {
    const colorScale = this.shadow.getElementById(
      "colorScale",
    ) as HTMLCanvasElement;
    const colorPicker = this.shadow.getElementById("colorPicker")!;

    y = clamp(y, 0, colorScale.height - 1);

    colorPicker.style.setProperty("--colorScaleY", y.toString());
  }

  /**
   * Update the position of the alpha scale cursor
   * By the given y coordinates
   **/
  _updateAlphaScaleCursor(y: number) {
    const alphaScale = this.shadow.getElementById(
      "alphaScale",
    ) as HTMLCanvasElement;
    const colorPicker = this.shadow.getElementById("colorPicker")!;

    y = clamp(y, 0, (alphaScale.offsetHeight || 256) - 1);

    colorPicker.style.setProperty("--alphaScaleY", y.toString());
  }

  /**
   * Update the color of the color field (saturation & value field)
   * By the given rgb value (hue)
   **/
  _updateColorField(...rgb: RGB) {
    const colorField = this.shadow.getElementById(
      "colorField",
    ) as HTMLCanvasElement;

    let gradient;

    const ctx = colorField.getContext("2d")!;
    ctx.fillStyle = `rgb(${rgb.join(",")})`;
    ctx.fillRect(0, 0, colorField.width, colorField.height);
    gradient = ctx.createLinearGradient(0, 0, colorField.width, 0);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, colorField.width, colorField.height);
    gradient = ctx.createLinearGradient(0, 0, 0, 255);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, colorField.width, colorField.height);
  }

  /**
   * Update the current color picker color and alpha by the given rgba value
   **/
  _updateColor(...rgba: RGBA) {
    const colorPicker = this.shadow.getElementById("colorPicker")!;
    colorPicker.style.setProperty(
      "--color",
      `${rgba[0]}, ${rgba[1]}, ${rgba[2]}`,
    );
    colorPicker.style.setProperty("--alpha", `${rgba[3]}`);
    // update internal variable
    this._rgba = rgba;
  }

  /**
   * Update the color picker rgba inputs by the given rgba value
   **/
  _updateRGBAInputs(...rgba: RGBA) {
    const rgbaValueForm = this.shadow.getElementById(
      "rgbaValueForm",
    ) as HTMLFormElement;
    rgbaValueForm.R.value = rgba[0];
    rgbaValueForm.G.value = rgba[1];
    rgbaValueForm.B.value = rgba[2];
    rgbaValueForm.A.value = rgba[3];
  }

  /**
   * Update the color picker hex input by the given rgba value
   **/
  _updateHexInput(...rgba: RGBA) {
    const hexValueForm = this.shadow.getElementById(
      "hexValueForm",
    ) as HTMLFormElement;
    hexValueForm.Hex.value = RGBAToHexA(...rgba);
  }

  /**
   * Handles the rgba input event
   * Updates all other color picker elements to match the new value
   **/
  _handleRGBAInput() {
    const rgbaValueForm = this.shadow.getElementById(
      "rgbaValueForm",
    ) as HTMLFormElement;
    if (!rgbaValueForm.reportValidity()) {
      return;
    }
    const rgba = [
      rgbaValueForm.R.valueAsNumber,
      rgbaValueForm.G.valueAsNumber,
      rgbaValueForm.B.valueAsNumber,
      rgbaValueForm.A.valueAsNumber,
    ] as RGBA;
    const hsv = rgbToHSV(rgba[0], rgba[1], rgba[2]);

    const colorField = this.shadow.getElementById(
      "colorField",
    ) as HTMLCanvasElement;
    const colorFieldX = Math.round(hsv[1] * (colorField.width - 1));
    const colorFieldY = Math.round((1 - hsv[2]) * (colorField.height - 1));

    const colorScale = this.shadow.getElementById(
      "colorScale",
    ) as HTMLCanvasElement;
    const colorScaleY = Math.round((1 - hsv[0]) * (colorScale.height - 1));

    const alphaScale = this.shadow.getElementById(
      "alphaScale",
    ) as HTMLCanvasElement;
    // offsetHeight can be undefined / 0 when the element is hidden
    const alphaScaleY = Math.round(
      (1 - rgba[3]) * ((alphaScale.offsetHeight || 256) - 1),
    );

    this._updateColorFieldCursor(colorFieldX, colorFieldY);
    this._updateColorScaleCursor(colorScaleY);
    this._updateAlphaScaleCursor(alphaScaleY);

    const colorScaleData = this._getColorScaleData(colorScaleY);

    this._updateColorField(
      colorScaleData[0],
      colorScaleData[1],
      colorScaleData[2],
    );
    this._updateHexInput(...rgba);
    this._updateColor(...rgba);
  }

  /**
   * Handles the hex input event
   * Updates all other color picker elements to match the new value
   **/
  _handleHexInput() {
    const hexValueForm = this.shadow.getElementById(
      "hexValueForm",
    ) as HTMLFormElement;
    if (!hexValueForm.reportValidity()) {
      return;
    }
    const hex = hexValueForm.Hex.value;
    const rgba = HexAToRGBA(hex);
    const hsv = rgbToHSV(rgba[0], rgba[1], rgba[2]);

    const colorField = this.shadow.getElementById(
      "colorField",
    ) as HTMLCanvasElement;
    const colorFieldX = Math.round(hsv[1] * (colorField.width - 1));
    const colorFieldY = Math.round((1 - hsv[2]) * (colorField.height - 1));

    const colorScale = this.shadow.getElementById(
      "colorScale",
    ) as HTMLCanvasElement;
    const colorScaleY = Math.round((1 - hsv[0]) * (colorScale.height - 1));

    const alphaScale = this.shadow.getElementById(
      "alphaScale",
    ) as HTMLCanvasElement;
    // offsetHeight can be undefined / 0 when the element is hidden
    const alphaScaleY = Math.round(
      (1 - rgba[3]) * ((alphaScale.offsetHeight || 256) - 1),
    );

    this._updateColorFieldCursor(colorFieldX, colorFieldY);
    this._updateColorScaleCursor(colorScaleY);
    this._updateAlphaScaleCursor(alphaScaleY);

    const colorScaleData = this._getColorScaleData(colorScaleY);

    this._updateColorField(
      colorScaleData[0],
      colorScaleData[1],
      colorScaleData[2],
    );
    this._updateRGBAInputs(...rgba);
    this._updateColor(...rgba);
  }

  /**
   * Handles the color field pointerdown event
   * Enables the pointermove event listener and calls it once
   **/
  _handleColorFieldPointerdown(event: PointerEvent) {
    if (event.buttons != MouseButton.LEFT) {
      return;
    }
    const callbackReference = this._handleColorFieldPointerMove.bind(
      this,
    ) as EventListener;
    // call pointer move listener once with the current event
    // in order to update the cursor position
    callbackReference(event);

    this.shadow.addEventListener("pointermove", callbackReference);

    this.shadow.addEventListener(
      "pointerup",
      (_event) => {
        // remove the pointer move listener
        this.shadow.removeEventListener("pointermove", callbackReference);
      },
      { once: true },
    );
  }

  /**
   * Handles the color scale pointerdown event
   * Enables the pointermove event listener and calls it once
   **/
  _handleColorScalePointerdown(event: PointerEvent) {
    if (event.buttons != MouseButton.LEFT) {
      return;
    }
    const callbackReference = this._handleColorScalePointerMove.bind(
      this,
    ) as EventListener;
    // call pointer move listener once with the current event
    // in order to update the cursor position
    callbackReference(event);

    this.shadow.addEventListener("pointermove", callbackReference);

    this.shadow.addEventListener(
      "pointerup",
      (_event) => {
        // remove the pointer move listener
        this.shadow.removeEventListener("pointermove", callbackReference);
      },
      { once: true },
    );
  }

  /**
   * Handles the alpha scale pointerdown event
   * Enables the pointermove event listener and calls it once
   **/
  _handleAlphaScalePointerdown(event: PointerEvent) {
    if (event.buttons != MouseButton.LEFT) {
      return;
    }
    const callbackReference = this._handleAlphaScalePointerMove.bind(
      this,
    ) as EventListener;
    // call pointer move listener once with the current event
    // in order to update the cursor position
    callbackReference(event);

    this.shadow.addEventListener("pointermove", callbackReference);

    this.shadow.addEventListener(
      "pointerup",
      (_event) => {
        // remove the pointer move listener
        this.shadow.removeEventListener("pointermove", callbackReference);
      },
      { once: true },
    );
  }

  /**
   * Handles the color field pointermove event
   * Updates the color field cursor position and retrieves the new value
   * Updates all other color picker elements to match the new value
   **/
  _handleColorFieldPointerMove(event: PointerEvent) {
    if (event.buttons != MouseButton.LEFT) {
      return;
    }
    const colorField = this.shadow.getElementById(
      "colorField",
    ) as HTMLCanvasElement;
    const clientRect = colorField.getBoundingClientRect();

    const x = Math.round(event.clientX - clientRect.left),
      y = Math.round(event.clientY - clientRect.top);

    const colorFieldData = this._getColorFieldData(x, y);

    this._updateColorFieldCursor(x, y);

    this._updateColor(
      colorFieldData[0],
      colorFieldData[1],
      colorFieldData[2],
      this._rgba[3],
    );

    this._updateRGBAInputs(
      colorFieldData[0],
      colorFieldData[1],
      colorFieldData[2],
      this._rgba[3],
    );
    this._updateHexInput(
      colorFieldData[0],
      colorFieldData[1],
      colorFieldData[2],
      this._rgba[3],
    );

    event.preventDefault();
  }

  /**
   * Handles the color scale pointermove event
   * Updates the color scale cursor position and retrieves the new value
   * Updates all other color picker elements to match the new value
   **/
  _handleColorScalePointerMove(event: PointerEvent) {
    if (event.buttons != MouseButton.LEFT) {
      return;
    }
    const colorScale = this.shadow.getElementById("colorScale")!;
    const clientRect = colorScale.getBoundingClientRect();

    const y = Math.round(event.clientY - clientRect.top);

    const colorScaleData = this._getColorScaleData(y);
    // set max and min colors to red
    if (y <= 0) colorScaleData[2] = 0;
    if (y >= 255) colorScaleData[1] = 0;

    this._updateColorScaleCursor(y);

    this._updateColorField(
      colorScaleData[0],
      colorScaleData[1],
      colorScaleData[2],
    );

    const colorPicker = this.shadow.getElementById("colorPicker")!;
    const colorFieldCursorX =
      colorPicker.style.getPropertyValue("--colorFieldX");
    const colorFieldCursorY =
      colorPicker.style.getPropertyValue("--colorFieldY");
    const colorData = this._getColorFieldData(
      +colorFieldCursorX,
      +colorFieldCursorY,
    );

    this._updateColor(colorData[0], colorData[1], colorData[2], this._rgba[3]);

    this._updateRGBAInputs(
      colorData[0],
      colorData[1],
      colorData[2],
      this._rgba[3],
    );
    this._updateHexInput(
      colorData[0],
      colorData[1],
      colorData[2],
      this._rgba[3],
    );

    event.preventDefault();
  }

  /**
   * Handles the alpha scale pointermove event
   * Updates the alpha scale cursor position and retrieves the new value
   * Updates all other color picker elements to match the new value
   **/
  _handleAlphaScalePointerMove(event: PointerEvent) {
    if (event.buttons != MouseButton.LEFT) {
      return;
    }
    const alphaScale = this.shadow.getElementById("alphaScale")!;
    const clientRect = alphaScale.getBoundingClientRect();

    const y = Math.round(event.clientY - clientRect.top);

    const alphaScaleData = this._getAlphaScaleData(y);

    this._updateAlphaScaleCursor(y);

    this._updateColor(
      this._rgba[0],
      this._rgba[1],
      this._rgba[2],
      alphaScaleData,
    );

    this._updateRGBAInputs(
      this._rgba[0],
      this._rgba[1],
      this._rgba[2],
      alphaScaleData,
    );
    this._updateHexInput(
      this._rgba[0],
      this._rgba[1],
      this._rgba[2],
      alphaScaleData,
    );

    event.preventDefault();
  }

  /**
   * Handles the color picker form submit
   * Sets the temporary color picker value to the new value
   * Dispatches an input change event
   **/
  _handleHexSubmit(event: Event) {
    this.value = RGBAToHexA(...this._rgba);
    this.dispatchEvent(new InputEvent("change"));

    this._closeColorPicker();
    event.preventDefault();
  }

  /**
   * Handles the color field input click
   * Opens the color picker popup
   **/
  _handleHostElementClick(event: Event) {
    // ignore click events triggered by popup/color picker
    if (event.composedPath()[0] === this) {
      // reset color picker to current value
      this._rgba = this.value ? HexAToRGBA(this.value) : [0, 0, 0, 0];
      this._updateRGBAInputs(...this._rgba);
      this._handleRGBAInput();

      this._openColorPicker();
    }
  }
}

// define custom element <color-picker>
window.customElements.define("color-picker", ColorPicker);
