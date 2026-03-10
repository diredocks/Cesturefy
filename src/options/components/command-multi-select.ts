import {
  COMMAND_SETTING_TEMPLATES,
  COMMAND_ITEMS,
  getMessage,
} from "@options/utils/common";
import { SortableMultiSelect } from "@options/components/sortable-multi-select";
import Command from "@model/command"; // TODO: Maybe CommandJSON here

export class CommandMultiSelect extends SortableMultiSelect<Command> {
  private _commandSettingsRelation: WeakMap<Element, HTMLElement>;

  constructor() {
    super();

    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = "/options/components/command-multi-select.css";
    this.shadowRoot!.append(stylesheet);

    const settingsContainer = document.createElement("div");
    settingsContainer.id = "settings";
    this.shadowRoot!.append(settingsContainer);

    // Build command selection list
    COMMAND_ITEMS.forEach((commandItem) => {
      const commandMultiSelectItem = document.createElement(
        "sortable-multi-select-item",
      );
      commandMultiSelectItem.dataset.command = commandItem.command;
      commandMultiSelectItem.textContent = getMessage(
        `commandLabel${commandItem.command}`,
      );
      this.append(commandMultiSelectItem);
    });

    this._commandSettingsRelation = new WeakMap();
  }

  connectedCallback(): void {
    this.placeholder = getMessage(
      "commandMultiSelectAddPlaceholder",
    );
    this.dropdownPlaceholder = getMessage(
      "commandMultiSelectNoResultsPlaceholder",
    );
  }

  get value(): Command[] {
    const commandList: Command[] = [];

    const items = this.shadowRoot!.getElementById("items")!;
    for (const item of Array.from(items.children) as HTMLElement[]) {
      // Create command object and add it to the return value list
      const command = Command.fromJSON({
        name: item.dataset.value!,
      }) as Command;
      commandList.push(command);

      const settings = this._commandSettingsRelation.get(item);
      // If no settings exist skip to next command
      if (!settings) continue;

      const settingInputs =
        settings.querySelectorAll<HTMLInputElement>("[name]");
      settingInputs.forEach((input) => {
        let value: any;
        if (input.type === "checkbox") value = input.checked;
        else if (!isNaN(input.valueAsNumber)) value = input.valueAsNumber;
        else value = input.value;
        command.setSetting(input.name, value);
      });
    }

    return commandList;
  }

  set value(value: Command[] | any[]) {
    // Remove all previous items and settings
    const items = this.shadowRoot!.getElementById("items")!;
    while (items.firstChild) items.firstChild.remove();

    const settingsContainer = this.shadowRoot!.getElementById("settings")!;
    while (settingsContainer.firstChild) settingsContainer.firstChild.remove();

    // Add new command items and settings
    for (let command of value) {
      // Convert command JSON object to Command
      command = Command.fromJSON({
        name: command.name,
        settings: command.settings,
      });
      this._createCommandItem(command);
    }
  }

  /**
   * Constructs a command item and its settings if any
   * The item is immediately appended to the selection
   * Stores the settings html in the _commandSettingsRelation map
   * Returns the command item html element
   */
  private async _createCommandItem(command: Command): Promise<HTMLElement> {
    const items = this.shadowRoot!.getElementById("items")!;
    const commandItem = this._buildSelectedItem(
      command.getName(),
      command.toString(),
    );
    items.append(commandItem);

    // If the command offers any settings create the necessary inputs
    if (command.hasSettings()) {
      const settingsContainer = this.shadowRoot!.getElementById("settings")!;
      const settingsPanel = await this._buildSettingsPanel(command);
      settingsContainer.append(settingsPanel);
      // Save relation/mapping of command and its setting elements
      this._commandSettingsRelation.set(commandItem, settingsPanel);
    }

    return commandItem;
  }

  private _selectCommandItem(commandItem: HTMLElement | null): void {
    // Unmark current command if any
    const currentlySelectedCommandItem = this.shadowRoot!.querySelector(
      "#items .item.selected",
    );
    if (currentlySelectedCommandItem) {
      currentlySelectedCommandItem.classList.remove("selected");
      // Hide settings if available
      const currentlySelectedCommandSettings =
        this._commandSettingsRelation.get(currentlySelectedCommandItem);
      if (currentlySelectedCommandSettings) {
        currentlySelectedCommandSettings.hidden = true;
      }
    }
    // Mark new command as active
    if (commandItem) {
      commandItem.classList.add("selected");
      // Show settings if available
      const newlySelectedCommandSettings =
        this._commandSettingsRelation.get(commandItem);
      if (newlySelectedCommandSettings) {
        newlySelectedCommandSettings.hidden = false;
      }
    }
  }

  _buildSelectedItem(itemValue: string, itemLabel: string): HTMLElement {
    // Call parent method
    const item = super._buildSelectedItem(itemValue, itemLabel);
    item.addEventListener("focusin", (e) => this._handleItemFocusin(e));
    return item;
  }

  private async _buildSettingsPanel(command: Command): Promise<HTMLElement> {
    const settingsPanel = document.createElement("div");
    settingsPanel.className = "cms-settings-panel";
    settingsPanel.hidden = true;

    const settingTemplates = await COMMAND_SETTING_TEMPLATES;

    // Build and insert the corresponding setting templates
    for (const template of settingTemplates.querySelectorAll<HTMLTemplateElement>(
      `[data-commands~="${command.getName()}"]`,
    )) {
      const settingContainer = document.createElement("div");
      settingContainer.classList.add("cb-setting");
      const setting = document.importNode(template.content, true);
      // Append the current settings
      settingContainer.append(setting);
      settingsPanel.append(settingContainer);
    }

    // Insert text from language files
    for (const element of settingsPanel.querySelectorAll<HTMLElement>(
      "[data-i18n]",
    )) {
      element.textContent = getMessage(element.dataset.i18n!);
    }

    // Insert command settings
    for (const settingInput of settingsPanel.querySelectorAll<HTMLInputElement>(
      "[name]",
    )) {
      if (!command.hasSetting(settingInput.name)) {
        continue;
      }
      if (settingInput.type === "checkbox") {
        settingInput.checked = Boolean(command.getSetting(settingInput.name));
      } else {
        settingInput.value = String(command.getSetting(settingInput.name));
      }
    }

    return settingsPanel;
  }

  async _handleDropdownClick(event: Event): Promise<void> {
    const dropdown = this.shadowRoot!.getElementById(
      "dropdown",
    ) as HTMLSlotElement;
    // Get closest slotted element
    const commandSelectItem = event.composedPath().find((ele) => {
      return (ele as HTMLElement).assignedSlot === dropdown;
    }) as HTMLElement | undefined;

    if (!commandSelectItem) {
      return;
    }
    // Get command object
    const commandItems = COMMAND_ITEMS;
    const commandObject = commandItems.find((element) => {
      return element.command === commandSelectItem.dataset.command;
    });

    if (commandObject) {
      // If the command requires permissions
      if (commandObject.permissions) {
        const permissionRequest = chrome.permissions.request({
          permissions: commandObject.permissions,
        });
        // Exit if permissions aren't granted
        if (!(await permissionRequest)) return;
      }

      const command = Command.fromJSON({
        name: commandObject.command,
        settings: commandObject.settings,
      });
      const commandItem = await this._createCommandItem(command);
      commandItem.classList.add("animate");
      // Mark new command item as active and show settings
      this._selectCommandItem(commandItem);
    }
  }

  private _handleItemFocusin(event: Event): void {
    // Mark command item as active and show settings
    this._selectCommandItem(event.currentTarget as HTMLElement);
    super._hideDropdown();
  }

  _handleItemRemoveButtonClick(event: Event): void {
    const item = (event.target as HTMLElement).closest(".item") as HTMLElement;
    // Call parent method
    super._handleItemRemoveButtonClick(event);
    // Remove settings
    this._commandSettingsRelation.get(item)?.remove();
  }
}

// Define custom element <command-multi-select></command-multi-select>
customElements.define("command-multi-select", CommandMultiSelect);
