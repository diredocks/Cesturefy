import { vectorDirectionDifference } from "@utils/common";
import { Vector, Vectors } from "@utils/types";
import { configManager } from "@model/config-manager";
import { DefaultConfig } from "@model/config";

export enum PatternStatus {
  PASSED_NO_THRESHOLD = 0,
  PASSED_DISTANCE_THRESHOLD = 1,
  PASSED_DIFFERENCE_THRESHOLD = 2,
}

export default class Pattern {
  private differenceThreshold: number =
    DefaultConfig.Settings.Gesture.deviationTolerance;
  private distanceThreshold: number =
    DefaultConfig.Settings.Gesture.distanceThreshold;

  private lastExtractedPoint: Vector | null = null;
  private previousPoint: Vector | null = null;
  private lastPoint: Vector | null = null;
  private previousVector: Vector | null = null;

  private extractedVectors: Vectors = [];

  constructor() {
    configManager.addEventListener("change", () => this.applyConfig());
    configManager.addEventListener("loaded", () => this.applyConfig());
  }

  clear(): void {
    this.extractedVectors = [];
    this.lastExtractedPoint = null;
    this.previousPoint = null;
    this.lastPoint = null;
    this.previousVector = null;
  }

  addPoint(x: number, y: number): PatternStatus {
    const point: Vector = [x, y];
    let status: PatternStatus = PatternStatus.PASSED_NO_THRESHOLD;

    if (!this.previousPoint) {
      this.previousPoint = point;
      this.lastExtractedPoint = point;
      this.lastPoint = point;
      return status;
    }

    const [prevX, prevY] = this.previousPoint;
    const newVector: Vector = [x - prevX, y - prevY];
    const distance = Math.hypot(...newVector);

    if (distance <= this.distanceThreshold) {
      this.lastPoint = point;
      return status;
    }

    if (!this.previousVector) {
      this.previousVector = newVector;
      status = PatternStatus.PASSED_DISTANCE_THRESHOLD;
    } else {
      const diff = vectorDirectionDifference(
        this.previousVector[0],
        this.previousVector[1],
        newVector[0],
        newVector[1],
      );

      if (
        Math.abs(diff) > this.differenceThreshold &&
        this.lastExtractedPoint
      ) {
        this.extractedVectors.push([
          prevX - this.lastExtractedPoint[0],
          prevY - this.lastExtractedPoint[1],
        ]);
        this.previousVector = newVector;
        this.lastExtractedPoint = this.previousPoint;
        status = PatternStatus.PASSED_DIFFERENCE_THRESHOLD;
      } else {
        status = PatternStatus.PASSED_DISTANCE_THRESHOLD;
      }
    }

    this.previousPoint = point;
    this.lastPoint = point;
    return status;
  }

  getPattern(): Vectors {
    if (!this.lastPoint || !this.lastExtractedPoint) return [];

    const lastVector: Vector = [
      this.lastPoint[0] - this.lastExtractedPoint[0],
      this.lastPoint[1] - this.lastExtractedPoint[1],
    ];

    return [...this.extractedVectors, lastVector];
  }

  applyConfig() {
    this.distanceThreshold = configManager.getPath([
      "Settings",
      "Gesture",
      "distanceThreshold",
    ]);
    this.differenceThreshold = configManager.getPath([
      "Settings",
      "Gesture",
      "deviationTolerance",
    ]);
  }
}
