import React, { useState } from 'react';
import {
  BellRing,
  CalendarClock,
  Edit3,
  Eye,
  EyeOff,
  Plus,
  Send,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type {
  ExamNotification,
  NotificationPriority,
  NotificationTargetGrade,
} from '../types';
import { toPersianDigits } from '../utils/formatters';

function toLocalDateTimeInput(iso?: string): string {
  const base = iso && !Number.isNaN(Date.parse(iso)) ? new Date(iso) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  const offsetMs = base.getTimezoneOffset() * 60000;
  return new Date(base.getTime() - offsetMs).toISOString().slice(0, 16);
}

function formatIsoToPersianStartLabel(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'بر اساس برنامه راهبردی';
    return new Intl.DateTimeFormat('fa-IR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return 'بر اساس برنامه راهبردی';
  }
}

export const AdminNotificationsTab: React.FC = () => {
  const {
    exams,
    examNotifications,
    saveExamNotification,
    toggleExamNotificationActive,
    deleteExamNotification,
  } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);

  const firstExam = exams[0];
  const [examId, setExamId] = useState<string>(firstExam?.id || 'general');
  const [examTitle, setExamTitle] = useState<string>(
    firstExam?.title || 'اطلاعیه عمومی برنامه آزمون‌ها'
  );
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetGrade, setTargetGrade] = useState<NotificationTargetGrade>('همه');
  const [priority, setPriority] = useState<NotificationPriority>('شروع آزمون');
  const [localDatetime, setLocalDatetime] = useState<string>(() => toLocalDateTimeInput());
  const [scheduledStartLabel, setScheduledStartLabel] = useState<string>(() =>
    formatIsoToPersianStartLabel(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
  );
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setEditingId(undefined);
    const ex = exams[0];
    setExamId(ex?.id || 'general');
    setExamTitle(ex?.title || 'اطلاعیه عمومی برنامه آزمون‌ها');
    setTitle('');
    setMessage('');
    setTargetGrade(ex?.grade || 'همه');
    setPriority('شروع آزمون');
    const nextIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    setLocalDatetime(toLocalDateTimeInput(nextIso));
    setScheduledStartLabel(formatIsoToPersianStartLabel(nextIso));
    setIsActive(true);
  };

  const handleSelectExam = (selectedId: string) => {
    setExamId(selectedId);
    if (selectedId === 'general') {
      setExamTitle('اطلاعیه عمومی برنامه آزمون‌ها');
      setTargetGrade('همه');
      return;
    }
    const found = exams.find((e) => e.id === selectedId);
    if (found) {
      setExamTitle(found.title);
      setTargetGrade(found.grade);
      if (!title.trim()) {
        setTitle(`اعلان زمان شروع ${found.title}`);
      }
      if (!message.trim()) {
        setMessage(
          `دفترچه سوالات ${found.title} در زمان مقرر باز می‌شود. مدت پاسخ‌گویی ${toPersianDigits(found.durationMinutes)} دقیقه است.`
        );
      }
    }
  };

  const handleEdit = (notif: ExamNotification) => {
    setEditingId(notif.id);
    setExamId(notif.examId);
    setExamTitle(notif.examTitle);
    setTitle(notif.title);
    setMessage(notif.message);
    setTargetGrade(notif.targetGrade);
    setPriority(notif.priority);
    setLocalDatetime(toLocalDateTimeInput(notif.scheduledStartIso));
    setScheduledStartLabel(notif.scheduledStartLabel);
    setIsActive(notif.isActive);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const iso = localDatetime ? new Date(localDatetime).toISOString() : '';
      await saveExamNotification(
        {
          examId,
          examTitle,
          title,
          message,
          targetGrade,
          priority,
          scheduledStartIso: iso,
          scheduledStartLabel,
          isActive,
        },
        editingId
      );
      setShowForm(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleQuickBroadcast = async (examIdTarget: string) => {
    const found = exams.find((e) => e.id === examIdTarget);
    if (!found) return;
    const startIso = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await saveExamNotification({
      examId: found.id,
      examTitle: found.title,
      title: `یادآور فوری شروع: ${found.title}`,
      message: `داوطلب گرامی؛ آزمون «${found.title}» (${found.scheduledDate}) تا ۱ ساعت دیگر آغاز می‌شود. لطفاً سیستم خود را پیش از شروع بررسی کنید.`,
      targetGrade: found.grade,
      priority: 'فوری',
      scheduledStartIso: startIso,
      scheduledStartLabel: `${found.scheduledDate} — ۱ ساعت دیگر`,
      isActive: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Broadcast */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BellRing className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                مدیریت اعلان‌ها و زمان‌بندی شروع آزمون‌ها
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              انتشار اطلاعیه شروع آزمون با شمارش معکوس زنده، یادآور ۲۴ ساعته یا اعلام تغییر ساعت برای پنل شخصی دانش‌آموزان
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                resetForm();
              } else {
                resetForm();
                setShowForm(true);
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{showForm ? 'بستن فرم' : 'ایجاد اعلان جدید آزمون'}</span>
          </button>
        </div>

        {/* Quick 1-click reminder buttons per exam */}
        {exams.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 ml-1">ارسال یادآور فوری ۱ ساعته برای:</span>
            {exams.slice(0, 4).map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => void handleQuickBroadcast(ex.id)}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-800 dark:text-slate-200 font-medium rounded-lg cursor-pointer"
              >
                {ex.code} · {ex.grade}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4"
        >
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {editingId ? 'ویرایش اعلان زمان‌بندی آزمون' : 'ثبت و انتشار اعلان جدید'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">آزمون مرتبط</label>
              <select
                value={examId}
                onChange={(e) => handleSelectExam(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title} ({ex.grade})
                  </option>
                ))}
                <option value="general">اطلاعیه عمومی همه آزمون‌ها</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">نوع / اولویت اعلان</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as NotificationPriority)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                <option value="شروع آزمون">شروع آزمون</option>
                <option value="یادآور ۲۴ ساعته">یادآور ۲۴ ساعته</option>
                <option value="فوری">فوری</option>
                <option value="تغییر زمان">تغییر زمان</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">مخاطب (پایه تحصیلی)</label>
              <select
                value={targetGrade}
                onChange={(e) => setTargetGrade(e.target.value as NotificationTargetGrade)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                <option value="همه">همه دانش‌آموزان</option>
                <option value="دهم">دهم</option>
                <option value="یازدهم">یازدهم</option>
                <option value="دوازدهم">دوازدهم</option>
                <option value="جامع کنکور">جامع کنکور</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                زمان دقیق شروع (برای شمارش معکوس زنده)
              </label>
              <input
                type="datetime-local"
                value={localDatetime}
                onChange={(e) => {
                  setLocalDatetime(e.target.value);
                  if (e.target.value) {
                    const iso = new Date(e.target.value).toISOString();
                    setScheduledStartLabel(formatIsoToPersianStartLabel(iso));
                  }
                }}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg font-mono-tabular"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                عنوان زمان‌بندی قابل نمایش (فارسی)
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={120}
                value={scheduledStartLabel}
                onChange={(e) => setScheduledStartLabel(e.target.value)}
                placeholder="مثلاً: پنج‌شنبه ۲۴ آبان — ساعت ۰۸:۰۰ صبح"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">عنوان اعلان</label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={180}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً: شروع آزمون آزمایشی جامع زیست‌ماز مرحله ۱"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">متن پیام برای دانش‌آموزان</label>
              <textarea
                rows={3}
                required
                minLength={4}
                maxLength={2000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="توضیحات بودجه‌بندی، قوانین ورود به جلسه و زمان‌بندی کارنامه..."
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span>انتشار فعال در پنل دانش‌آموزان</span>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{saving ? 'در حال ذخیره...' : editingId ? 'ذخیره ویرایش' : 'انتشار اعلان'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Existing Notifications List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            اعلان‌های ثبت‌شده ({toPersianDigits(examNotifications.length)})
          </h3>
        </div>

        {examNotifications.length === 0 ? (
          <p className="p-8 text-sm text-slate-500 dark:text-slate-400 text-center">اعلانی ثبت نشده است.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {examNotifications.map((notif) => (
              <div key={notif.id} className="p-5 flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span
                      className={`font-bold ${
                        notif.isActive
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {notif.isActive ? 'فعال' : 'غیرفعال'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{notif.priority}</span>
                    <span aria-hidden="true">·</span>
                    <span>مخاطب: {notif.targetGrade}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="w-3.5 h-3.5" />
                      {notif.scheduledStartLabel}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{notif.title}</h4>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{notif.examTitle}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{notif.message}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => void toggleExamNotificationActive(notif)}
                    title={notif.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
                  >
                    {notif.isActive ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(notif)}
                    title="ویرایش"
                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteExamNotification(notif.id)}
                    title="حذف"
                    className="p-2 text-slate-400 hover:text-rose-700 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
