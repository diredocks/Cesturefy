import { vectorDirectionDifference } from "@utils/common";
import { Vectors } from "@utils/types";
import Gesture from "@model/gesture";
import { DefaultConfig } from "@model/config";
import { configManager } from "@model/config-manager";

export type MatchingAlgorithm = "Strict" | "ShapeIndependent" | "Combined";

export class Matcher {
  private maxDeviation: number =
    DefaultConfig.Settings.Gesture.deviationTolerance;
  private algorithm: MatchingAlgorithm =
    DefaultConfig.Settings.Gesture.matchingAlgorithm;

  constructor() {
    configManager.addEventListener("change", () => this.applyConfig());
    configManager.addEventListener("loaded", () => this.applyConfig());
  }

  getGestureByPattern(pattern: Vectors, gestures: Gesture[]): Gesture | null {
    return getGestureByPattern(
      pattern,
      gestures,
      this.maxDeviation,
      this.algorithm,
    );
  }

  applyConfig() {
    this.maxDeviation = configManager.getPath([
      "Settings",
      "Gesture",
      "deviationTolerance",
    ]);
    this.algorithm = configManager.getPath([
      "Settings",
      "Gesture",
      "matchingAlgorithm",
    ]);
  }

  static instance = new Matcher();
}

export const matcher = Matcher.instance;

function getGestureByPattern(
  pattern: Vectors,
  gestures: Gesture[],
  maxDeviation: number,
  algorithm: MatchingAlgorithm,
) {
  let matchedGesture: Gesture | null = null;

  switch (algorithm) {
    case "Strict": {
      let lowestMismatchRatio = maxDeviation;
      for (const g of gestures) {
        const diff = patternSimilarityByProportion(pattern, g.getPattern());
        if (diff < lowestMismatchRatio) {
          lowestMismatchRatio = diff;
          matchedGesture = g;
        }
      }
      break;
    }

    case "ShapeIndependent": {
      let lowestMismatchRatio = maxDeviation;
      for (const g of gestures) {
        const diff = patternSimilarityByDTW(pattern, g.getPattern());
        if (diff < lowestMismatchRatio) {
          lowestMismatchRatio = diff;
          matchedGesture = g;
        }
      }
      break;
    }

    case "Combined":
    default: {
      let lowestMismatchRatio = Infinity;
      for (const g of gestures) {
        const diffDTW = patternSimilarityByDTW(pattern, g.getPattern());
        if (diffDTW > maxDeviation) continue;
        const diffProportion = patternSimilarityByProportion(
          pattern,
          g.getPattern(),
        );
        const diff = diffDTW + diffProportion;
        if (diff < lowestMismatchRatio) {
          lowestMismatchRatio = diff;
          matchedGesture = g;
        }
      }
    }
  }

  return matchedGesture;
}

function patternSimilarityByProportion(
  patternA: Vectors,
  patternB: Vectors,
): number {
  const totalAMagnitude = patternMagnitude(patternA);
  const totalBMagnitude = patternMagnitude(patternB);

  let totalDifference = 0;

  let a = 0,
    b = 0;

  let vectorAMagnitudeProportionStart = 0;
  let vectorBMagnitudeProportionStart = 0;

  while (a < patternA.length && b < patternB.length) {
    const vectorA = patternA[a];
    const vectorB = patternB[b];

    const vectorAMagnitude = Math.hypot(...vectorA);
    const vectorBMagnitude = Math.hypot(...vectorB);

    const vectorAMagnitudeProportion = vectorAMagnitude / totalAMagnitude;
    const vectorBMagnitudeProportion = vectorBMagnitude / totalBMagnitude;

    const vectorAMagnitudeProportionEnd =
      vectorAMagnitudeProportionStart + vectorAMagnitudeProportion;
    const vectorBMagnitudeProportionEnd =
      vectorBMagnitudeProportionStart + vectorBMagnitudeProportion;

    const overlappingMagnitudeProportion = overlapProportion(
      vectorAMagnitudeProportionStart,
      vectorAMagnitudeProportionEnd,
      vectorBMagnitudeProportionStart,
      vectorBMagnitudeProportionEnd,
    );

    if (vectorAMagnitudeProportionEnd > vectorBMagnitudeProportionEnd) {
      b++;
      vectorBMagnitudeProportionStart = vectorBMagnitudeProportionEnd;
    } else if (vectorAMagnitudeProportionEnd < vectorBMagnitudeProportionEnd) {
      a++;
      vectorAMagnitudeProportionStart = vectorAMagnitudeProportionEnd;
    } else {
      a++;
      b++;
      vectorAMagnitudeProportionStart = vectorAMagnitudeProportionEnd;
      vectorBMagnitudeProportionStart = vectorBMagnitudeProportionEnd;
    }

    const vectorDifference = Math.abs(
      vectorDirectionDifference(vectorA[0], vectorA[1], vectorB[0], vectorB[1]),
    );
    totalDifference += vectorDifference * overlappingMagnitudeProportion;
  }

  return totalDifference;
}

function patternSimilarityByDTW(patternA: Vectors, patternB: Vectors): number {
  const rows = patternA.length;
  const columns = patternB.length;

  const DTW: number[][] = Array.from(Array(rows), () =>
    Array(columns).fill(Infinity),
  );

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      const cost = Math.abs(
        vectorDirectionDifference(
          patternA[i][0],
          patternA[i][1],
          patternB[j][0],
          patternB[j][1],
        ),
      );

      if (i !== 0 && j !== 0) {
        DTW[i][j] =
          cost + Math.min(DTW[i - 1][j], DTW[i][j - 1], DTW[i - 1][j - 1]);
      } else if (i !== 0) {
        DTW[i][j] = cost + DTW[i - 1][j];
      } else if (j !== 0) {
        DTW[i][j] = cost + DTW[i][j - 1];
      } else {
        DTW[i][j] = cost;
      }
    }
  }

  return DTW[rows - 1][columns - 1] / Math.max(rows, columns);
}

function overlapProportion(
  minA: number,
  maxA: number,
  minB: number,
  maxB: number,
): number {
  return Math.max(0, Math.min(maxA, maxB) - Math.max(minA, minB));
}

function patternMagnitude(pattern: Vectors): number {
  return pattern.reduce((total, vector) => total + Math.hypot(...vector), 0);
}
