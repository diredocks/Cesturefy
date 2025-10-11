import { GestureJSON } from "@model/gesture";
import { CommandJSON } from "@model/command";
import { MatchingAlgorithm } from "@utils/match";
import { SuppressionKey, MouseButton } from "@utils/types";

export interface TimeoutSettings {
  active: boolean;
  duration: number;
}

export interface TraceStyleSettings {
  strokeStyle: string;
  lineWidth: number;
  lineGrowth: boolean;
}

export interface TraceSettings {
  display: boolean;
  Style: TraceStyleSettings;
}

export interface CommandStyleSettings {
  fontColor: string;
  backgroundColor: string;
  fontSize: string;
  horizontalPosition: number;
  verticalPosition: number;
}

export interface CommandDisplaySettings {
  display: boolean;
  followCursor: boolean;
  Style: CommandStyleSettings;
}

export interface GestureSettings {
  mouseButton: MouseButton;
  suppressionKey: SuppressionKey;
  distanceThreshold: number;
  deviationTolerance: number;
  matchingAlgorithm: MatchingAlgorithm;
  Timeout: TimeoutSettings;
  Trace: TraceSettings;
  Command: CommandDisplaySettings;
}

export interface RockerSettings {
  active: boolean;
  leftMouseClick: CommandJSON;
  rightMouseClick: CommandJSON;
};

export interface WheelSettings {
  active: boolean;
  mouseButton: MouseButton;
  wheelSensitivity: number;
  wheelUp: CommandJSON;
  wheelDown: CommandJSON;
};

export interface GeneralSettings {
  updateNotification: boolean;
  theme: string;
}

export interface Settings {
  Gesture: GestureSettings;
  Rocker: RockerSettings;
  Wheel: WheelSettings;
  General: GeneralSettings;
}

export interface ConfigSchema {
  Settings: Settings;
  Gestures: GestureJSON[];
  Exclusions: string[];
}

export const DefaultConfig: ConfigSchema = {
  Settings: {
    Gesture: {
      mouseButton: 2,
      suppressionKey: 'none',
      distanceThreshold: 10, // px
      deviationTolerance: 0.15,
      matchingAlgorithm: "Combined",
      Timeout: {
        active: false,
        duration: 1 // s
      },
      Trace: {
        display: true,
        Style: {
          strokeStyle: "#fab12fcc",
          lineWidth: 10,
          lineGrowth: true,
        },
      },
      Command: {
        display: true,
        followCursor: false,
        Style: {
          fontColor: "#ffffffff",
          backgroundColor: "#00000080",
          fontSize: "7vh",
          horizontalPosition: 50,
          verticalPosition: 40,
        },
      },
    },
    Rocker: {
      active: false,
      leftMouseClick: {
        name: "NewTab",
      },
      rightMouseClick: {
        name: "CloseTab",
      },
    },
    Wheel: {
      active: false,
      mouseButton: MouseButton.LEFT,
      wheelSensitivity: 30,
      wheelUp: {
        name: "NewTab",
      },
      wheelDown: {
        name: "CloseTab",
      },
    },
    General: {
      updateNotification: true, // TODO
      theme: "light",
    },
  },
  Gestures: [
    {
      pattern: [[-1, 0]],
      command: {
        name: "NewTab",
        settings: { focus: false },
      },
    },
    {
      pattern: [[1, 0]],
      command: {
        name: 'CloseTab',
        settings: { nextFocus: 'next' }
      },
    },
  ],
  Exclusions: [],
};
