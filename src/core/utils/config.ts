import { MouseButton } from "@controller/mouse";
import { GestureJSON } from "@model/gesture";
import { MatchingAlgorithm } from "@utils/match";

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
  Style: CommandStyleSettings;
}

export interface GestureSettings {
  mouseButton: MouseButton;
  suppressionKey: string;
  distanceThreshold: number;
  deviationTolerance: number;
  matchingAlgorithm: MatchingAlgorithm;
  Timeout: TimeoutSettings;
  Trace: TraceSettings;
  Command: CommandDisplaySettings;
}

export interface GeneralSettings {
  updateNotification: boolean;
  theme: string;
}

export interface Settings {
  Gesture: GestureSettings;
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
      suppressionKey: "", // TODO
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
        Style: {
          fontColor: "#ffffffff",
          backgroundColor: "#00000080",
          fontSize: "7vh",
          horizontalPosition: 50,
          verticalPosition: 40,
        },
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
