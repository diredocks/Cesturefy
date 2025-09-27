import { CommandFn, CommandGroup, CommandDefinition, CommandPermission } from "@utils/types";

export function defineCommand<TSettings>(
  fn: CommandFn<TSettings>,
  defaults: Required<TSettings>,
  group: CommandGroup,
  permissions?: CommandPermission[],
): CommandDefinition<TSettings> {
  return { fn, defaults, group, permissions };
}
