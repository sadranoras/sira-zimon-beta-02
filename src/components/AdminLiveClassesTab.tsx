import React, { useState } from 'react';
import { Edit2, Play, Plus, Radio, Square, Trash2, Video } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { GradeLevel, LiveClass, LiveClassStatus } from '../types';
import { toPersianDigits } from '../utils/formatters';

export const AdminLiveClassesTab: React.FC = () => {
  const {
    courses,
    liveClasses,
    saveLiveClass,
    setLiveClassStatus,
    deleteLiveClass,
    openLiveClass,
  } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('general');
  const [instructorName, setInstructorName] = useState('دکتر فرزام فرهمندنیا');
  const [grade, setGrade] = useState<GradeLevel>('جامع کنکور');
  const [subject, setSubject] = useState('زیست‌شناسی');
  const [scheduledLabel, setScheduledLabel] = useState('چهارشنبه ساعت ۱۸:۳۰');
  const [status, setStatus] = useState<LiveClassStatus>('scheduled');
  const [boardTitle, setBoardTitle] = useState('خلاصه نکات کلیدی جلسه');
  const [boardContent, setBoardContent] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setEditingId(undefined);
    setTitle('');
    setCourseId('general');
    setInstructorName('دکتر فرزام فرهمندنیا');
    setGrade('جامع کنکور');
    setSubject('زیست‌شناسی');
    setScheduledLabel('چهارشنبه ساعت ۱۸:۳۰');
    setStatus('scheduled');
    setBoardTitle('خلاصه نکات کلیدی جلسه');
    setBoardContent('');
    setStreamUrl('');
    setIsFree(true);
  };

  const handleEdit = (lc: LiveClass) => {
    setEditingId(lc.id);
    setTitle(lc.title);
    setCourseId(lc.courseId || 'general');
    setInstructorName(lc.instructorName);
    setGrade(lc.grade);
    setSubject(lc.subject);
    setScheduledLabel(lc.scheduledLabel);
    setStatus(lc.status);
    setBoardTitle(lc.boardTitle);
    setBoardContent(lc.boardContent);
    setStreamUrl(lc.streamUrl || '');
    setIsFree(lc.isFree);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const matchedCourse = courses.find((c) => c.id === courseId);
      await saveLiveClass(
        {
          title,
          courseId,
          courseTitle: matchedCourse ? matchedCourse.title : 'کلاس آنلاین مستقل زیست‌ماز',
          instructorName,
          grade,
          subject,
          scheduledLabel,
          status,
          boardTitle,
          boardContent,
          streamUrl,
          isFree,
        },
        editingId
      );
      setShowForm(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const statusText = (st: LiveClassStatus) => {
    if (st === 'live') return 'در حال پخش زنده';
    if (st === 'scheduled') return 'برنامه‌ریزی‌شده';
    return 'پایان‌یافته';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            مدیریت کلاس‌های آنلاین و استودیو تدریس ({toPersianDigits(liveClasses.length)})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            کلاس جدید تعریف کنید، آن را به دوره‌ها متصل کنید و به‌صورت زنده با تخته هوشمند برگزار کنید.
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
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{showForm ? 'بستن فرم' : 'ایجاد کلاس آنلاین جدید'}</span>
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {editingId ? 'ویرایش کلاس آنلاین' : 'تعریف کلاس آنلاین جدید'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                عنوان جلسه کلاس آنلاین
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً کارگاه حل تست ژنتیک دوازدهم"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                متصل به دوره
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                <option value="general">کلاس آنلاین مستقل (عمومی)</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                نام مدرس
              </label>
              <input
                type="text"
                required
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                زمان برگزاری
              </label>
              <input
                type="text"
                required
                value={scheduledLabel}
                onChange={(e) => setScheduledLabel(e.target.value)}
                placeholder="پنج‌شنبه ساعت ۱۷:۰۰"
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">پایه</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value as GradeLevel)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                <option value="دهم">دهم</option>
                <option value="یازدهم">یازدهم</option>
                <option value="دوازدهم">دوازدهم</option>
                <option value="جامع کنکور">جامع کنکور</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">درس</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                وضعیت کلاس
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LiveClassStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                <option value="scheduled">برنامه‌ریزی‌شده</option>
                <option value="live">در حال برگزاری (پخش زنده)</option>
                <option value="ended">پایان‌یافته</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                لینک استریم خارجی (اختیاری)
              </label>
              <input
                type="url"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              تیتر تخته و جزوه کلاس
            </label>
            <input
              type="text"
              value={boardTitle}
              onChange={(e) => setBoardTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
              متن اولیه روی تخته کلاس
            </label>
            <textarea
              rows={3}
              value={boardContent}
              onChange={(e) => setBoardContent(e.target.value)}
              placeholder="سرفصل‌های جلسه یا نکات روی تخته..."
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />
            <span>شرکت برای همه دانش‌آموزان آزاد است (جلسه عمومی / رایگان)</span>
          </label>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              {saving ? 'در حال ذخیره...' : editingId ? 'ذخیره تغییرات' : 'ایجاد کلاس آنلاین'}
            </button>
          </div>
        </form>
      )}

      {/* List of Live Classes */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800">
        {liveClasses.length === 0 ? (
          <p className="p-8 text-sm text-slate-500 dark:text-slate-400 text-center">
            کلاس آنلاینی ثبت نشده است.
          </p>
        ) : (
          liveClasses.map((lc) => (
            <div
              key={lc.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`inline-flex items-center gap-1 font-bold ${
                      lc.status === 'live'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : lc.status === 'scheduled'
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5" />
                    {statusText(lc.status)}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="text-slate-500 dark:text-slate-400">{lc.grade}</span>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="text-slate-500 dark:text-slate-400">{lc.scheduledLabel}</span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{lc.title}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {lc.instructorName} · {lc.courseTitle}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => openLiveClass(lc.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>ورود و تدریس آنلاین</span>
                </button>

                {lc.status !== 'live' ? (
                  <button
                    type="button"
                    onClick={() => void setLiveClassStatus(lc, 'live')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>شروع پخش</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void setLiveClassStatus(lc, 'ended')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-rose-500 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>پایان</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleEdit(lc)}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  aria-label="ویرایش کلاس"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void deleteLiveClass(lc.id)}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 cursor-pointer"
                  aria-label="حذف کلاس"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
