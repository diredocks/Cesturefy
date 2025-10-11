import type { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";

// TODO: delta: number
interface URLNumberSettings {
  regex: string;
}

function buildNumberMatcher(customRegex?: string): RegExp {
  if (customRegex) {
    return new RegExp(customRegex);
  }

  const matchBetweenSlashes = /(?<=\/)(\d+)(?=[/?#]|$)/;
  const matchQueryParameterValue = /(?<=[?&]\w+=)(\d+)(?=[?&#]|$)/;

  return new RegExp(
    "((" +
      matchBetweenSlashes.source +
      ")|(" +
      matchQueryParameterValue.source +
      "))" +
      "(?!.*((" +
      matchBetweenSlashes.source +
      ")|(" +
      matchQueryParameterValue.source +
      ")))",
  );
}

function updateURLNumber(
  url: string,
  regex: RegExp,
  delta: number,
): string | null {
  const matched = url.match(regex)?.[0];
  if (!matched) return null;

  const newNumber = Number(matched) + delta;
  if (newNumber < 0 || Number.isNaN(newNumber)) return null;

  return url.replace(regex, () =>
    newNumber.toString().padStart(matched.length, "0"),
  );
}

const IncreaseURLNumberFn: CommandFn<URLNumberSettings> = async function (
  sender,
) {
  if (!sender.tab?.id) return false;

  const tabUrl = sender.tab?.url;
  if (!tabUrl) return false;

  const url = decodeURI(tabUrl);
  const matcher = buildNumberMatcher(this.getSetting("regex"));
  const newURL = updateURLNumber(url, matcher, +1);

  if (!newURL) return false;
  await chrome.tabs.update(sender.tab.id!, { url: newURL });

  return true;
};

const DecreaseURLNumberFn: CommandFn<URLNumberSettings> = async function (
  sender,
) {
  if (!sender.tab?.id) return false;

  const tabUrl = sender.tab?.url;
  if (!tabUrl) return false;

  const url = decodeURI(tabUrl);
  const matcher = buildNumberMatcher(this.getSetting("regex"));
  const newURL = updateURLNumber(url, matcher, -1);

  if (!newURL) return false;

  await chrome.tabs.update(sender.tab.id!, { url: newURL });
  return true;
};

export const IncreaseURLNumber = defineCommand(
  IncreaseURLNumberFn,
  { regex: "" },
  "url",
);
export const DecreaseURLNumber = defineCommand(
  DecreaseURLNumberFn,
  { regex: "" },
  "url",
);
