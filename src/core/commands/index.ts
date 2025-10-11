import { NewTab } from "@commands/new-tab";
import { DuplicateTab } from "@commands/duplicate-tab";
import { CloseTab } from "@commands/close-tab";
import {
  CloseLeftTabs,
  CloseRightTabs,
  CloseOtherTabs,
} from "@commands/close-tabs";
import { RestoreTab } from "@commands/restore-tab";
import { ReloadTab } from "@commands/reload-tab";
import { ReloadAllTabs } from "@commands/reload-all-tabs";
import { ZoomIn, ZoomOut, ZoomReset } from "@commands/zoom";
import { PageBack, PageForth } from "@commands/page-back-forth";
import { TogglePin, ToggleMute, ToggleBookmark } from "@commands/toggle";
import { ScrollTop, ScrollBottom } from "@commands/scroll-top-bottom";
import { ScrollPageUp, ScrollPageDown } from "@commands/scroll-page";
import { FocusLeftTab, FocusRightTab } from "@commands/focus-left-right";
import { FocusFirstTab, FocusLastTab } from "@commands/focus-first-last";
import { FocusPreviousSelectedTab } from "@commands/focus-last-accessed";
import { StopLoading } from "@commands/stop-loading";
import {
  MoveLeftTabsToNewWindow,
  MoveRightTabsToNewWindow,
  MoveTabLeft,
  MoveTabRight,
  MoveTabToEnd,
  MoveTabToStart,
  MoveTabToNewWindow,
} from "@commands/move-tabs";
import {
  CloseWindow,
  EnterFullscreen,
  MaximizeWindow,
  MinimizeWindow,
  NewPrivateWindow,
  NewWindow,
  ToggleFullscreen,
  ToggleWindowSize,
} from "@commands/window";
import { ToRootURL, URLLevelUp } from "@commands/urls";
import {
  OpenAddonSettings,
  OpenPrintPreview,
  ViewPageSourceCode,
} from "@commands/open";
import { CopyImageURL, CopyLinkURL, CopyTabURL } from "@commands/copy-url";
import {
  OpenURLFromClipboard,
  OpenURLFromClipboardInNewPrivateWindow,
  OpenURLFromClipboardInNewTab,
  OpenURLFromClipboardInNewWindow,
} from "@commands/open-clipboard";
import { CopyTextSelection } from "@commands/copy-selection";
import {
  OpenLink,
  OpenLinkInNewWindow,
  OpenLinkInNewTab,
  OpenLinkInNewPrivateWindow,
} from "@commands/open-link";
import { PopupAllTabs } from "@commands/popup-all-tabs";
import { RunMultiPurposeCommand } from "@commands/multi-purpose";
import { SendMessageToOtherAddon } from "@commands/send-msg-addon";
import { CopyImage } from "@commands/copy-image";
import { PopupRecentlyClosedTabs } from "@commands/popup-recently-closed";
import { PopupCustomCommandList } from "@commands/popup-commands";
import {
  SearchClipboard,
  SearchTextSelection,
  SearchClipboardInNewTab,
  SearchTextSelectionInNewTab,
} from "@commands/search";
import { SaveLink, SaveScreenshot } from "@commands/save";
import { ReloadFrame } from "@commands/reload-frame";
import { LinkToNewBookmark } from "@commands/link-bookmark";
import {
  OpenCustomURL,
  OpenCustomURLInNewPrivateWindow,
  OpenCustomURLInNewTab,
  OpenCustomURLInNewWindow,
} from "@commands/open-custom";
import {
  DecreaseURLNumber,
  IncreaseURLNumber,
} from "@commands/crease-url-number";

export const commands = {
  NewTab,
  DuplicateTab,
  StopLoading,
  CloseTab,
  CloseRightTabs,
  CloseLeftTabs,
  CloseOtherTabs,
  RestoreTab,
  ReloadTab,
  ZoomIn,
  ZoomOut,
  ZoomReset,
  PageBack,
  PageForth,
  TogglePin,
  ToggleMute,
  ToggleBookmark,
  ScrollTop,
  ScrollBottom,
  ScrollPageUp,
  ScrollPageDown,
  FocusRightTab,
  FocusLeftTab,
  FocusFirstTab,
  FocusLastTab,
  FocusPreviousSelectedTab,
  MaximizeWindow,
  MinimizeWindow,
  ToggleFullscreen,
  ToggleWindowSize,
  NewWindow,
  NewPrivateWindow,
  EnterFullscreen,
  MoveLeftTabsToNewWindow,
  MoveRightTabsToNewWindow,
  MoveTabLeft,
  MoveTabRight,
  MoveTabToEnd,
  MoveTabToStart,
  MoveTabToNewWindow,
  CloseWindow,
  ReloadAllTabs,
  ToRootURL,
  URLLevelUp,
  ViewPageSourceCode,
  OpenAddonSettings,
  OpenPrintPreview,
  CopyTabURL,
  CopyLinkURL,
  CopyImageURL,
  OpenURLFromClipboard,
  OpenURLFromClipboardInNewTab,
  OpenURLFromClipboardInNewWindow,
  OpenURLFromClipboardInNewPrivateWindow,
  CopyTextSelection,
  CopyImage,
  OpenLink,
  OpenLinkInNewTab,
  OpenLinkInNewWindow,
  OpenLinkInNewPrivateWindow,
  SearchClipboard,
  SearchTextSelection,
  SearchClipboardInNewTab,
  SearchTextSelectionInNewTab,
  OpenCustomURL,
  OpenCustomURLInNewTab,
  OpenCustomURLInNewWindow,
  OpenCustomURLInNewPrivateWindow,
  PopupAllTabs,
  PopupRecentlyClosedTabs,
  PopupCustomCommandList,
  RunMultiPurposeCommand,
  SendMessageToOtherAddon,
  SaveLink,
  SaveScreenshot,
  ReloadFrame,
  LinkToNewBookmark,
  IncreaseURLNumber,
  DecreaseURLNumber,
} as const;

export type CommandName = keyof typeof commands;
