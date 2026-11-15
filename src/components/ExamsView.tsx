import React, { useMemo, useState } from 'react';
import { Award, Clock, FileCheck2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { GradeLevel } from '../types';
import { formatToman, toPersianDigits } from '../utils/formatters';

const GRADES: ('همه' | GradeLevel)[] = ['همه', 'دهم', 'یازدهم', 'دوازدهم', 'جامع کنکور'];

export const ExamsView: React.FC = () => {
  const { exams, examAttempts, startExamRunner, openReportCard, hasDiamondAccess } = useApp();
  const [gradeFilter, setGradeFilter] = useState<'همه' | GradeLevel>('همه');

  const filteredExams = useMemo(() => {
    return exams.filter((ex) => gradeFilter === 'همه' || ex.grade === gradeFilter);
  }, [exams, gradeFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            آزمون‌های آزمایشی آنلاین و برنامه راهبردی
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            شبیه‌ساز کامل آزمون الکترونیکی ماز با محاسبه تراز، رتبه و پاسخ‌نامه تشریحی آنی
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-x-auto">
          {GRADES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGradeFilter(g)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                gradeFilter === g
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Exams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredExams.map((exam) => {
          const latestAttempt = examAttempts.find((a) => a.examId === exam.id);
          return (
            <article
              key={exam.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-tabular font-semibold text-slate-700 dark:text-slate-300">
                      {exam.code}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{exam.grade}</span>
                    <span aria-hidden="true">·</span>
                    <span>{exam.difficulty}</span>
                  </div>
                  <span
                    className={`font-semibold ${
                      exam.isActive
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {exam.isActive ? 'در حال برگزاری' : 'بسته شده'}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {exam.title}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {exam.description}
                </p>

                <div className="grid grid-cols-3 gap-3 pt-2 text-xs border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 block">مدت پاسخ‌گویی</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {toPersianDigits(exam.durationMinutes)} دقیقه
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 block">تعداد سوالات</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                      {toPersianDigits(exam.totalQuestions)} سوال
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-slate-400 block">تاریخ اجرا</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {exam.scheduledDate}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {exam.price === 0 || (hasDiamondAccess && exam.isDiamondIncluded) ? (
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {hasDiamondAccess && exam.isDiamondIncluded && exam.price > 0
                        ? 'فعال با اشتراک الماس'
                        : 'آزمون رایگان'}
                    </span>
                  ) : (
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatToman(exam.price)} (رایگان برای الماس)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  {latestAttempt && (
                    <button
                      type="button"
                      onClick={() => openReportCard(latestAttempt)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 hover:border-emerald-600 text-xs font-semibold text-slate-800 dark:text-slate-100 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <FileCheck2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      <span>کارنامه ({toPersianDigits(latestAttempt.percentage)}٪)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={!exam.isActive}
                    onClick={() => startExamRunner(exam.id)}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {latestAttempt ? 'شرکت مجدد' : 'ورود به جلسه آزمون'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Recent Exam Attempts Summary */}
      {examAttempts.length > 0 && (
        <section className="space-y-4 pt-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              تاریخچه کارنامه‌های شما
            </h2>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <th className="py-3 px-5">عنوان آزمون</th>
                    <th className="py-3 px-4">صحیح / غلط / نزده</th>
                    <th className="py-3 px-4">درصد</th>
                    <th className="py-3 px-4">تراز</th>
                    <th className="py-3 px-4">رتبه تخمینی</th>
                    <th className="py-3 px-5 text-left">کارنامه</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {examAttempts.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                      <td className="py-3.5 px-5 font-semibold text-slate-900 dark:text-white">
                        {att.examTitle}
                      </td>
                      <td className="py-3.5 px-4 tabular-nums text-slate-700 dark:text-slate-300">
                        {toPersianDigits(att.correctCount)} / {toPersianDigits(att.wrongCount)} /{' '}
                        {toPersianDigits(att.blankCount)}
                      </td>
                      <td className="py-3.5 px-4 font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                        {toPersianDigits(att.percentage)}٪
                      </td>
                      <td className="py-3.5 px-4 font-bold tabular-nums text-slate-900 dark:text-white">
                        {toPersianDigits(att.taraz)}
                      </td>
                      <td className="py-3.5 px-4 tabular-nums text-slate-700 dark:text-slate-300">
                        {toPersianDigits(att.estimatedRank)}
                      </td>
                      <td className="py-3.5 px-5 text-left">
                        <button
                          type="button"
                          onClick={() => openReportCard(att)}
                          className="px-3.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-emerald-600 cursor-pointer"
                        >
                          مشاهده کارنامه
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

