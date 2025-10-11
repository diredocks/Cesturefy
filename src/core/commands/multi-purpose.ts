import { CommandFn } from "@utils/types";
import { defineCommand } from "@commands/commands";
import Command, { CommandJSON } from "@model/command";

interface RunMultiPurposeSettings {
  commands: CommandJSON[];
}

const fn: CommandFn<RunMultiPurposeSettings> = async function (sender, data) {
  let returnValue = false;

  const commands = this.getSetting("commands").map((cmd) =>
    Command.fromJSON(cmd),
  );

  for (const command of commands) {
    returnValue = await command.execute(sender, data);
    if (returnValue === true) break;
  }

  return returnValue;
};

export const RunMultiPurposeCommand = defineCommand(
  fn,
  { commands: [] },
  "advanced",
);
