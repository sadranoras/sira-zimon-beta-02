import type { ExamAttempt, ExamDifficulty } from '../types';

export interface CohortBenchmark {
  meanPercentage: number;
  stdDevPercentage: number;
  totalParticipants: number;
}

export interface KonkurAnalysisInput {
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  cohortMean: number;
  cohortStdDev: number;
  totalParticipants: number;
}

export interface KonkurAnalysisResult {
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  percentage: number;
  zScore: number;
  taraz: number;
  percentile: number;
  estimatedRank: number;
  performanceBand: string;
}

export interface TarazProgressPoint {
  index: number;
  label: string;
  examTitle: string;
  taraz: number;
  percentage: number;
  estimatedRank: number;
  cohortMeanTaraz: number;
}

export interface CohortDistributionStats {
  count: number;
  meanPercentage: number;
  stdDevPercentage: number;
  meanTaraz: number;
  highestTaraz: number;
  lowestTaraz: number;
}

const DEFAULT_BENCHMARKS: Record<ExamDifficulty, CohortBenchmark> = {
  'استاندارد': { meanPercentage: 38.5, stdDevPercentage: 18.0, totalParticipants: 18400 },
  'سطح کنکور': { meanPercentage: 31.2, stdDevPercentage: 17.5, totalParticipants: 18400 },
  'چالشی': { meanPercentage: 24.8, stdDevPercentage: 16.2, totalParticipants: 18400 },
};

export function getBenchmarkForDifficulty(difficulty?: ExamDifficulty): CohortBenchmark {
  if (!difficulty) return DEFAULT_BENCHMARKS['سطح کنکور'];
  return DEFAULT_BENCHMARKS[difficulty] ?? DEFAULT_BENCHMARKS['سطح کنکور'];
}

/**
 * Standard Konkur negative-marking percentage:
 * P = ((3 * Correct - Wrong) / (3 * Total)) * 100
 */
export function calculateKonkurPercentage(
  totalQuestions: number,
  correctCount: number,
  wrongCount: number
): number {
  const safeTotal = Math.max(1, totalQuestions);
  const raw = ((3 * correctCount - wrongCount) / (3 * safeTotal)) * 100;
  return Math.round(raw * 10) / 10;
}

/**
 * Standard Normal Cumulative Distribution Function Phi(z)
 * using Abramowitz & Stegun 7.1.26 rational approximation (max error ~1.5e-7).
 */
export function normalCdf(z: number): number {
  const sign = z < 0 ? -1 : 1;
  const absZ = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * absZ);
  const erf =
    1 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t) *
      Math.exp(-absZ * absZ);
  return 0.5 * (1 + sign * erf);
}

/**
 * Computes Konkur Taraz (T = 1000 * Z + 5000), Z-score, percentile, and estimated rank
 * from raw counts and cohort mean / standard deviation.
 */
export function analyzeKonkurResult(input: KonkurAnalysisInput): KonkurAnalysisResult {
  const safeTotal = Math.max(1, input.totalQuestions);
  const safeCorrect = Math.max(0, Math.min(safeTotal, input.correctCount));
  const safeWrong = Math.max(0, Math.min(safeTotal - safeCorrect, input.wrongCount));
  const blankCount = Math.max(0, safeTotal - safeCorrect - safeWrong);

  const percentage = calculateKonkurPercentage(safeTotal, safeCorrect, safeWrong);
  const safeStdDev = Math.max(1, input.cohortStdDev);
  const zScoreRaw = (percentage - input.cohortMean) / safeStdDev;
  const zScore = Math.round(zScoreRaw * 100) / 100;

  // Sanjesh / Konkur standard linear transformation: mean = 5000, sd = 1000
  const rawTaraz = 1000 * zScoreRaw + 5000;
  const taraz = Math.round(Math.max(1000, Math.min(12000, rawTaraz)));

  const cdf = normalCdf(zScoreRaw);
  const percentile = Math.round(cdf * 1000) / 10;
  const cohortN = Math.max(1, Math.round(input.totalParticipants));
  const estimatedRank = Math.max(1, Math.min(cohortN, Math.round((1 - cdf) * cohortN) || 1));

  let performanceBand = 'نیازمند تثبیت و مرور مفاهیم پایه';
  if (taraz >= 7000) {
    performanceBand = 'تراز ممتاز (محدوده رتبه‌های برتر کشوری)';
  } else if (taraz >= 6000) {
    performanceBand = 'عملکرد بسیار مطلوب (بالاتر از میانگین تراز قبولی)';
  } else if (taraz >= 5000) {
    performanceBand = 'میانگین رو به بالا (نزدیک به تراز ۵۰۰۰ جامعه)';
  }

  return {
    totalQuestions: safeTotal,
    correctCount: safeCorrect,
    wrongCount: safeWrong,
    blankCount,
    percentage,
    zScore,
    taraz,
    percentile,
    estimatedRank,
    performanceBand,
  };
}

/**
 * Computes population mean and standard deviation from an array of exam attempts.
 */
export function analyzeCohortDistribution(attempts: ExamAttempt[]): CohortDistributionStats {
  if (attempts.length === 0) {
    return {
      count: 0,
      meanPercentage: 0,
      stdDevPercentage: 0,
      meanTaraz: 0,
      highestTaraz: 0,
      lowestTaraz: 0,
    };
  }

  const n = attempts.length;
  const meanPercentage =
    Math.round((attempts.reduce((acc, a) => acc + a.percentage, 0) / n) * 10) / 10;
  const variance =
    attempts.reduce((acc, a) => acc + Math.pow(a.percentage - meanPercentage, 2), 0) / n;
  const stdDevPercentage = Math.round(Math.sqrt(variance) * 10) / 10;

  const meanTaraz = Math.round(attempts.reduce((acc, a) => acc + a.taraz, 0) / n);
  const highestTaraz = Math.max(...attempts.map((a) => a.taraz));
  const lowestTaraz = Math.min(...attempts.map((a) => a.taraz));

  return {
    count: n,
    meanPercentage,
    stdDevPercentage,
    meanTaraz,
    highestTaraz,
    lowestTaraz,
  };
}

/**
 * Builds chronological Taraz progression series for Recharts.
 */
export function buildTarazProgressSeries(attempts: ExamAttempt[]): TarazProgressPoint[] {
  const ordered = [...attempts].sort((a, b) => {
    const tA = a.submittedAtIso || '';
    const tB = b.submittedAtIso || '';
    return tA.localeCompare(tB);
  });

  return ordered.map((att, idx) => {
    const shortTitle =
      att.examTitle.length > 24 ? `${att.examTitle.slice(0, 24)}…` : att.examTitle;
    return {
      index: idx + 1,
      label: `آزمون ${idx + 1}`,
      examTitle: shortTitle,
      taraz: att.taraz,
      percentage: att.percentage,
      estimatedRank: att.estimatedRank,
      cohortMeanTaraz: 5000,
    };
  });
}
