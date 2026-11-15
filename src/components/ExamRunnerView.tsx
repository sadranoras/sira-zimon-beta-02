import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, Clock, Flag, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ExamQuestion } from '../types';
import { formatSecondsToClock, toPersianDigits } from '../utils/formatters';

export const ExamRunnerView: React.FC = () => {
  const { exams, selectedExamId, setView, fetchExamQuestions, submitExamAttempt } = useApp();
  const exam = exams.find((e) => e.id === selectedExamId) ?? exams[0];

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState(20 * 60);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const deadlineMsRef = useRef<number>(0);
  const hasSubmittedRef = useRef<boolean>(false);
  const answersRef = useRef<Record<string, number>>({});

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    if (!exam) return;
    let mounted = true;
    hasSubmittedRef.current = false;
    setLoading(true);
    const totalSecs = Math.max(60, exam.durationMinutes * 60);
    setSecondsLeft(totalSecs);
    fetchExamQuestions(exam.id).then((list) => {
      if (!mounted) return;
      setQuestions(list);
      setCurrentIndex(0);
      setAnswers({});
      answersRef.current = {};
      setFlagged({});
      deadlineMsRef.current = Date.now() + totalSecs * 1000;
      setSecondsLeft(totalSecs);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [exam, fetchExamQuestions]);

  // Drift-proof live countdown timer synced against deadline timestamp
  useEffect(() => {
    if (loading || submitting || questions.length === 0 || !exam) return;
    if (!deadlineMsRef.current) {
      deadlineMsRef.current = Date.now() + secondsLeft * 1000;
    }

    const syncRemaining = () => {
      const remaining = Math.max(0, Math.ceil((deadlineMsRef.current - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };

    syncRemaining();
    const timer = window.setInterval(syncRemaining, 500);
    return () => window.clearInterval(timer);
  }, [loading, submitting, questions.length, exam]);

  // Auto-submit exam when timer reaches zero and redirect to report card
  useEffect(() => {
    if (
      !exam ||
      loading ||
      questions.length === 0 ||
      secondsLeft > 0 ||
      hasSubmittedRef.current
    ) {
      return;
    }

    hasSubmittedRef.current = true;
    setConfirmFinish(false);
    setSubmitting(true);
    const totalSecs = Math.max(60, exam.durationMinutes * 60);

    void submitExamAttempt(exam, questions, answersRef.current, totalSecs, {
      isAutoTimeout: true,
    })
      .catch(() => {
        hasSubmittedRef.current = false;
      })
      .finally(() => {
        setSubmitting(false);
      });
  }, [secondsLeft, exam, loading, questions, submitExamAttempt]);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  if (!exam) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-lg font-bold text-slate-900 dark:text-white">آزمون مورد نظر یافت نشد</p>
        <button
          type="button"
          onClick={() => setView('exams')}
          className="px-5 py-2.5 bg-emerald-700 text-white rounded-lg text-sm font-semibold cursor-pointer"
        >
          بازگشت به لیست آزمون‌ها
        </button>
      </div>
    );
  }

  const totalSecondsAllocated = Math.max(60, exam.durationMinutes * 60);
  const timeSpent = Math.max(0, totalSecondsAllocated - secondsLeft);
  const remainingRatio = Math.max(0, Math.min(100, (secondsLeft / totalSecondsAllocated) * 100));
  const isCriticalTime = secondsLeft > 0 && secondsLeft <= 120;
  const isWarningTime = secondsLeft > 120 && remainingRatio <= 25;

  const handleFinish = async () => {
    if (hasSubmittedRef.current || submitting || questions.length === 0) return;
    hasSubmittedRef.current = true;
    setSubmitting(true);
    try {
      await submitExamAttempt(exam, questions, answersRef.current, timeSpent);
    } catch {
      hasSubmittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 space-y-4">
        <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-72 bg-slate-100 dark:bg-slate-900 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl mt-8">
        <p className="text-lg font-bold text-slate-900 dark:text-white">
          هنوز سوالی برای این آزمون ثبت نشده است
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          مدیر سایت می‌تواند از طریق پنل مدیریت، سوالات چهارگزینه‌ای و پاسخ تشریحی را به این آزمون اضافه کند.
        </p>
        <button
          type="button"
          onClick={() => setView('exams')}
          className="px-5 py-2.5 bg-emerald-700 text-white rounded-lg text-sm font-semibold cursor-pointer"
        >
          بازگشت به آزمون‌ها
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const options = [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4];
  const selectedOpt = answers[currentQ.id];

  const selectOption = (optIndex: number) => {
    if (submitting || secondsLeft === 0) return;
    setAnswers((prev) => {
      if (prev[currentQ.id] === optIndex) {
        const copy = { ...prev };
        delete copy[currentQ.id];
        return copy;
      }
      return { ...prev, [currentQ.id]: optIndex };
    });
  };

  const clearCurrentAnswer = () => {
    if (submitting || secondsLeft === 0) return;
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQ.id];
      return copy;
    });
  };

  const toggleFlag = () => {
    setFlagged((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Exam Header Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setView('exams')}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer shrink-0"
              aria-label="خروج از آزمون"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                {exam.title}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                پاسخ‌داده‌شده: {toPersianDigits(answeredCount)} از {toPersianDigits(questions.length)}{' '}
                سوال
                {isCriticalTime && (
                  <>
                    <span className="mx-1.5" aria-hidden="true">·</span>
                    <span className="text-rose-700 dark:text-rose-400 font-semibold">
                      هشدار: کمتر از ۲ دقیقه تا ثبت خودکار
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div
              role="timer"
              aria-live="polite"
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-mono-tabular font-semibold ${
                secondsLeft === 0 || isCriticalTime
                  ? 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                  : isWarningTime
                    ? 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100'
              }`}
            >
              {isCriticalTime || secondsLeft === 0 ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 shrink-0" />
              )}
              <span className="text-xs font-sans font-medium opacity-80">زمان باقی‌مانده:</span>
              <span dir="ltr">{toPersianDigits(formatSecondsToClock(secondsLeft))}</span>
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={() => setConfirmFinish(true)}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold rounded-lg cursor-pointer whitespace-nowrap shrink-0"
            >
              {submitting ? 'در حال ثبت...' : 'ثبت نهایی پاسخ‌برگ'}
            </button>
          </div>
        </div>

        {/* Live Remaining Time Progress Bar */}
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full transition-all duration-500 ${
              isCriticalTime || secondsLeft === 0
                ? 'bg-rose-600 dark:bg-rose-500'
                : isWarningTime
                  ? 'bg-amber-500'
                  : 'bg-emerald-600 dark:bg-emerald-500'
            }`}
            style={{ width: `${remainingRatio}%` }}
          />
        </div>
      </div>

      {/* Auto-submit status banner at timeout */}
      {submitting && secondsLeft === 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 rounded-2xl p-4 flex items-center gap-3 text-sm font-semibold">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>زمان آزمون به پایان رسید. در حال ثبت خودکار پاسخ‌برگ و انتقال به صفحه کارنامه...</span>
        </div>
      )}

      {/* Inline Finish Confirmation */}
      {confirmFinish && !submitting && (
        <div className="bg-slate-900 dark:bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-bold">آیا از پایان آزمون و صدور کارنامه مطمئن هستید؟</p>
            <p className="text-xs text-slate-300 tabular-nums">
              شما به {toPersianDigits(answeredCount)} سوال از {toPersianDigits(questions.length)}{' '}
              سوال پاسخ داده‌اید ({toPersianDigits(questions.length - answeredCount)} سوال نزده).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setConfirmFinish(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-200 border border-slate-700 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              ادامه آزمون
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleFinish}
              className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer"
            >
              {submitting ? 'در حال تصحیح...' : 'تأیید و دریافت کارنامه'}
            </button>
          </div>
        </div>
      )}

      {/* Main Exam Split: Question Stage + OMR Answer Sheet Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Question Card */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-bold text-slate-900 dark:text-white text-sm tabular-nums">
                سوال {toPersianDigits(currentIndex + 1)}
              </span>
              <span aria-hidden="true">·</span>
              <span>{currentQ.subject}</span>
              <span aria-hidden="true">·</span>
              <span>{currentQ.topic}</span>
              <span aria-hidden="true">·</span>
              <span>سطح {currentQ.difficulty}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleFlag}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                  flagged[currentQ.id]
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{flagged[currentQ.id] ? 'نشان‌دار شد' : 'نشان‌دار کردن'}</span>
              </button>

              {selectedOpt !== undefined && (
                <button
                  type="button"
                  onClick={clearCurrentAnswer}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-700 hover:border-rose-300 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>پاک کردن</span>
                </button>
              )}
            </div>
          </div>

          <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-loose">
            {currentQ.stem}
          </p>

          <div className="space-y-3">
            {options.map((optText, idx) => {
              const isSelected = selectedOpt === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectOption(idx)}
                  className={`w-full text-right p-4 rounded-xl border transition-colors flex items-start gap-3.5 cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/50 text-slate-900 dark:text-white'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold tabular-nums shrink-0 ${
                      isSelected
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {toPersianDigits(idx + 1)}
                  </span>
                  <span className="text-sm sm:text-base leading-relaxed pt-0.5">{optText}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer"
            >
              سوال قبلی
            </button>
            <button
              type="button"
              disabled={currentIndex === questions.length - 1}
              onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
              className="px-5 py-2 bg-slate-900 dark:bg-emerald-700 hover:bg-slate-800 dark:hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold disabled:opacity-40 cursor-pointer"
            >
              سوال بعدی
            </button>
          </div>
        </div>

        {/* OMR Quick Answer Sheet Sidebar */}
        <aside className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">پاسخ‌برگ الکترونیکی</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              روی شماره هر سوال کلیک کنید تا مستقیم به آن سوال منتقل شوید.
            </p>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined;
              const isFlagged = Boolean(flagged[q.id]);
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-10 rounded-lg text-xs font-bold tabular-nums border transition-colors cursor-pointer ${
                    isCurrent
                      ? 'ring-2 ring-slate-900 dark:ring-emerald-400 ring-offset-1 dark:ring-offset-slate-900'
                      : ''
                  } ${
                    isFlagged
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-300'
                      : isAnswered
                        ? 'bg-emerald-700 border-emerald-700 text-white'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  {toPersianDigits(idx + 1)}
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center justify-between">
              <span>پاسخ داده‌شده</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                {toPersianDigits(answeredCount)} سوال
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>نشان‌دار (شک‌دار)</span>
              <span className="font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                {toPersianDigits(Object.values(flagged).filter(Boolean).length)} سوال
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>باقی‌مانده (نزده)</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                {toPersianDigits(questions.length - answeredCount)} سوال
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

