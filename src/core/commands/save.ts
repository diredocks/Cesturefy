import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";
import { isHTTPURL } from "@utils/common";

interface SaveSettings {
  promptDialog: boolean;
}

const SaveImageFn: CommandFn = async function (sender, data) {
  // TODO: This should be much more complicated due to blob and headers
  // but I'll do it later lol, so not shipping for now

  if (!sender.tab?.id || !data) return false;
  if (!data.target.imageData?.src) return false;
  if (!(data?.target.nodeName.toLocaleLowerCase() === "img")) return false;

  chrome.downloads.download({
    url: data.target.imageData.src,
  });

  return true;
};

export const SaveImage = defineCommand(SaveImageFn, {}, "image", ["downloads"]);

const SaveLinkFn: CommandFn<SaveSettings> = async function (_sender, data) {
  let url;
  if (isHTTPURL(data?.selection?.text)) url = data?.selection?.text;
  else if (data?.link?.href) url = data.link.href;
  if (!url) return false;

  await chrome.downloads.download({
    url,
    saveAs: this.getSetting("promptDialog"), // FIXME: this just doesn't work
  });

  return true;
};

export const SaveLink = defineCommand(
  SaveLinkFn,
  { promptDialog: true },
  "link",
  ["downloads"],
);

const SaveScreenshotFn: CommandFn = async function (sender) {
  const screenshotDataUrl = await chrome.tabs.captureVisibleTab({
    format: "jpeg",
  });

  // FIXME: no sanitizeFilename here
  const title = sender.tab?.title ?? "screenshot";
  const filename = `${title}_${new Date().getTime()}.jpeg`;

  await chrome.downloads.download({
    url: screenshotDataUrl,
    filename,
    saveAs: false,
  });

  // WARN: no free the blob for gc here

  return true;
};

export const SaveScreenshot = defineCommand(SaveScreenshotFn, {}, "capture", [
  "downloads",
  "activeTab",
]);
