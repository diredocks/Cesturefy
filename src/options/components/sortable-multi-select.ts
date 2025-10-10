type SelectChangeEvent = CustomEvent<string[]>;

interface SortableMultiSelectEventMap {
  change: SelectChangeEvent;
  dragleave: DragEvent;
}

export class SortableMultiSelect<T = string> extends HTMLElement {
  private _itemBBoxMap: WeakMap<Element, DOMRect>;
  private _draggedItem: HTMLElement | null;
  private _draggedItemOriginalSuccessor: Element | null;
  private _resizeObserver: ResizeObserver;

  constructor() {
    super();

    this.attachShadow({ mode: "open", delegatesFocus: true }).innerHTML = `
      <link rel="stylesheet" href="/options/components/sortable-multi-select.css">
      <div id="wrapper">
        <div id="selection" part="selection" tabindex="-1">
          <div id="items"></div>
          <input id="search" part="search" placeholder="Add">
        </div>
        <slot id="dropdown" part="dropdown" class="hidden" tabindex="-1" data-placeholder="No results"></slot>
      </div>
    `;

    this._itemBBoxMap = new WeakMap();
    this._draggedItem = null;
    this._draggedItemOriginalSuccessor = null;

    // Update box dimensions on change
    this._resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.borderBoxSize) {
          const borderBoxSize = Array.isArray(entry.borderBoxSize)
            ? entry.borderBoxSize[0]
            : entry.borderBoxSize;

          const target = entry.target as HTMLElement;
          target.style.setProperty("--bboxHeight", String(borderBoxSize.blockSize));
          target.style.setProperty("--bboxWidth", String(borderBoxSize.inlineSize));
        }
      }
    });

    this._setupEventListeners();
  }

  static get observedAttributes(): string[] {
    return ["placeholder", "dropdown-placeholder"];
  }

  disconnectedCallback(): void {
    this._resizeObserver.disconnect();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (!this.isConnected) return;

    switch (name) {
      case "placeholder": {
        const search = this.shadowRoot!.getElementById("search") as HTMLInputElement;
        if (search) search.placeholder = newValue || "";
        break;
      }
      case "dropdown-placeholder": {
        const dropdown = this.shadowRoot!.getElementById("dropdown");
        if (dropdown) dropdown.dataset.placeholder = newValue || "";
        break;
      }
    }
  }

  get value(): T[] {
    const items = this.shadowRoot!.getElementById("items")!;
    return Array.from(items.children).map(
      (item) => (item as HTMLElement).dataset.value as unknown as T
    );
  }

  set value(values: T[] | string) {
    if (typeof values === "string") values = JSON.parse(values);
    if (!Array.isArray(values)) return;

    const items = this.shadowRoot!.getElementById("items")!;
    while (items.firstChild) items.firstChild.remove();

    const dropdown = this.shadowRoot!.getElementById("dropdown") as HTMLSlotElement;
    const dropdownItems = dropdown.assignedElements() as SortableMultiSelectItem[];

    for (const itemValue of values) {
      const dropdownItem = dropdownItems.find(item => item.value === itemValue);
      if (dropdownItem) {
        const newItem = this._buildSelectedItem(dropdownItem.value, dropdownItem.label);
        items.append(newItem);
      }
    }
  }

  get name(): string | null {
    return this.getAttribute("name");
  }

  set name(value: string) {
    this.setAttribute("name", value);
  }

  get placeholder(): string | null {
    return this.getAttribute("placeholder");
  }

  set placeholder(value: string) {
    this.setAttribute("placeholder", value);
  }

  get dropdownPlaceholder(): string | null {
    return this.getAttribute("dropdown-placeholder");
  }

  set dropdownPlaceholder(value: string) {
    this.setAttribute("dropdown-placeholder", value);
  }

  private _setupEventListeners(): void {
    const wrapper = this.shadowRoot!.getElementById("wrapper")!;
    wrapper.addEventListener("focusout", () => this._handleFocusout());

    const selection = this.shadowRoot!.getElementById("selection")!;
    selection.addEventListener("focus", () => this._handleSelectionFocus());
    selection.addEventListener("dragover", (e) => this._handleSelectionDragover(e as DragEvent));

    const items = this.shadowRoot!.getElementById("items")!;
    const mutationObserver = new MutationObserver(entries => {
      const lastEntry = entries[entries.length - 1];
      const target = lastEntry.target as HTMLElement;
      const items = target.children;
      for (const item of Array.from(items)) {
        this._itemBBoxMap.set(item, item.getBoundingClientRect());
      }
    });
    mutationObserver.observe(items, { childList: true, subtree: true });

    const search = this.shadowRoot!.getElementById("search")!;
    search.addEventListener("input", () => this._handleSearchInput());
    search.addEventListener("focus", () => this._handleSearchFocus());
    search.addEventListener("keydown", (e) => this._handleSearchKeydown(e as KeyboardEvent));

    const dropdown = this.shadowRoot!.getElementById("dropdown")!;
    dropdown.addEventListener("click", (e) => this._handleDropdownClick(e));
    dropdown.addEventListener("keydown", (e) => this._handleDropdownKeydown(e as KeyboardEvent));
    dropdown.addEventListener("animationend", (e) => this._handleDropdownAnimationend(e as AnimationEvent));
    dropdown.addEventListener("slotchange", () => this._handleDropdownSlotchange());

    this.addEventListener("dragleave", (e) => this._handleDragleave(e));
  }

  _buildSelectedItem(itemValue: string, itemLabel: string): HTMLElement {
    const item = document.createElement("div");
    item.part.add("item");
    item.classList.add("item");
    item.draggable = true;
    item.tabIndex = 0;
    item.dataset.value = itemValue;
    item.addEventListener("dragstart", (e) => this._handleItemDragstart(e as DragEvent));
    item.addEventListener("dragend", (e) => this._handleItemDragend(e as DragEvent));
    item.addEventListener("animationend", (e) => this._handleItemAnimationend(e as AnimationEvent));

    const itemContent = document.createElement("span");
    itemContent.part.add("item-inner-text");
    itemContent.classList.add("item-inner-text");
    itemContent.textContent = itemLabel;

    const itemRemoveButton = document.createElement("button");
    itemRemoveButton.part.add("item-remove-button");
    itemRemoveButton.classList.add("item-remove-button");
    itemRemoveButton.addEventListener("click", (e) => this._handleItemRemoveButtonClick(e));

    item.append(itemContent, itemRemoveButton);
    return item;
  }

  private _focusSearch(): void {
    const search = this.shadowRoot!.getElementById("search") as HTMLInputElement;
    search?.focus();
  }

  private _clearSearch(): void {
    const search = this.shadowRoot!.getElementById("search") as HTMLInputElement;
    if (search) search.value = "";
  }

  private _showDropdown(): void {
    const dropdown = this.shadowRoot!.getElementById("dropdown")!;
    if (!dropdown.classList.contains("hidden")) return;

    const wrapper = this.shadowRoot!.getElementById("wrapper")!;
    this._resizeObserver.observe(wrapper, { box: "border-box" });

    const bbox = wrapper.getBoundingClientRect();
    (wrapper as HTMLElement).style.setProperty("--bboxX", String(bbox.x));
    (wrapper as HTMLElement).style.setProperty("--bboxY", String(bbox.y));

    const spaceTop = bbox.y;
    const spaceBottom = window.innerHeight - (bbox.y + bbox.height);

    dropdown.classList.toggle("shift", spaceBottom < spaceTop);
    dropdown.classList.remove("hidden");
    dropdown.classList.add("animate");
  }

  private _filterDropdown(filterString: string): void {
    const dropdown = this.shadowRoot!.getElementById("dropdown") as HTMLSlotElement;
    const filterStringKeywords = filterString.toLowerCase().trim().split(" ");
    let hasResults = false;

    for (const item of dropdown.assignedElements() as SortableMultiSelectItem[]) {
      const itemContent = item.value.toLowerCase().trim();
      const isMatching = filterStringKeywords.every(keyword => itemContent.includes(keyword));
      item.hidden = !isMatching;
      if (isMatching) hasResults = true;
    }

    dropdown.part.toggle("no-results", !hasResults);
    dropdown.classList.toggle("no-results", !hasResults);
  }

  _hideDropdown(): void {
    const dropdown = this.shadowRoot!.getElementById("dropdown")!;
    if (!dropdown.classList.contains("hidden")) {
      this._resizeObserver.disconnect();
      dropdown.classList.add("hidden", "animate");
    }
  }

  private _handleFocusout(): void {
    const wrapper = this.shadowRoot!.getElementById("wrapper")!;
    if (!wrapper.matches(":focus-within")) {
      this._hideDropdown();
      this._clearSearch();
    }
  }

  private _handleSelectionFocus(): void {
    this._focusSearch();
  }

  private _handleDropdownSlotchange(): void {
    const dropdown = this.shadowRoot!.getElementById("dropdown") as HTMLSlotElement;
    const expectedChildElements = dropdown.assignedElements().every(element => {
      return element instanceof SortableMultiSelectItem;
    });
    if (!expectedChildElements) {
      throw new Error("All sortable-multi-select children should be of type sortable-multi-select-item.");
    }
  }

  _handleDropdownClick(event: Event): void {
    const dropdown = this.shadowRoot!.getElementById("dropdown") as HTMLSlotElement;

    const item = event.composedPath().find((ele: EventTarget) => {
      return (ele as HTMLElement).assignedSlot === dropdown;
    }) as SortableMultiSelectItem | undefined;
    if (!item) return;

    const items = this.shadowRoot!.getElementById("items")!;
    const newItem = this._buildSelectedItem(item.value, item.label);
    newItem.classList.add("animate");
    items.append(newItem);
    this.dispatchEvent(new CustomEvent("change", { detail: this.value }));
  }

  private _handleDropdownAnimationend(event: AnimationEvent): void {
    if (event.animationName === "hideDropdown") {
      this._filterDropdown("");
    }
    (event.currentTarget as HTMLElement).classList.remove("animate");
  }

  private _handleDropdownKeydown(event: KeyboardEvent): void {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

    const dropdown = this.shadowRoot!.getElementById("dropdown") as HTMLSlotElement;
    const matchingItems = (dropdown.assignedElements() as SortableMultiSelectItem[]).filter(item => !item.hidden);

    if (matchingItems.length === 0) return;

    const focusedItemIndex = matchingItems.findIndex(item => item === event.target);

    switch (event.key) {
      case "ArrowUp":
        matchingItems[focusedItemIndex - 1]?.focus();
        break;
      case "ArrowDown":
        matchingItems[focusedItemIndex + 1]?.focus();
        break;
    }

    event.preventDefault();
  }

  private _handleSearchFocus(): void {
    this._showDropdown();
  }

  private _handleSearchKeydown(event: KeyboardEvent): void {
    this._handleDropdownKeydown(event);
  }

  private _handleSearchInput(): void {
    const search = this.shadowRoot!.getElementById("search") as HTMLInputElement;
    this._filterDropdown(search.value);
  }

  private _handleItemAnimationend(event: AnimationEvent): void {
    (event.currentTarget as HTMLElement).classList.remove("animate");
  }

  _handleItemRemoveButtonClick(event: Event): void {
    const item = (event.target as HTMLElement).closest(".item") as HTMLElement | null;
    if (!item) return;

    const nextFocus = (item.nextElementSibling ?? item.previousElementSibling) as HTMLElement;
    nextFocus.focus();
    item.remove();
    this.dispatchEvent(new CustomEvent("change", { detail: this.value }));
  }

  private _handleItemDragstart(event: DragEvent): void {
    this._draggedItem = event.target as HTMLElement;
    this._draggedItemOriginalSuccessor = this._draggedItem.nextElementSibling;

    const items = this.shadowRoot!.getElementById("items")!.children;
    for (const item of Array.from(items)) {
      this._itemBBoxMap.set(item, item.getBoundingClientRect());
    }

    setTimeout(() => {
      if (this._draggedItem) {
        this._draggedItem.part.add("dragged");
        this._draggedItem.classList.add("dragged");
      }
    }, 0);
  }

  private _handleItemDragend(event: DragEvent): void {
    if (!this._draggedItem) return;

    if (event.dataTransfer!.dropEffect === "none") {
      const items = this.shadowRoot!.getElementById("items")!;
      if (this._draggedItemOriginalSuccessor) {
        this._draggedItemOriginalSuccessor.before(this._draggedItem);
      } else {
        items.append(this._draggedItem);
      }
    } else if (this._draggedItemOriginalSuccessor !== this._draggedItem.nextElementSibling) {
      this.dispatchEvent(new CustomEvent("change", { detail: this.value }));
    }

    this._draggedItem.part.remove("dragged");
    this._draggedItem.classList.remove("dragged");
    this._draggedItem.classList.add("animate");
    this._draggedItem = null;
    this._draggedItemOriginalSuccessor = null;
  }

  private _handleSelectionDragover(event: DragEvent): void {
    if (!this._draggedItem) return;

    const items = this.shadowRoot!.getElementById("items")!.children;
    let minDistance = Infinity;
    let nearestItem: Element | null = null;

    for (const item of Array.from(items)) {
      const bbox = this._itemBBoxMap.get(item);
      if (!bbox) continue;

      if (event.clientY < bbox.y || event.clientY > bbox.y + bbox.height) {
        continue;
      }

      const dx = event.clientX - (bbox.x + bbox.width / 2);
      const dy = event.clientY - (bbox.y + bbox.height / 2);
      const distance = Math.hypot(dx, dy);

      if (distance < minDistance) {
        minDistance = distance;
        nearestItem = item;
      }
    }

    if (nearestItem && nearestItem !== this._draggedItem) {
      const draggedItemBBox = this._itemBBoxMap.get(this._draggedItem);
      const nearestItemBBox = this._itemBBoxMap.get(nearestItem);
      if (!draggedItemBBox || !nearestItemBBox) return;

      const itemCenterX = nearestItemBBox.x + nearestItemBBox.width / 2;
      const itemCenterY = nearestItemBBox.y + nearestItemBBox.height / 2;

      const wrapper = this.shadowRoot!.getElementById("wrapper") as HTMLElement;
      const containerWidth = Number(wrapper.style.getPropertyValue("--bboxWidth"));

      if (containerWidth - nearestItemBBox.width < draggedItemBBox.width) {
        if (itemCenterY > event.clientY) {
          if (nearestItem.previousElementSibling !== this._draggedItem) {
            nearestItem.before(this._draggedItem);
          }
        } else if (nearestItem.nextElementSibling !== this._draggedItem) {
          nearestItem.after(this._draggedItem);
        }
      } else {
        if (itemCenterX > event.clientX) {
          if (nearestItem.previousElementSibling !== this._draggedItem) {
            nearestItem.before(this._draggedItem);
          }
        } else if (nearestItem.nextElementSibling !== this._draggedItem) {
          nearestItem.after(this._draggedItem);
        }
      }
    }

    if (this._draggedItem?.isConnected) {
      event.preventDefault();
    }
  }

  private _handleDragleave(event: DragEvent): void {
    this._draggedItem?.remove();
  }

  addEventListener<K extends keyof SortableMultiSelectEventMap>(
    type: K,
    listener: (this: SortableMultiSelect, ev: SortableMultiSelectEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void {
    super.addEventListener(type, listener as EventListener, options);
  }

  removeEventListener<K extends keyof SortableMultiSelectEventMap>(
    type: K,
    listener: (this: SortableMultiSelect, ev: SortableMultiSelectEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void {
    super.removeEventListener(type, listener as EventListener, options);
  }
}

customElements.define("sortable-multi-select", SortableMultiSelect);

export class SortableMultiSelectItem extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback(): void {
    if (!this.hasAttribute("tabindex")) {
      this.tabIndex = -1;
    }
    this.addEventListener("keyup", this._handleKeyup);
    this.addEventListener("click", this._handleClick);
  }

  disconnectedCallback(): void {
    this.removeEventListener("keyup", this._handleKeyup);
    this.removeEventListener("click", this._handleClick);
  }

  get value(): string {
    return this.getAttribute("value") || this.textContent?.trim() || "";
  }

  set value(value: string) {
    this.setAttribute("value", value);
  }

  get label(): string {
    return this.getAttribute("label") || this.textContent?.trim() || "";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(value: boolean) {
    this.toggleAttribute("disabled", Boolean(value));
  }

  private _handleKeyup = (event: KeyboardEvent): void => {
    if (event.key === "Enter" && !this.disabled) {
      this.click();
    }
  };

  private _handleClick = (event: Event): void => {
    if (this.disabled) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  };
}

customElements.define("sortable-multi-select-item", SortableMultiSelectItem);
