import { NewTab } from "@commands/new-tab";
import { DuplicateTab } from "@commands/duplicate-tab";
import { CloseTab } from "@commands/close-tab";
import { CloseRightTabs } from "@commands/close-right-tabs";
import { CloseLeftTabs } from "@commands/close-left-tabs";
import { CloseOtherTabs } from "@commands/close-other-tabs";
import { RestoreTab } from "@commands/restore-tab";
import { ReloadTab } from "@commands/reload-tab";
import { ReloadAllTabs } from "@commands/reload-all-tabs";
import { ZoomIn } from "@commands/zoom-in";
import { ZoomOut } from "@commands/zoom-out";
import { ZoomReset } from "@commands/zoom-reset";
import { PageBack } from "@commands/page-back";
import { PageForth } from "@commands/page-forth";
import { TogglePin } from "@commands/toggle-pin";
import { ToggleMute } from "@commands/toggle-mute";
import { ScrollTop } from "@commands/scroll-top";
import { ScrollBottom } from "@commands/scroll-bottom";
import { ScrollPageUp, ScrollPageDown } from "@commands/scroll-page";
import { FocusLeftTab, FocusRightTab } from "@commands/focus-left-right";
import { FocusFirstTab, FocusLastTab } from "@commands/focus-first-last";
import { FocusPreviousSelectedTab } from "@commands/focus-last-accessed";
import { StopLoading } from "@commands/stop-loading";
import {
  MoveLeftTabsToNewWindow,
  MoveRightTabsToNewWindow,
  MoveTabLeft, MoveTabRight,
  MoveTabToEnd, MoveTabToStart,
  MoveTabToNewWindow
} from "@commands/move-tabs";
import {
  CloseWindow, EnterFullscreen,
  MaximizeWindow, MinimizeWindow,
  NewWindow, ToggleFullscreen, ToggleWindowSize
} from "@commands/window";
import { ToRootURL, URLLevelUp } from "@commands/urls";
import { OpenAddonSettings, ViewPageSourceCode } from "@commands/open";
import { CopyImageURL, CopyLinkURL, CopyTabURL } from "@commands/copy-url";

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
  CopyTabURL,
  CopyLinkURL,
  CopyImageURL,
} as const;

export type CommandName = keyof typeof commands;
