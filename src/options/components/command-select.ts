import {
  COMMAND_SETTING_TEMPLATES,
  COMMAND_ITEMS,
} from "@options/utils/common";
import { isEmpty } from "@utils/common";
import Command from "@model/command";

export class CommandSelect extends HTMLElement {
  private _command: Command | null = null;
  private _selectedCommand: Command | null = null;
  private _scrollPosition = 0;
  private shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
    this.shadow.innerHTML = `
      <link rel="stylesheet" href="/options/components/command-select.css">
      <button id="mainAccessButton"></button>
      <button id="secondaryAccessButton"></button>
    `;

    this.shadow
      .getElementById("mainAccessButton")!
      .addEventListener("click", this._handleMainButtonClick.bind(this));
    this.shadow
      .getElementById("secondaryAccessButton")!
      .addEventListener("click", this._handleSecondaryButtonClick.bind(this));
  }

  static get observedAttributes() {
    return ["value"];
  }

  attributeChangedCallback(
    _name: string,
    _oldValue: string | null,
    newValue: string | null,
  ) {
    this._updateButtons(newValue ? JSON.parse(newValue) : null);
  }

  private _updateButtons(value: any) {
    const mainBtn = this.shadow.getElementById("mainAccessButton")!;
    const secBtn = this.shadow.getElementById("secondaryAccessButton")!;

    if (value) {
      this._command = Command.fromJSON({
        name: value.name,
        settings: value.settings,
      });
    } else {
      this._command = null;
    }

    if (this._command instanceof Command) {
      mainBtn.textContent = mainBtn.title = this._command.toString();
      const hasSettings = this._command.hasSettings();
      secBtn.classList.toggle("has-settings", hasSettings);
      secBtn.title = hasSettings
        ? chrome.i18n.getMessage("commandBarOpenSettingsText")
        : chrome.i18n.getMessage("commandBarOpenSelectionText");
    } else {
      mainBtn.textContent = mainBtn.title = "";
      secBtn.classList.remove("has-settings");
      secBtn.title = chrome.i18n.getMessage("commandBarOpenSelectionText");
    }
  }

  get value(): any {
    return JSON.parse(this.getAttribute("value") || "null");
  }

  set value(val: any) {
    this.setAttribute("value", JSON.stringify(val));
  }

  get command(): Command | null {
    return this._command;
  }

  set command(val: Command | null) {
    if (val instanceof Command) {
      this._command = val;
      this.setAttribute("value", JSON.stringify(val.toJSON()));
    } else {
      this._command = null;
      this.removeAttribute("value");
    }
  }

  private _buildCommandBar(): DocumentFragment {
    const frag = document.createRange().createContextualFragment(`
      <div id="overlay"></div>
      <div id="commandBar">
        <button id="commandBarCancelButton" type="button"></button>
        <div id="commandBarWrapper"></div>
      </div>
    `);

    frag
      .getElementById("overlay")!
      .addEventListener("click", () => this._closeCommandBar(), { once: true });
    frag
      .getElementById("commandBarCancelButton")!
      .addEventListener("click", () => this._closeCommandBar(), { once: true });

    return frag;
  }

  private async _buildCommandsPanel(): Promise<HTMLElement> {
    const frag = document.createRange().createContextualFragment(`
      <div id="commandsPanel" class="cb-panel">
        <div class="cb-head">
          <div id="commandsHeading" class="cb-heading"></div>
          <button id="commandsSearchButton" type="button"></button>
          <input id="commandsSearchInput" class="input-field">
        </div>
        <div id="commandsMain" class="cb-main">
          <div id="commandsScrollContainer" class="cb-scroll-container"></div>
        </div>
      </div>
    `);

    const heading = frag.getElementById("commandsHeading")!;
    heading.title = heading.textContent =
      chrome.i18n.getMessage("commandBarTitle");

    const searchBtn = frag.getElementById("commandsSearchButton")!;
    const searchInput = frag.getElementById(
      "commandsSearchInput",
    ) as HTMLInputElement;
    const panel = frag.getElementById("commandsPanel")!;

    searchBtn.addEventListener("click", () =>
      this._toggleSearch(searchInput, panel),
    );
    searchInput.placeholder = chrome.i18n.getMessage("commandBarSearch");
    searchInput.addEventListener("input", () =>
      this._handleSearch(searchInput.value, panel),
    );

    const container = frag.getElementById("commandsScrollContainer")!;
    const groups = new Map<string, HTMLUListElement>();

    for (const commandItem of COMMAND_ITEMS) {
      const li = document.createElement("li");
      li.classList.add("cb-command-item");
      li.dataset.command = commandItem.command;

      li.addEventListener("click", this._handleCommandItemClick.bind(this));
      li.addEventListener(
        "mouseenter",
        this._handleCommandItemMouseOver.bind(this),
      );
      li.addEventListener(
        "mouseleave",
        this._handleCommandItemMouseLeave.bind(this),
      );

      const div = document.createElement("div");
      div.classList.add("cb-command-container");
      const label = document.createElement("span");
      label.classList.add("cb-command-name");
      label.textContent = chrome.i18n.getMessage(
        `commandLabel${commandItem.command}`,
      );
      div.appendChild(label);

      // add settings symbol and build info string
      if (!isEmpty(commandItem.settings)) {
        const icon = document.createElement("span");
        icon.classList.add("cb-command-settings-icon");
        icon.title = chrome.i18n.getMessage("commandBarAdditionalSettingsText");
        div.appendChild(icon);
      }

      const info = document.createElement("div");
      info.classList.add("cb-command-info");
      const desc = document.createElement("span");
      desc.classList.add("cb-command-description");
      desc.textContent = chrome.i18n.getMessage(
        `commandDescription${commandItem.command}`,
      );
      info.appendChild(desc);

      // add permissions symbol and build info string
      if (commandItem.permissions) {
        const icon = document.createElement("span");
        icon.classList.add("cb-command-permissions-icon");
        icon.title = chrome.i18n.getMessage(
          "commandBarAdditionalPermissionsText",
        );

        commandItem.permissions.forEach((permission, index) => {
          if (index > 0) icon.title += ", ";
          icon.title += chrome.i18n.getMessage(`permissionLabel${permission}`);
        });

        info.append(icon);
      }

      li.append(div, info);

      if (groups.has(commandItem.group)) {
        groups.get(commandItem.group)!.appendChild(li);
      } else {
        const ul = document.createElement("ul");
        ul.classList.add("cb-command-group");
        ul.appendChild(li);
        groups.set(commandItem.group, ul);
        container.appendChild(ul);
      }
    }

    if (this.command) {
      const currentLi = frag.querySelector(
        `.cb-command-item[data-command="${this.command.getName()}"]`,
      );
      currentLi?.classList.add("cb-active");
    }

    return frag.firstElementChild as HTMLElement;
  }

  private async _buildSettingsPanel(): Promise<HTMLElement> {
    if (!this._selectedCommand) throw new Error("No selected command");

    const frag = document.createRange().createContextualFragment(`
      <div id="settingsPanel" class="cb-panel">
        <div class="cb-head">
          <button id="settingsBackButton" type="button"></button>
          <div id="settingsHeading" class="cb-heading"></div>
        </div>
        <div id="settingsMain" class="cb-main">
          <div id="settingsScrollContainer" class="cb-scroll-container"></div>
        </div>
      </div>
    `);

    const backBtn = frag.getElementById("settingsBackButton")!;
    backBtn.addEventListener("click", () => this._handleBackButtonClick());

    const heading = frag.getElementById("settingsHeading")!;
    heading.title = heading.textContent = this._selectedCommand.toString();

    const scrollContainer = frag.getElementById("settingsScrollContainer")!;
    const form = document.createElement("form");
    form.id = "settingsForm";
    form.addEventListener("submit", (e) => this._handleFormSubmit(e));
    scrollContainer.appendChild(form);

    const saveBtn = document.createElement("button");
    saveBtn.id = "settingsSaveButton";
    saveBtn.type = "submit";
    saveBtn.textContent = chrome.i18n.getMessage("buttonSave");
    form.appendChild(saveBtn);

    const templates = (
      await COMMAND_SETTING_TEMPLATES
    ).querySelectorAll<HTMLTemplateElement>(
      `[data-commands~="${this._selectedCommand.getName()}"]`,
    );

    for (const template of templates) {
      const container = document.createElement("div");
      container.classList.add("cb-setting");
      const node = document.importNode(template.content, true);
      container.appendChild(node);
      form.insertBefore(container, saveBtn);
    }

    // insert i18n text
    form.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
      el.textContent = chrome.i18n.getMessage(el.dataset.i18n!);
    });

    // set current value
    form.querySelectorAll<HTMLInputElement>("[name]").forEach((input) => {
      let value: any;
      if (
        this.command?.getName() === this._selectedCommand!.getName() &&
        this.command.hasSetting(input.name)
      ) {
        value = this.command.getSetting(input.name);
      } else {
        value = this._selectedCommand!.getSetting(input.name);
      }
      if (input.type === "checkbox") input.checked = !!value;
      else input.value = value;
    });

    return frag.firstElementChild as HTMLElement;
  }

  private _openCommandBar(panel: HTMLElement) {
    if (this.shadow.getElementById("commandBar")) return;
    const frag = this._buildCommandBar();
    const wrapper = frag.getElementById("commandBarWrapper")!;
    wrapper.appendChild(panel);

    const overlay = frag.getElementById("overlay")!;
    const bar = frag.getElementById("commandBar")!;

    overlay.classList.add("o-hide");
    bar.classList.add("cb-hide");

    this.shadow.appendChild(frag);

    bar.offsetHeight; // trigger reflow

    overlay.classList.replace("o-hide", "o-show");
    bar.classList.replace("cb-hide", "cb-show");
  }

  private _closeCommandBar() {
    const overlay = this.shadow.getElementById("overlay")!;
    const bar = this.shadow.getElementById("commandBar")!;
    overlay.addEventListener("transitionend", function remove(e) {
      if (e.currentTarget === e.target)
        overlay.removeEventListener("transitionend", remove);
      overlay.remove();
    });
    bar.addEventListener("transitionend", function remove(e) {
      if (e.currentTarget === e.target)
        bar.removeEventListener("transitionend", remove);
      bar.remove();
    });
    overlay.classList.replace("o-show", "o-hide");
    bar.classList.replace("cb-show", "cb-hide");

    this._selectedCommand = null;
    this._scrollPosition = 0;
  }

  private _showNewPanel(
    newPanel: HTMLElement,
    slideIn: string,
    slideOut: string,
  ) {
    const wrapper = this.shadow.getElementById("commandBarWrapper")!;
    const current = this.shadow.querySelector(".cb-panel")!;
    current.classList.add("cb-init-slide");
    newPanel.classList.add("cb-init-slide", slideIn);

    current.addEventListener("transitionend", function remove(e) {
      if (e.currentTarget === e.target) {
        current.remove();
        current.classList.remove("cb-init-slide", slideOut);
        current.removeEventListener("transitionend", remove);
      }
    });

    newPanel.addEventListener("transitionend", function finish(e) {
      if (e.currentTarget === e.target) {
        newPanel.classList.remove("cb-init-slide");
        newPanel.removeEventListener("transitionend", finish);
      }
    });

    wrapper.appendChild(newPanel);
    wrapper.offsetHeight;
    current.classList.add(slideOut);
    newPanel.classList.remove(slideIn);
  }

  private async _handleMainButtonClick() {
    this._openCommandBar(await this._buildCommandsPanel());
  }

  private async _handleSecondaryButtonClick() {
    if (this.command?.hasSettings()) {
      this._selectedCommand = this.command;
      this._openCommandBar(await this._buildSettingsPanel());
    } else {
      this._openCommandBar(await this._buildCommandsPanel());
    }
  }

  private async _handleBackButtonClick() {
    const panel = await this._buildCommandsPanel();
    this._showNewPanel(panel, "cb-slide-left", "cb-slide-right");
    const main = this.shadow.getElementById("commandsMain")!;
    main.scrollTop = this._scrollPosition;
  }

  private _handleFormSubmit(event: Event) {
    event.preventDefault();
    const inputs = this.shadow.querySelectorAll<HTMLInputElement>(
      "#settingsForm [name]",
    );
    inputs.forEach((input) => {
      let value: any;
      if (input.type === "checkbox") value = input.checked;
      else if (!isNaN(input.valueAsNumber)) value = input.valueAsNumber;
      else value = input.value;
      this._selectedCommand!.setSetting(input.name, value);
    });

    this.command = this._selectedCommand;
    this.dispatchEvent(new InputEvent("change"));
    this._closeCommandBar();
  }

  private _handleCommandItemMouseOver(event: MouseEvent) {
    const el = event.currentTarget as HTMLElement;
    setTimeout(() => {
      if (el.matches(".cb-command-item:hover")) {
        const info = el.querySelector(".cb-command-info") as HTMLElement;
        if (!info.style.height) info.style.height = info.scrollHeight + "px";
      }
    }, 500);
  }

  private _handleCommandItemMouseLeave(event: MouseEvent) {
    const info = (event.currentTarget as HTMLElement).querySelector(
      ".cb-command-info",
    ) as HTMLElement;
    if (info.style.height) info.style.removeProperty("height");
  }

  private async _handleCommandItemClick(event: MouseEvent) {
    const li = event.currentTarget as HTMLElement;
    (li.querySelector(".cb-command-info") as HTMLElement).style.removeProperty(
      "height",
    );
    const data = COMMAND_ITEMS.find((c) => c.command === li.dataset.command)!;

    // if the command requires permissions
    if (data.permissions) {
      const permissionRequest = chrome.permissions.request({
        origins: ["<all_urls>"],
        permissions: data.permissions,
      });
      // exit if permissions aren't granted
      if (!(await permissionRequest)) return;
    }

    // if the command offers any settings show them
    if (!isEmpty(data.settings)) {
      this._scrollPosition =
        this.shadow.getElementById("commandsMain")!.scrollTop;
      this._selectedCommand = Command.fromJSON({ name: data.command });
      const panel = await this._buildSettingsPanel();
      this._showNewPanel(panel, "cb-slide-right", "cb-slide-left");
    } else {
      this.command = Command.fromJSON({ name: data.command });
      this.dispatchEvent(new InputEvent("change"));
      this._closeCommandBar();
    }
  }

  private _toggleSearch(input: HTMLInputElement, panel: HTMLElement) {
    const visible = panel.classList.toggle("search-visible");
    if (!visible) {
      input.value = "";
      this._handleSearch("", panel);
    } else {
      input.focus();
    }
  }

  private _handleSearch(query: string, panel: HTMLElement) {
    const keywords = query.toLowerCase().trim().split(" ");
    panel.classList.toggle("search-runs", !!query);
    this.shadow
      .querySelectorAll<HTMLSpanElement>(".cb-command-name")
      .forEach((el) => {
        const name = el.textContent?.toLowerCase().trim() ?? "";
        const item = el.closest(".cb-command-item") as HTMLElement | null;
        if (item) item.hidden = !keywords.every((k) => name.includes(k));
      });
  }
}

customElements.define("command-select", CommandSelect);
