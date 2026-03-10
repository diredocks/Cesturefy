import { getMessage } from "@options/utils/common";

// TODO: Command, input as popup-box property?
interface PopupBoxEvents {
  open: void;
  close: string | boolean | undefined;
}

type PopupBoxEventMap = {
  [K in keyof PopupBoxEvents]: CustomEvent<PopupBoxEvents[K]>;
};

type PopupType = "alert" | "confirm" | "prompt" | "custom";

export class PopupBox extends HTMLElement {
  private _loaded: Promise<void>;
  public value: string | boolean | undefined;

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = `
      <link rel="stylesheet" href="/options/components/popup-box.css">
    `;

    // Wait for stylesheets
    this._loaded = new Promise((resolve) => {
      const sheet = this.shadowRoot!.querySelector<HTMLLinkElement>("link");
      if (!sheet) {
        resolve();
      } else if (sheet.sheet) {
        resolve(); // loaded
      } else {
        sheet.onload = () => resolve();
      }
    });
  }

  static get observedAttributes(): string[] {
    return ["type", "open"];
  }

  connectedCallback(): void {
    if (this.open && this.isConnected) this._openPopupBox();
  }

  disconnectedCallback(): void {
    this.shadowRoot?.getElementById("popupOverlay")?.remove();
    this.shadowRoot?.getElementById("popupWrapper")?.remove();
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (!this.isConnected) return;

    switch (name) {
      case "open":
        if (this.hasAttribute("open")) {
          if (oldValue == null) this._openPopupBox();
        } else {
          this._closePopupBox();
        }
        break;

      case "type":
        {
          this.shadowRoot?.getElementById("popupOverlay")?.remove();
          this.shadowRoot?.getElementById("popupWrapper")?.remove();
          const frag = this._buildPopupBox();
          this.shadowRoot?.append(frag);
        }
        break;
    }
  }

  get open(): boolean {
    return this.hasAttribute("open");
  }

  set open(value: boolean) {
    if (value) {
      this.setAttribute("open", "");
    } else {
      this.removeAttribute("open");
    }
  }

  get type(): PopupType {
    return (this.getAttribute("type") as PopupType) || "custom";
  }

  set type(value: PopupType) {
    this.setAttribute("type", value);
  }

  private _buildPopupBox(): DocumentFragment {
    const template = document.createElement("template");
    template.innerHTML = `
      <div id="popupOverlay"></div>
      <div id="popupWrapper">
        <div id="popupBox">
          <div id="popupBoxHead">
            <div id="popupBoxHeading"><slot name="title">Title..</slot></div>
            <button id="popupBoxCloseButton" type="button"></button>
          </div>
          <div id="popupBoxMain"><slot name="content">Content..</slot></div>
          <div id="popupBoxFooter"></div>
        </div>
      </div>
    `;

    const popupOverlay = template.content.getElementById("popupOverlay")!;
    const closeBtn = template.content.getElementById("popupBoxCloseButton")!;
    const footer = template.content.getElementById("popupBoxFooter")!;

    popupOverlay.addEventListener("click", () =>
      this._handleCloseButtonClick(),
    );
    closeBtn.addEventListener("click", () => this._handleCloseButtonClick());

    switch (this.type) {
      case "alert":
        {
          const btn = document.createElement("button");
          btn.id = "popupBoxConfirmButton";
          btn.textContent = getMessage("buttonConfirm");
          btn.addEventListener("click", () => this._handleCloseButtonClick());
          footer.append(btn);
        }
        break;

      case "confirm":
        {
          const confirmBtn = document.createElement("button");
          confirmBtn.id = "popupBoxConfirmButton";
          confirmBtn.textContent = getMessage("buttonConfirm");
          confirmBtn.addEventListener("click", () =>
            this._handleConfirmButtonClick(),
          );

          const cancelBtn = document.createElement("button");
          cancelBtn.id = "popupBoxCancelButton";
          cancelBtn.textContent = getMessage("buttonCancel");
          cancelBtn.addEventListener("click", () =>
            this._handleCancelButtonClick(),
          );

          footer.append(cancelBtn, confirmBtn);
        }
        break;

      case "prompt":
        {
          const input = document.createElement("input");
          input.id = "popupBoxInput";
          input.addEventListener("keypress", (e) =>
            this._handleInputKeypress(e),
          );

          const btn = document.createElement("button");
          btn.id = "popupBoxConfirmButton";
          btn.textContent = getMessage("buttonConfirm");
          btn.addEventListener("click", () => this._handleConfirmButtonClick());

          footer.append(input, btn);
        }
        break;
    }

    return template.content;
  }

  private async _openPopupBox(): Promise<void> {
    await this._loaded;
    this.value = undefined;

    const frag = this._buildPopupBox();
    const overlay = frag.getElementById("popupOverlay")!;
    const box = frag.getElementById("popupBox")!;

    overlay.classList.add("po-hide");
    box.classList.add("pb-hide");

    this.shadowRoot!.append(frag);

    // Force reflow
    void box.offsetHeight;

    overlay.addEventListener("transitionend", (e) => {
      if (e.currentTarget === e.target) {
        overlay.classList.remove("po-show");
      }
    });
    box.addEventListener("animationend", (e) => {
      if (e.currentTarget === e.target) {
        box.classList.remove("pb-show");
      }
    });

    overlay.classList.replace("po-hide", "po-show");
    box.classList.replace("pb-hide", "pb-show");

    this.dispatchEvent(new CustomEvent("open"));
  }

  private _closePopupBox(): void {
    const overlay = this.shadowRoot!.getElementById("popupOverlay")!;
    const wrapper = this.shadowRoot!.getElementById("popupWrapper")!;
    const box = this.shadowRoot!.getElementById("popupBox")!;

    overlay.addEventListener("transitionend", (e) => {
      if (e.currentTarget === e.target) overlay.remove();
    });
    box.addEventListener("transitionend", (e) => {
      if (e.currentTarget === e.target) wrapper.remove();
    });

    overlay.classList.add("po-hide");
    box.classList.add("pb-hide");

    this.dispatchEvent(new CustomEvent("close", { detail: this.value }));
  }

  private _handleCloseButtonClick(): void {
    this.open = false;
  }

  private _handleConfirmButtonClick(): void {
    const input = this.shadowRoot?.getElementById(
      "popupBoxInput",
    ) as HTMLInputElement | null;
    this.value = input ? input.value : true;
    this.open = false;
  }

  private _handleCancelButtonClick(): void {
    this.value = false;
    this.open = false;
  }

  private _handleInputKeypress(event: KeyboardEvent): void {
    if (event.key === "Enter") this._handleConfirmButtonClick();
  }

  addEventListener<K extends keyof PopupBoxEventMap>(
    type: K,
    listener: (this: PopupBox, ev: PopupBoxEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void {
    super.addEventListener(type, listener as EventListener, options);
  }

  removeEventListener<K extends keyof PopupBoxEventMap>(
    type: K,
    listener: (this: PopupBox, ev: PopupBoxEventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ): void {
    super.removeEventListener(type, listener as EventListener, options);
  }
}

customElements.define("popup-box", PopupBox);
