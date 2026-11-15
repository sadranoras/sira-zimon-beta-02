import React, { useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';
import { toPersianDigits } from '../utils/formatters';
import { analyzeKonkurResult } from '../utils/konkurAnalytics';

export const KonkurAnalyzerCard: React.FC = () => {
  const [totalQuestions, setTotalQuestions] = useState(45);
  const [correctCount, setCorrectCount] = useState(32);
  const [wrongCount, setWrongCount] = useState(5);
  const [cohortMean, setCohortMean] = useState(31.2);
  const [cohortStdDev, setCohortStdDev] = useState(17.5);
  const [totalParticipants, setTotalParticipants] = useState(18400);

  const result = useMemo(
    () =>
      analyzeKonkurResult({
        totalQuestions,
        correctCount,
        wrongCount,
        cohortMean,
        cohortStdDev,
        totalParticipants,
      }),
    [totalQuestions, correctCount, wrongCount, cohortMean, cohortStdDev, totalParticipants]
  );

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              ماژول تحلیلگر استاندارد کنکور (تراز و رتبه بر اساس میانگین و انحراف معیار)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            محاسبه نمره تراز با فرمول استاندارد سازمان سنجش (T = 1000 × Z + 5000) و تخمین رتبه با توزیع نرمال تجمعی بر پایه میانگین (μ) و انحراف معیار (σ) کل شرکت‌کنندگان
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Inputs */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">تعداد کل سوالات درس</label>
            <input
              type="number"
              min={1}
              max={200}
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(Math.max(1, Number(e.target.value)))}
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg tabular-nums focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">تعداد پاسخ صحیح</label>
            <input
              type="number"
              min={0}
              max={totalQuestions}
              value={correctCount}
              onChange={(e) =>
                setCorrectCount(Math.max(0, Math.min(totalQuestions, Number(e.target.value))))
              }
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg tabular-nums focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">تعداد پاسخ غلط</label>
            <input
              type="number"
              min={0}
              max={Math.max(0, totalQuestions - correctCount)}
              value={wrongCount}
              onChange={(e) =>
                setWrongCount(
                  Math.max(0, Math.min(totalQuestions - correctCount, Number(e.target.value)))
                )
              }
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg tabular-nums focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              جامعه آماری کل شرکت‌کنندگان (نفر)
            </label>
            <input
              type="number"
              min={10}
              max={500000}
              value={totalParticipants}
              onChange={(e) => setTotalParticipants(Math.max(10, Number(e.target.value)))}
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg tabular-nums focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              میانگین درصد شرکت‌کنندگان (μ٪)
            </label>
            <input
              type="number"
              step={0.1}
              min={-33}
              max={99}
              value={cohortMean}
              onChange={(e) => setCohortMean(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg tabular-nums focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              انحراف معیار شرکت‌کنندگان (σ٪)
            </label>
            <input
              type="number"
              step={0.1}
              min={1}
              max={60}
              value={cohortStdDev}
              onChange={(e) => setCohortStdDev(Math.max(1, Number(e.target.value)))}
              className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg tabular-nums focus:outline-none focus:border-emerald-600"
            />
          </div>
        </div>

        {/* Computed Output */}
        <div className="lg:col-span-5 bg-slate-900 dark:bg-slate-950 dark:border dark:border-slate-800 text-white rounded-xl p-5 space-y-4">
          <div className="flex items-baseline justify-between border-b border-slate-800 pb-3">
            <span className="text-xs text-slate-400">تراز استاندارد محاسبه‌شده</span>
            <span className="text-3xl font-extrabold text-emerald-400 tabular-nums">
              {toPersianDigits(result.taraz)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-800/80 dark:bg-slate-900 rounded-lg space-y-1">
              <span className="text-slate-400 block">درصد (با نمره منفی)</span>
              <span className="text-base font-bold text-white tabular-nums">
                {toPersianDigits(result.percentage)}٪
              </span>
            </div>
            <div className="p-3 bg-slate-800/80 dark:bg-slate-900 rounded-lg space-y-1">
              <span className="text-slate-400 block">رتبه تخمینی در جامعه</span>
              <span className="text-base font-bold text-white tabular-nums">
                {toPersianDigits(result.estimatedRank)}
              </span>
            </div>
            <div className="p-3 bg-slate-800/80 dark:bg-slate-900 rounded-lg space-y-1">
              <span className="text-slate-400 block">نمره استاندارد (Z-Score)</span>
              <span className="text-base font-bold font-mono-tabular text-emerald-300">
                {result.zScore >= 0 ? `+${toPersianDigits(result.zScore)}` : toPersianDigits(result.zScore)}
              </span>
            </div>
            <div className="p-3 bg-slate-800/80 dark:bg-slate-900 rounded-lg space-y-1">
              <span className="text-slate-400 block">صدک برتر نسبت به جامعه</span>
              <span className="text-base font-bold text-white tabular-nums">
                {toPersianDigits(result.percentile)}٪
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 pt-1 leading-relaxed">
            وضعیت آماری: <span className="font-semibold text-white">{result.performanceBand}</span>
          </p>
        </div>
      </div>
    </section>
  );
};
