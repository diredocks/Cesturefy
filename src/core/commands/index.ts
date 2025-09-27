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

export const commands = {
  NewTab,
  DuplicateTab,
  CloseTab,
  CloseRightTabs,
  CloseLeftTabs,
  CloseOtherTabs,
  RestoreTab,
  ReloadTab,
  ReloadAllTabs,
  ZoomIn,
  ZoomOut,
  ZoomReset,
  PageBack,
  PageForth,
  TogglePin,
  ToggleMute,
  ScrollTop,
  ScrollBottom,
} as const;

export type CommandName = keyof typeof commands;
