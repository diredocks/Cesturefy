# Commands to be implemented

This is a TODO list of commands to be implemented

## What's already done?

- [x]  CloseTab
- [x]  DuplicateTab
- [x]  NewTab
- [x]  PageBack
- [x]  PageForth
- [x]  CloseLeftTabs
- [x]  CloseOtherTabs
- [x]  CloseRightTabs
- [x]  ReloadTab
- [x]  RestoreTab
- [x]  ReloadAllTabs
- [x]  ReloadFrame
- [x]  ZoomIn
- [x]  ZoomOut
- [x]  ZoomReset
- [x]  ToggleMute
- [x]  TogglePin
- [x]  ToggleBookmark
- [x]  ScrollTop
- [x]  ScrollBottom
- [x]  ScrollPageUp
- [x]  ScrollPageDown
- [x]  FocusFirstTab
- [x]  FocusLastTab
- [x]  FocusLeftTab
- [x]  FocusRightTab
- [x]  FocusPreviousSelectedTab
- [x]  StopLoading
- [x]  MoveLeftTabsToNewWindow
- [x]  MoveRightTabsToNewWindow
- [x]  MoveTabLeft
- [x]  MoveTabRight
- [x]  MoveTabToEnd
- [x]  MoveTabToNewWindow
- [x]  MoveTabToStart
- [x]  EnterFullscreen
- [x]  ToggleFullscreen
- [x]  ToggleWindowSize
- [x]  CloseWindow
- [x]  MaximizeWindow
- [x]  MinimizeWindow
- [x]  NewWindow
- [x]  ToRootURL
- [x]  URLLevelUp
- [x]  ViewPageSourceCode
- [x]  OpenAddonSettings
- [x]  CopyImageURL
- [x]  CopyLinkURL
- [x]  CopyTabURL
- [x]  OpenLink
- [x]  OpenLinkInNewTab
- [x]  OpenLinkInNewWindow
- [x]  CopyTextSelection
- [x]  CopyImage
- [x]  OpenURLFromClipboard
- [x]  OpenURLFromClipboardInNewTab
- [x]  OpenURLFromClipboardInNewWindow
- [x]  PopupAllTabs
- [x]  PopupRecentlyClosedTabs
- [x]  PopupCustomCommandList
- [x]  RunMultiPurposeCommand
- [x]  SendMessageToOtherAddon
- [x]  SearchClipboard
- [x]  SearchClipboardInNewTab
- [x]  SearchTextSelection
- [x]  SearchTextSelectionInNewTab
- [x]  SaveLink
- [x]  SaveScreenshot
- [x]  OpenPrintPreview
- [x]  LinkToNewBookmark
- [x]  OpenCustomURL
- [x]  OpenCustomURLInNewTab
- [x]  OpenCustomURLInNewWindow
- [x]  NewPrivateWindow
- [x]  OpenLinkInNewPrivateWindow
- [x]  OpenCustomURLInNewPrivateWindow
- [x]  OpenURLFromClipboardInNewPrivateWindow
- [x]  DecreaseURLNumber
- [x]  IncreaseURLNumber

## What's not done yet?

- [ ]  ExecuteUserScript
- [ ]  InsertCustomText
- [ ]  OpenImageInNewTab
- [ ]  SaveImage(WIP)
- [ ]  ViewImage

## What won't be done?

- [ ] ~~ClearBrowsingData~~ (it's strange to blow up all your data with just a simple gesture)
- [ ] ~~PrintTab~~ (no `tabs.print` in Chrome, and I don't see difference between OpenPrintPreview)
- [ ] ~~SaveTabAsPDF~~ (no `tabs.SaveAsPDF` in Chrome)
- [ ] ~~PopupSearchEngines~~ (no `search.get` in Chrome)
- [ ] ~~ToggleReaderMode~~ (no `tabs.toggleReaderMode` in Chrome)
- [ ] ~~OpenHomepage~~ (no `browserSettings.homepageOverride.get` in Chrome)
- [ ] ~~PasteClipboard~~ (`document.execCommand` deprecated)
