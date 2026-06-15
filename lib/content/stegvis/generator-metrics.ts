export type StegvisGeneratorMetrics = {
  source: 'generator' | 'static';
  steps?: number;
  chainLength?: number;
  middleSteps?: number;
  missingClues?: number;
  score?: number;
  candidates?: number;
  pathsTried?: number;
  reason?: string;
};

export function logStegvisGeneratorMetrics(metrics: StegvisGeneratorMetrics) {
  console.log('[stegvis:generator]', JSON.stringify(metrics));
}
