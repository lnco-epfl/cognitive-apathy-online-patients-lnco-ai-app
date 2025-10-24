/* eslint-disable no-console */
// If running in Node.js, import fs
import fs from 'fs';

import {
  PARAM_GRID,
  SEED_DELAYS,
  computeEIG,
  posteriorFromData,
  selectNextDelay,
} from './adoMath';

/**
 * Simulation parameters
 * Adjust these to explore different settings.
 */
const TRUE_PARAMS = {
  mu: 500,
  k: 0.005,
  gamma: 0.05,
  lambda: 0.05,
};

const NUM_TRIALS = 40;
const NUM_SIMULATIONS = 100; // number of independent simulated experiments
const CANDIDATE_DELAYS = Array.from({ length: 40 }, (_, i) => 50 + i * 50);

const simulateResponse = (delay: number): number => {
  const { mu, k, gamma, lambda } = TRUE_PARAMS;
  const pYes = gamma + (1 - gamma - lambda) / (1 + Math.exp(-k * (mu - delay)));
  return Math.random() < pYes ? 1 : 0;
};

export async function runSimulation(): Promise<void> {
  const masterLog: string[] = [];
  const masterSampledDelays: number[] = [];

  const estimates = {
    mu: [] as number[],
    k: [] as number[],
    gamma: [] as number[],
    lambda: [] as number[],
  };

  const posteriorSDs = {
    mu: [] as number[],
    k: [] as number[],
    gamma: [] as number[],
    lambda: [] as number[],
  };

  for (let run = 0; run < NUM_SIMULATIONS; run += 1) {
    const delays: number[] = [];
    const responses: number[] = [];
    const historyCounts: Record<number, number> = {};
    const runLog: string[] = [];
    const sampledThisRun: number[] = [];

    for (let t = 0; t < NUM_TRIALS; t += 1) {
      // seeds for first few trials
      if (t < SEED_DELAYS.length) {
        const seedDelay = SEED_DELAYS[t];
        const resp = simulateResponse(seedDelay);
        delays.push(seedDelay);
        responses.push(resp);
        sampledThisRun.push(seedDelay);
        const line = `Run ${run + 1} Trial ${t + 1}: delay=${seedDelay} ms (seed), response=${resp ? 'Yes' : 'No'}`;
        // eslint-disable-next-line no-console
        console.log(line);
        runLog.push(line);
        // eslint-disable-next-line no-continue
        continue;
      }

      const posterior = posteriorFromData(delays, responses);
      const eigs = computeEIG(CANDIDATE_DELAYS, posterior);
      const nextDelay = selectNextDelay(CANDIDATE_DELAYS, eigs, historyCounts);
      historyCounts[nextDelay] = (historyCounts[nextDelay] ?? 0) + 1;

      const resp = simulateResponse(nextDelay);
      delays.push(nextDelay);
      responses.push(resp);
      sampledThisRun.push(nextDelay);

      const line = `Run ${run + 1} Trial ${t + 1}: delay=${nextDelay} ms, response=${resp ? 'Yes' : 'No'}`;
      // eslint-disable-next-line no-console
      console.log(line);
      runLog.push(line);
    }

    const posterior = posteriorFromData(delays, responses);
    const grid = PARAM_GRID();

    // marginal posterior means and sd for parameters
    const totalP = posterior.reduce((s, v) => s + v, 0) || 1;
    const meanMu =
      posterior.reduce((s, p, i) => s + p * grid[i].mu, 0) / totalP;
    const meanK = posterior.reduce((s, p, i) => s + p * grid[i].k, 0) / totalP;
    const meanGamma =
      posterior.reduce((s, p, i) => s + p * grid[i].gamma, 0) / totalP;
    const meanLambda =
      posterior.reduce((s, p, i) => s + p * grid[i].lambda, 0) / totalP;

    const varMu =
      posterior.reduce((s, p, i) => s + p * (grid[i].mu - meanMu) ** 2, 0) /
      totalP;
    const varK =
      posterior.reduce((s, p, i) => s + p * (grid[i].k - meanK) ** 2, 0) /
      totalP;
    const varGamma =
      posterior.reduce(
        (s, p, i) => s + p * (grid[i].gamma - meanGamma) ** 2,
        0,
      ) / totalP;
    const varLambda =
      posterior.reduce(
        (s, p, i) => s + p * (grid[i].lambda - meanLambda) ** 2,
        0,
      ) / totalP;

    estimates.mu.push(meanMu);
    estimates.k.push(meanK);
    estimates.gamma.push(meanGamma);
    estimates.lambda.push(meanLambda);

    posteriorSDs.mu.push(Math.sqrt(varMu));
    posteriorSDs.k.push(Math.sqrt(varK));
    posteriorSDs.gamma.push(Math.sqrt(varGamma));
    posteriorSDs.lambda.push(Math.sqrt(varLambda));

    const runSummary = `Run ${run + 1} summary: mu=${meanMu.toFixed(2)} (sd=${Math.sqrt(varMu).toFixed(2)}), k=${meanK.toFixed(5)} (sd=${Math.sqrt(varK).toFixed(5)}), gamma=${meanGamma.toFixed(4)} (sd=${Math.sqrt(varGamma).toFixed(4)}), lambda=${meanLambda.toFixed(4)} (sd=${Math.sqrt(varLambda).toFixed(4)})`;
    // eslint-disable-next-line no-console
    console.log(runSummary);
    runLog.push(runSummary);

    masterLog.push(...runLog);
    // append sampled delays for this run to global list
    masterSampledDelays.push(...sampledThisRun);
  }

  // aggregate across runs
  const agg = (arr: number[]): { mean: number; sd: number } => {
    const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
    const varr = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
    return { mean, sd: Math.sqrt(varr) };
  };

  const muAgg = agg(estimates.mu);
  const kAgg = agg(estimates.k);
  const gammaAgg = agg(estimates.gamma);
  const lambdaAgg = agg(estimates.lambda);

  const summaryLines = [
    '===== Across-run summary =====',
    `True params: ${JSON.stringify(TRUE_PARAMS)}`,
    `Estimated mu across runs: mean=${muAgg.mean.toFixed(2)}, sd=${muAgg.sd.toFixed(2)}`,
    `Estimated k across runs: mean=${kAgg.mean.toFixed(5)}, sd=${kAgg.sd.toFixed(5)}`,
    `Estimated gamma across runs: mean=${gammaAgg.mean.toFixed(4)}, sd=${gammaAgg.sd.toFixed(4)}`,
    `Estimated lambda across runs: mean=${lambdaAgg.mean.toFixed(4)}, sd=${lambdaAgg.sd.toFixed(4)}`,
    '--- Average posterior SD (per-run) ---',
    `mu posterior sd (avg) = ${(posteriorSDs.mu.reduce((s, v) => s + v, 0) / posteriorSDs.mu.length).toFixed(2)}`,
    `k posterior sd (avg) = ${(posteriorSDs.k.reduce((s, v) => s + v, 0) / posteriorSDs.k.length).toFixed(5)}`,
    `gamma posterior sd (avg) = ${(posteriorSDs.gamma.reduce((s, v) => s + v, 0) / posteriorSDs.gamma.length).toFixed(4)}`,
    `lambda posterior sd (avg) = ${(posteriorSDs.lambda.reduce((s, v) => s + v, 0) / posteriorSDs.lambda.length).toFixed(4)}`,
  ];

  // compute bucketed counts (100 ms buckets)
  const maxDelay = Math.max(...masterSampledDelays, 2000);
  const bucketSize = 100;
  const numBuckets = Math.ceil((maxDelay + 1) / bucketSize);
  const buckets: number[] = Array.from({ length: numBuckets }, () => 0);
  masterSampledDelays.forEach((d) => {
    const idx = Math.floor(d / bucketSize);
    // eslint-disable-next-line no-param-reassign
    buckets[idx] = (buckets[idx] ?? 0) + 1;
  });

  summaryLines.push('--- Delay sampling distribution (100ms buckets) ---');
  for (let i = 0; i < buckets.length; i += 1) {
    const start = i * bucketSize;
    const end = start + bucketSize - 1;
    summaryLines.push(`${start}-${end} ms: ${buckets[i]} samples`);
  }

  // eslint-disable-next-line no-console
  console.log(`\n${summaryLines.join('\n')}`);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logsDir = 'logs';
  try {
    fs.mkdirSync(logsDir, { recursive: true });
  } catch (e) {
    // ignore
  }

  const runPath = `${logsDir}/simulation_run_${timestamp}.txt`;
  const summaryPath = `${logsDir}/simulation_runs_summary_${timestamp}.txt`;
  fs.writeFileSync(runPath, masterLog.join('\n'));
  fs.writeFileSync(summaryPath, `${summaryLines.join('\n')}\n`);
  // eslint-disable-next-line no-console
  console.log(`\nSaved logs → ${runPath} and ${summaryPath}`);
}

/**
 * Run directly from command line
 * Usage: npx tsx src/ado/simulateADO.ts
 */
if (process.argv[1].includes('simulateADO.ts')) {
  runSimulation();
}
