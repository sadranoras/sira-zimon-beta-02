import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BellOff,
  BellRing,
  CalendarClock,
  Check,
  CheckCheck,
  Clock,
  Play,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { toPersianDigits } from '../utils/formatters';

function formatCountdownFa(scheduledStartIso: string, nowMs: number): {
  label: string;
  isImminent: boolean;
  isPast: boolean;
} {
  if (!scheduledStartIso) {
    return { label: 'طبق برنامه راهبردی', isImminent: false, isPast: false };
  }
  const targetMs = Date.parse(scheduledStartIso);
  if (Number.isNaN(targetMs)) {
    return { label: 'زمان‌بندی ثبت‌شده', isImminent: false, isPast: false };
  }
  const diffMs = targetMs - nowMs;
  if (diffMs <= 0) {
    const hoursPassed = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
    if (hoursPassed < 12) {
      return { label: 'آزمون آغاز شده — آماده شرکت', isImminent: true, isPast: false };
    }
    return { label: 'زمان شروع گذشته است', isImminent: false, isPast: true };
  }

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return {
      label: `${toPersianDigits(days)} روز و ${toPersianDigits(hours)} ساعت مانده تا شروع`,
      isImminent: false,
      isPast: false,
    };
  }
  if (hours > 0) {
    return {
      label: `${toPersianDigits(hours)} ساعت و ${toPersianDigits(minutes)} دقیقه مانده تا شروع`,
      isImminent: hours <= 3,
      isPast: false,
    };
  }
  return {
    label: `${toPersianDigits(Math.max(1, minutes))} دقیقه مانده تا شروع`,
    isImminent: true,
    isPast: false,
  };
}

export const StudentNotificationsView: React.FC = () => {
  const {
    exams,
    examNotifications,
    notificationState,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    toggleExamReminder,
    updateNotificationPreferences,
    startExamRunner,
    setView,
    notify,
  } = useApp();

  const [filter, setFilter] = useState<'all' | 'unread' | 'subscribed'>('all');
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const activeNotifications = useMemo(() => {
    return examNotifications.filter((n) => n.isActive);
  }, [examNotifications]);

  const readSet = useMemo(
    () => new Set(notificationState.readNotificationIds),
    [notificationState.readNotificationIds]
  );

  const subscribedSet = useMemo(
    () => new Set(notificationState.subscribedExamIds),
    [notificationState.subscribedExamIds]
  );

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return activeNotifications.filter((n) => !readSet.has(n.id));
    }
    if (filter === 'subscribed') {
      return activeNotifications.filter((n) => subscribedSet.has(n.examId));
    }
    return activeNotifications;
  }, [activeNotifications, filter, readSet, subscribedSet]);

  const handleToggleBrowserAlerts = async () => {
    const nextValue = !notificationState.browserAlertsEnabled;
    if (nextValue && typeof window !== 'undefined' && 'Notification' in window) {
      if (window.Notification.permission === 'default') {
        const perm = await window.Notification.requestPermission();
        if (perm !== 'granted') {
          notify('مجوز نمایش اعلان مرورگر صادر نشد؛ یادآورهای درون‌برنامه‌ای همچنان فعال هستند.', 'info');
          return;
        }
      } else if (window.Notification.permission === 'denied') {
        notify('اعلان مرورگر در تنظیمات مرورگر شما مسدود شده است.', 'error');
        return;
      }
    }
    setSavingPrefs(true);
    try {
      await updateNotificationPreferences(notificationState.remindMinutesBefore, nextValue);
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleLeadTimeChange = async (minutes: 15 | 30 | 60 | 1440) => {
    setSavingPrefs(true);
    try {
      await updateNotificationPreferences(minutes, notificationState.browserAlertsEnabled);
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Preferences */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BellRing className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                مرکز اعلان‌ها و زمان‌بندی شروع آزمون‌های برنامه‌ریزی‌شده
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              زمان دقیق شروع آزمون‌های آزمایشی، اطلاعیه‌های تغییر ساعت و یادآورهای پیش از شروع آزمون به صورت لحظه‌ای در این بخش نمایش داده می‌شوند.
            </p>
          </div>

          {unreadNotificationsCount > 0 && (
            <button
              type="button"
              onClick={() =>
                void markAllNotificationsRead(activeNotifications.map((n) => n.id))
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 hover:border-emerald-600 dark:hover:border-emerald-500 text-xs font-semibold text-slate-800 dark:text-slate-100 rounded-lg cursor-pointer shrink-0"
            >
              <CheckCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>خواندن همه ({toPersianDigits(unreadNotificationsCount)})</span>
            </button>
          )}
        </div>

        {/* User Notification Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-900 dark:text-white">زمان یادآور پیش از شروع آزمون</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                هشدار خودکار برای آزمون‌های انتخاب‌شده شما
              </p>
            </div>
            <select
              disabled={savingPrefs}
              value={notificationState.remindMinutesBefore}
              onChange={(e) =>
                void handleLeadTimeChange(Number(e.target.value) as 15 | 30 | 60 | 1440)
              }
              className="px-3 py-1.5 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
            >
              <option value={15}>۱۵ دقیقه قبل</option>
              <option value={30}>۳۰ دقیقه قبل</option>
              <option value={60}>۱ ساعت قبل</option>
              <option value={1440}>۲۴ ساعت قبل</option>
            </select>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-900 dark:text-white">اعلان دسکتاپ / مرورگر</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                نمایش پیام یادآور هنگام نزدیک شدن زمان آزمون
              </p>
            </div>
            <button
              type="button"
              disabled={savingPrefs}
              onClick={() => void handleToggleBrowserAlerts()}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border cursor-pointer shrink-0 ${
                notificationState.browserAlertsEnabled
                  ? 'bg-emerald-700 dark:bg-emerald-600 text-white border-emerald-700 dark:border-emerald-600'
                  : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-slate-500'
              }`}
            >
              {notificationState.browserAlertsEnabled ? 'فعال است' : 'فعال‌سازی اعلان'}
            </button>
          </div>
        </div>
      </section>

      {/* Active Exam Notifications Feed */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            اطلاعیه‌ها و زمان شروع آزمون‌ها ({toPersianDigits(filteredNotifications.length)})
          </h3>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {(
              [
                { id: 'all', label: `همه (${toPersianDigits(activeNotifications.length)})` },
                { id: 'unread', label: `خوانده‌نشده (${toPersianDigits(unreadNotificationsCount)})` },
                { id: 'subscribed', label: 'یادآورهای فعال من' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold border cursor-pointer ${
                  filter === f.id
                    ? 'bg-slate-900 dark:bg-emerald-600 text-white border-slate-900 dark:border-emerald-600'
                    : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              اعلانی در این فیلتر وجود ندارد
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              تمام اعلان‌های جدید آزمون‌های برنامه‌ریزی‌شده بلافاصله در این لیست نمایش داده می‌شوند.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredNotifications.map((notif) => {
              const isRead = readSet.has(notif.id);
              const isSubscribed = subscribedSet.has(notif.examId);
              const countdown = formatCountdownFa(notif.scheduledStartIso, nowMs);
              const matchedExam = exams.find((e) => e.id === notif.examId);

              const priorityColor =
                notif.priority === 'فوری' || notif.priority === 'تغییر زمان'
                  ? 'text-rose-700 dark:text-rose-400'
                  : notif.priority === 'شروع آزمون'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-amber-700 dark:text-amber-400';

              return (
                <article
                  key={notif.id}
                  className={`p-5 space-y-3 transition-colors ${
                    isRead
                      ? 'bg-white dark:bg-slate-900'
                      : 'bg-emerald-50/35 dark:bg-emerald-950/20'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className={`font-bold ${priorityColor}`}>{notif.priority}</span>
                        <span aria-hidden="true">·</span>
                        <span>مخاطب: {notif.targetGrade}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {notif.scheduledStartLabel}
                        </span>
                        {!isRead && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">اعلان جدید</span>
                          </>
                        )}
                      </div>
                      <h4 className="text-base font-extrabold text-slate-900 dark:text-white">{notif.title}</h4>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{notif.examTitle}</p>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold tabular-nums">
                      <Clock
                        className={`w-4 h-4 ${
                          countdown.isImminent
                            ? 'text-rose-600 dark:text-rose-400'
                            : countdown.isPast
                              ? 'text-slate-400 dark:text-slate-500'
                              : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      />
                      <span
                        className={
                          countdown.isImminent
                            ? 'text-rose-700 dark:text-rose-400'
                            : countdown.isPast
                              ? 'text-slate-500 dark:text-slate-400'
                              : 'text-emerald-800 dark:text-emerald-300'
                        }
                      >
                        {countdown.label}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{notif.message}</p>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {notif.examId !== 'general' && (
                        <button
                          type="button"
                          onClick={() => void toggleExamReminder(notif.examId)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                            isSubscribed
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                              : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-500'
                          }`}
                        >
                          {isSubscribed ? (
                            <>
                              <Bell className="w-3.5 h-3.5" />
                              <span>یادآور فعال است (لغو)</span>
                            </>
                          ) : (
                            <>
                              <BellOff className="w-3.5 h-3.5" />
                              <span>یادآوری زمان شروع به من</span>
                            </>
                          )}
                        </button>
                      )}

                      {!isRead && (
                        <button
                          type="button"
                          onClick={() => void markNotificationRead(notif.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>خواندم</span>
                        </button>
                      )}
                    </div>

                    {matchedExam ? (
                      <button
                        type="button"
                        disabled={!matchedExam.isActive}
                        onClick={() => {
                          void markNotificationRead(notif.id);
                          startExamRunner(matchedExam.id);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>ورود به جلسه آزمون</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          void markNotificationRead(notif.id);
                          setView('exams');
                        }}
                        className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-emerald-600 rounded-lg cursor-pointer"
                      >
                        مشاهده لیست آزمون‌ها
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Scheduled Exams Quick Reminder Table */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            تقویم آزمون‌های برنامه‌ریزی‌شده و اشتراک یادآور شخصی
          </h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {exams.map((exam) => {
            const isSubscribed = subscribedSet.has(exam.id);
            return (
              <div
                key={exam.id}
                className="p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{exam.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {exam.grade} · تاریخ اجرا: {exam.scheduledDate} · مدت:{' '}
                    {toPersianDigits(exam.durationMinutes)} دقیقه
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void toggleExamReminder(exam.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border cursor-pointer ${
                    isSubscribed
                      ? 'bg-emerald-700 dark:bg-emerald-600 text-white border-emerald-700 dark:border-emerald-600'
                      : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-emerald-600'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{isSubscribed ? 'یادآور فعال' : 'ثبت یادآور'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
