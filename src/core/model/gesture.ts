import { Vectors } from "@utils/types";
import Command from "@model/command";

export interface GestureJSON {
  pattern: Vectors;
  command: ReturnType<Command["toJSON"]>;
  label?: string;
}

export default class Gesture {
  private _pattern: Vectors;
  private _command: Command;
  private _label?: string;

  constructor(pattern: Vectors, command: Command, label?: string);
  constructor(json: GestureJSON);
  constructor(
    patternOrJson: Vectors | GestureJSON,
    command?: Command,
    label?: string,
  ) {
    if (Array.isArray(patternOrJson)) {
      this._pattern = patternOrJson;
      if (!command) throw new Error("Command must be provided.");
      this._command = command;
      this._label = label;
    } else {
      this._pattern = patternOrJson.pattern;
      this._command = Command.fromJSON(patternOrJson.command);
      this._label = patternOrJson.label;
    }
  }

  toString(): string {
    return this._label ?? this.getCommand().toString();
  }

  getLabel(): string | undefined {
    return this._label;
  }

  setLabel(value: string | undefined) {
    this._label = value;
  }

  getPattern(): Vectors {
    return this._pattern;
  }

  setPattern(value: Vectors): void {
    this._pattern = value;
  }

  getCommand(): Command {
    return this._command;
  }

  setCommand(value: Command): void {
    this._command = value;
  }

  toJSON(): GestureJSON {
    return {
      pattern: this._pattern,
      command: this._command.toJSON(),
      label: this._label,
    };
  }

  static fromJSON(json: GestureJSON): Gesture {
    const command = Command.fromJSON(json.command);
    return new Gesture(json.pattern, command, json.label);
  }
}
