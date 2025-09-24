import { CommandFn, CommandGroup, CommandDefinition } from "@utils/types";

export function defineCommand<TSettings>(
  fn: CommandFn<TSettings>,
  defaults: Required<TSettings>,
  group: CommandGroup
): CommandDefinition<TSettings> {
  return { fn, defaults, group };
}
