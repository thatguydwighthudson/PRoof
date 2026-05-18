const PLATES_LBS = [45, 35, 25, 10, 5, 2.5];
const BAR_LBS = 45;

export type PlateResult = {
  targetLbs: number;
  perSide: number[];
  totalLoaded: number;
};

export function calculatePlates(targetLbs: number): PlateResult {
  const weightOnBar = Math.max(0, targetLbs - BAR_LBS);
  const perSideTarget = weightOnBar / 2;
  let remaining = perSideTarget;
  const perSide: number[] = [];

  for (const plate of PLATES_LBS) {
    while (remaining >= plate - 0.001) {
      perSide.push(plate);
      remaining -= plate;
    }
  }

  const loadedPerSide = perSide.reduce((a, b) => a + b, 0);
  const totalLoaded = BAR_LBS + loadedPerSide * 2;

  return {
    targetLbs,
    perSide,
    totalLoaded: Math.round(totalLoaded * 10) / 10,
  };
}
