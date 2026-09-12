#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const config = require('../lighthouserc.cjs');

const outputDirectory = path.resolve('artifacts', 'lighthouse');
const lighthouseCli = require.resolve('lighthouse/cli');
const url = process.env.LIGHTHOUSE_URL || config.url;

fs.mkdirSync(outputDirectory, { recursive: true });

const summaries = [];

for (let run = 1; run <= config.runs; run += 1) {
  const outputBase = path.join(outputDirectory, `production-booking-run-${run}`);
  const reportPath = `${outputBase}.report.json`;
  const htmlPath = `${outputBase}.report.html`;
  fs.rmSync(reportPath, { force: true });
  fs.rmSync(htmlPath, { force: true });
  const result = spawnSync(
    process.execPath,
    [
      lighthouseCli,
      url,
      '--preset=desktop',
      '--output=json',
      '--output=html',
      `--output-path=${outputBase}`,
      '--chrome-flags=--headless=new --no-sandbox',
      '--quiet',
    ],
    { stdio: 'inherit' },
  );

  if (result.error || (result.status !== 0 && !fs.existsSync(reportPath))) {
    throw new Error(`Lighthouse run ${run} failed with exit code ${result.status}.`);
  }

  if (result.status !== 0) {
    console.warn(
      `Lighthouse run ${run} produced a complete report but could not clean up Chrome locally.`,
    );
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const scores = Object.fromEntries(
    Object.keys(config.thresholds).map((category) => [category, report.categories[category].score]),
  );
  summaries.push({ run, url: report.finalUrl, scores });
}

const failures = [];
for (const summary of summaries) {
  for (const [category, minimum] of Object.entries(config.thresholds)) {
    const actual = summary.scores[category];
    if (typeof actual !== 'number' || actual < minimum) {
      failures.push(
        `run ${summary.run} ${category}: ${actual ?? 'unavailable'} (minimum ${minimum})`,
      );
    }
  }
}

console.table(
  summaries.map(({ run, scores }) => ({
    run,
    performance: scores.performance,
    accessibility: scores.accessibility,
    bestPractices: scores['best-practices'],
    seo: scores.seo,
  })),
);

if (failures.length > 0) {
  throw new Error(`Lighthouse quality gate failed:\n${failures.join('\n')}`);
}

console.log(`Lighthouse quality gate passed for ${url}.`);
