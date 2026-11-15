import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Compass, MinusCircle, Printer, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ExamQuestion } from '../types';
import { formatSecondsToClock, toPersianDigits } from '../utils/formatters';

export const ReportCardView: React.FC = () => {
  const { selectedAttempt, setView, openStudentPanelTab, fetchExamQuestions } = useApp();
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedAttempt) return;
    let mounted = true;
    setLoading(true);
    fetchExamQuestions(selectedAttempt.examId).then((list) => {
      if (!mounted) return;
      setQuestions(list);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [selectedAttempt, fetchExamQuestions]);

  if (!selectedAttempt) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-lg font-bold text-slate-900 dark:text-white">
          کارنامه‌ای برای نمایش انتخاب نشده است
        </p>
        <button
          type="button"
          onClick={() => setView('exams')}
          className="px-5 py-2.5 bg-emerald-700 text-white rounded-lg text-sm font-semibold cursor-pointer"
        >
          مشاهده آزمون‌ها
        </button>
      </div>
    );
  }

  const cohortAvgTaraz = 5000;
  const top1PctTaraz = 8950;
  const maxBarTaraz = 11500;
  const zScore = Math.round(((selectedAttempt.taraz - 5000) / 1000) * 100) / 100;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <button
          type="button"
          onClick={() => setView('exams')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به آزمون‌ها</span>
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => openStudentPanelTab('major-sim')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-sm font-semibold text-white rounded-lg cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>شبیه‌سازی انتخاب رشته با این کارنامه</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400 text-sm font-semibold text-slate-800 dark:text-slate-100 rounded-lg cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ / دریافت PDF کارنامه</span>
          </button>
        </div>
      </div>

      {/* Report Card Summary Header */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              کارنامه تحلیلی آزمون آزمایشی زیست‌ماز
            </p>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {selectedAttempt.examTitle}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              داوطلب: {selectedAttempt.studentName} · زمان صرف‌شده:{' '}
              <span className="font-mono-tabular">
                {toPersianDigits(formatSecondsToClock(selectedAttempt.timeSpentSeconds))}
              </span>{' '}
              · نمره استاندارد Z:{' '}
              <span className="font-mono-tabular font-semibold text-slate-900 dark:text-white">
                {zScore >= 0 ? `+${toPersianDigits(zScore)}` : toPersianDigits(zScore)}
              </span>
            </p>
          </div>
          <div className="text-left">
            <p className="text-xs text-slate-500 dark:text-slate-400">تراز کل آزمون</p>
            <p className="text-4xl font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
              {toPersianDigits(selectedAttempt.taraz)}
            </p>
          </div>
        </div>

        {/* 4-Metric Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">درصد نهایی (با نمره منفی)</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {toPersianDigits(selectedAttempt.percentage)}٪
            </p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">رتبه تخمینی در جامعه آماری</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {toPersianDigits(selectedAttempt.estimatedRank)}
            </p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">پاسخ صحیح / غلط</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {toPersianDigits(selectedAttempt.correctCount)} /{' '}
              {toPersianDigits(selectedAttempt.wrongCount)}
            </p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">سوالات نزده</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {toPersianDigits(selectedAttempt.blankCount)} از{' '}
              {toPersianDigits(selectedAttempt.totalQuestions)}
            </p>
          </div>
        </div>

        {/* Cohort Comparison Bar */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            مقایسه تراز شما با جامعه آماری آزمون
          </h2>
          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold text-emerald-800 dark:text-emerald-400">تراز شما</span>
                <span className="font-bold tabular-nums text-emerald-800 dark:text-emerald-400">
                  {toPersianDigits(selectedAttempt.taraz)}
                </span>
              </div>
              <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full"
                  style={{ width: `${Math.min(100, (selectedAttempt.taraz / maxBarTaraz) * 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  میانگین تراز کل شرکت‌کنندگان (استاندارد ۵۰۰۰)
                </span>
                <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                  {toPersianDigits(cohortAvgTaraz)}
                </span>
              </div>
              <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-400 dark:bg-slate-500 rounded-full"
                  style={{ width: `${(cohortAvgTaraz / maxBarTaraz) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">
                  میانگین تراز رتبه‌های برتر (۱٪ اول)
                </span>
                <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                  {toPersianDigits(top1PctTaraz)}
                </span>
              </div>
              <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-800 dark:bg-slate-200 rounded-full"
                  style={{ width: `${(top1PctTaraz / maxBarTaraz) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Answer Key (پاسخ‌نامه تشریحی) */}
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
          پاسخ‌نامه تشریحی سوال‌به‌سوال
        </h2>

        {loading ? (
          <div className="h-40 bg-slate-100 dark:bg-slate-900 rounded-2xl animate-pulse" />
        ) : (
          <div className="space-y-5">
            {questions.map((q, idx) => {
              const userChoice = selectedAttempt.answersMap[q.id];
              const isCorrect = userChoice === q.correctOption;
              const isBlank = userChoice === undefined || userChoice === null;
              const opts = [q.option1, q.option2, q.option3, q.option4];

              return (
                <article
                  key={q.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                        سوال {toPersianDigits(idx + 1)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{q.subject}</span>
                      <span aria-hidden="true">·</span>
                      <span>{q.topic}</span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 text-xs font-bold">
                      {isBlank ? (
                        <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <MinusCircle className="w-4 h-4" />
                          <span>نزده</span>
                        </span>
                      ) : isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>پاسخ صحیح</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400">
                          <XCircle className="w-4 h-4" />
                          <span>پاسخ نادرست</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-base font-semibold text-slate-900 dark:text-white leading-relaxed">
                    {q.stem}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-sm">
                    {opts.map((opt, optIdx) => {
                      const isRightOption = optIdx === q.correctOption;
                      const isUserSelected = optIdx === userChoice;

                      let style =
                        'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300';
                      let label = '';
                      if (isRightOption) {
                        style =
                          'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 font-semibold';
                        label = isUserSelected ? ' (پاسخ صحیح شما)' : ' (گزینه صحیح)';
                      } else if (isUserSelected) {
                        style =
                          'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 font-semibold';
                        label = ' (انتخاب شما)';
                      }

                      return (
                        <div key={optIdx} className={`p-3 rounded-xl border ${style}`}>
                          <span className="tabular-nums font-bold ml-1.5">
                            {toPersianDigits(optIdx + 1)})
                          </span>
                          <span>{opt}</span>
                          {label && <span className="text-xs font-bold mr-1">{label}</span>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      تحلیل و پاسخ تشریحی:
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {q.explanation}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

