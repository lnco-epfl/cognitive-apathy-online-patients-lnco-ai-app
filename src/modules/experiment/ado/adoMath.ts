/* eslint-disable no-restricted-syntax */

/* eslint-disable @typescript-eslint/naming-convention */
// Utility functions for ADO calculations
export const SEED_DELAYS = [0, 500, 1000, 1500];
export const CANDIDATE_DELAYS = Array.from({ length: 41 }, (_, i) => i * 50); // 0–2000 ms
export const TEMP = 0.1;
export const DIVERSITY_WEIGHT = 0.0;
export const ALPHA = 0.0;

// Small constant to avoid numerical issues
export const EPS = 1e-9;

// Simple logistic function
export const logistic = (x: number): number => 1 / (1 + Math.exp(-x));

// Safe normalization for arrays
export const normalize = (arr: number[]): number[] => {
  const sum = arr.reduce((a, b) => a + b, 0);
  return sum === 0 ? arr.map(() => 1 / arr.length) : arr.map((v) => v / sum);
};

// Shannon entropy (base 2)
export const entropy = (p: number[]): number => {
  const safeP = p.map((v) => Math.max(v, EPS));
  return -safeP.reduce((acc, v) => acc + v * Math.log2(v), 0);
};

export interface ParamSet {
  mu: number;
  k: number;
  gamma: number;
  lambda: number;
}

let cachedGrid: ParamSet[] | null = null;

export const PARAM_GRID = (): ParamSet[] => {
  if (cachedGrid) return cachedGrid;
  const grid: ParamSet[] = [];
  const muValues = Array.from({ length: 20 }, (_, i) => 100 + i * (1900 / 19));
  const kValues = Array.from(
    { length: 20 },
    (_, i) => 0.001 + (i * (0.02 - 0.001)) / 19,
  );
  const gammaValues = [
    0, 0.025, 0.05, 0.075, 0.1, 0.125, 0.15, 0.175, 0.2, 0.225, 0.25, 0.275,
    0.3,
  ];
  const lambdaValues = [
    0, 0.025, 0.05, 0.075, 0.1, 0.125, 0.15, 0.175, 0.2, 0.225, 0.25, 0.275,
    0.3,
  ];
  for (const mu of muValues)
    for (const k of kValues)
      for (const gamma of gammaValues)
        for (const lambda of lambdaValues) grid.push({ mu, k, gamma, lambda });
  cachedGrid = grid;
  return grid;
};

// Compute P(Yes) for an array of parameter sets at a given delay
export const pYesGrid = (delay: number): number[] =>
  PARAM_GRID().map(({ mu, k, gamma, lambda }) => {
    const p = logistic(k * (mu - delay));
    return Math.min(Math.max(gamma + (1 - gamma - lambda) * p, EPS), 1 - EPS);
  });

// Compute log-likelihoods for an array of parameter sets
export const logLikelihoodArray = (
  delays: number[],
  responses: number[],
): number[] =>
  PARAM_GRID().map(({ mu, k, gamma, lambda }) => {
    const logL = delays.reduce((sum, d, i) => {
      const y = responses[i];
      const p = Math.min(
        Math.max(gamma + (1 - gamma - lambda) * logistic(k * (mu - d)), EPS),
        1 - EPS,
      );
      return sum + (y * Math.log(p) + (1 - y) * Math.log(1 - p));
    }, 0);
    return logL;
  });

// Compute posterior probabilities from data
export const posteriorFromData = (
  delays: number[],
  responses: number[],
  logPrior?: number[],
): number[] => {
  const ll = logLikelihoodArray(delays, responses);
  const prior = logPrior ?? new Array(ll.length).fill(Math.log(1 / ll.length));

  // combine log prior + log likelihood
  const logPost = ll.map((v, i) => v + prior[i]);
  const maxLog = Math.max(...logPost);
  const postUnnorm = logPost.map((v) => Math.exp(v - maxLog));
  return normalize(postUnnorm);
};

// Compute Expected Information Gain for candidate delays
export const computeEIG = (
  candidateDelays: number[],
  posterior: number[],
): number[] => {
  const Hprior = entropy(posterior);

  return candidateDelays.map((d) => {
    const pYes = pYesGrid(d);

    const p_r1 = pYes.reduce((sum, p, j) => sum + posterior[j] * p, 0);
    const p_r0 = 1 - p_r1;

    const post_r1_unn = pYes.map((p, j) => posterior[j] * p);
    const post_r0_unn = pYes.map((p, j) => posterior[j] * (1 - p));

    const post_r1 = normalize(post_r1_unn);
    const post_r0 = normalize(post_r0_unn);

    const H_r1 = entropy(post_r1);
    const H_r0 = entropy(post_r0);

    return Hprior - (p_r1 * H_r1 + p_r0 * H_r0);
  });
};

// Select the next delay using EIG and diversity considerations
export const selectNextDelay = (
  candidateDelays: number[],
  eigs: number[],
  historyCounts: Record<number, number>,
  temp = TEMP,
  diversityWeight = DIVERSITY_WEIGHT,
  alpha = ALPHA,
): number => {
  const counts = candidateDelays.map((d) => historyCounts[d] ?? 0);
  const diversityFactor = counts.map((c) => 1 / (1 + alpha * c));

  const utility = eigs.map(
    (eig, i) =>
      eig * (1 - diversityWeight + diversityWeight * diversityFactor[i]),
  );

  // softmax sampling
  const maxU = Math.max(...utility);
  const probs = normalize(
    utility.map((u) => Math.exp((u - maxU) / Math.max(temp, EPS))),
  );

  // sample one delay
  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < probs.length; i += 1) {
    cum += probs[i];
    if (r <= cum) return candidateDelays[i];
  }
  return candidateDelays[candidateDelays.length - 1]; // fallback
};
