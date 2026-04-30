// Points awarded per outcome — adjust these constants to tune scoring
export const POINTS = {
  GROUP_WIN: 3,
  GROUP_DRAW: 1,
  GROUP_LOSS: 0,
  ROUND_OF_32_WIN: 5,
  ROUND_OF_16_WIN: 8,
  QUARTER_FINAL_WIN: 12,
  SEMI_FINAL_WIN: 18,
  FINAL_WIN: 30,     // Champion
  FINAL_LOSS: 15,    // Runner-up
  CLEAN_SHEET_BONUS: 2,
  GOAL_BONUS: 1,     // per goal scored
} as const;

function stagePoints(stage: string, isWinner: boolean, isFinal: boolean): number {
  if (isFinal) return isWinner ? POINTS.FINAL_WIN : POINTS.FINAL_LOSS;
  const map: Record<string, number> = {
    "Group Stage": isWinner ? POINTS.GROUP_WIN : 0,
    "Round of 32": isWinner ? POINTS.ROUND_OF_32_WIN : 0,
    "Round of 16": isWinner ? POINTS.ROUND_OF_16_WIN : 0,
    "Quarter-final": isWinner ? POINTS.QUARTER_FINAL_WIN : 0,
    "Semi-final": isWinner ? POINTS.SEMI_FINAL_WIN : 0,
  };
  return map[stage] ?? 0;
}

export function calcMatchPoints(params: {
  goalsFor: number;
  goalsAgainst: number;
  stage: string;
}): number {
  const { goalsFor, goalsAgainst, stage } = params;
  const isFinal = stage === "Final";
  const isWinner = goalsFor > goalsAgainst;
  const isDraw = goalsFor === goalsAgainst;
  const cleanSheet = goalsAgainst === 0;

  let pts = 0;

  if (stage === "Group Stage") {
    pts += isDraw ? POINTS.GROUP_DRAW : stagePoints(stage, isWinner, false);
  } else {
    pts += stagePoints(stage, isWinner, isFinal);
  }

  pts += goalsFor * POINTS.GOAL_BONUS;
  if (cleanSheet) pts += POINTS.CLEAN_SHEET_BONUS;

  return pts;
}
