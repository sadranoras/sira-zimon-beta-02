import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Lock,
  MessageSquarePlus,
  Send,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { TicketStatus, TicketSubject } from '../types';
import { toPersianDigits } from '../utils/formatters';

const SUBJECT_OPTIONS: TicketSubject[] = [
  'زیست‌شناسی',
  'شیمی',
  'فیزیک',
  'ریاضی',
  'مشاوره و انتخاب رشته',
  'فنی و ثبت‌نام',
];

export const StudentTicketsView: React.FC = () => {
  const { tickets, courses, createTicket, closeTicket } = useApp();

  const [showForm, setShowForm] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | TicketStatus>('all');
  const [subject, setSubject] = useState<TicketSubject>('زیست‌شناسی');
  const [courseTitle, setCourseTitle] = useState('عمومی / خارج از دوره');
  const [title, setTitle] = useState('');
  const [questionBody, setQuestionBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredTickets = useMemo(() => {
    if (filterStatus === 'all') return tickets;
    return tickets.filter((t) => t.status === filterStatus);
  }, [tickets, filterStatus]);

  const counts = useMemo(
    () => ({
      all: tickets.length,
      open: tickets.filter((t) => t.status === 'open').length,
      answered: tickets.filter((t) => t.status === 'answered').length,
      closed: tickets.filter((t) => t.status === 'closed').length,
    }),
    [tickets]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2 || questionBody.trim().length < 4) return;
    setSubmitting(true);
    try {
      const ok = await createTicket({
        subject,
        courseTitle,
        title,
        questionBody,
      });
      if (ok) {
        setTitle('');
        setQuestionBody('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateFa = (iso?: string) => {
    if (!iso) return 'اکنون';
    try {
      return new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(iso));
    } catch {
      return 'ثبت‌شده';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + New Ticket Form */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              سیستم تیکتینگ و رفع اشکال درسی با اساتید
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              سوالات علمی، نکات مبهم جزوات یا ابهامات انتخاب رشته خود را ثبت کنید تا اساتید دپارتمان زیست‌ماز پاسخ تشریحی ارسال کنند.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer shrink-0"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>{showForm ? 'بستن فرم ارسال' : 'ارسال سوال جدید'}</span>
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">دپارتمان / درس مربوطه</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as TicketSubject)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
                >
                  {SUBJECT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">دوره یا آزمون مرتبط</label>
                <select
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
                >
                  <option value="عمومی / خارج از دوره">عمومی / خارج از دوره</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.title}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">عنوان سوال یا شماره تست</label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={180}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً: ابهام در مراحل رونویسی پروکاریوت‌ها و یوکاریوت‌ها (فصل ۲ دوازدهم)"
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">متن کامل سوال آموزشی</label>
              <textarea
                rows={4}
                required
                minLength={4}
                maxLength={3000}
                value={questionBody}
                onChange={(e) => setQuestionBody(e.target.value)}
                placeholder="توضیح دقیق سوال، شماره صفحه جزوه یا گزینه مورد نظر خود را بنویسید..."
                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-60"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'در حال ارسال...' : 'ثبت و ارسال به استاد'}</span>
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Ticket List */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            تیکت‌های ارسالی من ({toPersianDigits(tickets.length)})
          </h3>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {(
              [
                { id: 'all', label: `همه (${toPersianDigits(counts.all)})` },
                { id: 'open', label: `در انتظار پاسخ (${toPersianDigits(counts.open)})` },
                { id: 'answered', label: `پاسخ داده‌شده (${toPersianDigits(counts.answered)})` },
                { id: 'closed', label: `بسته‌شده (${toPersianDigits(counts.closed)})` },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterStatus(f.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer border ${
                  filterStatus === f.id
                    ? 'bg-slate-900 dark:bg-emerald-600 text-white border-slate-900 dark:border-emerald-600'
                    : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              تیکتی در این بخش یافت نشد
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              از فرم بالا می‌توانید اولین سوال آموزشی خود را برای اساتید ارسال کنید.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTickets.map((t) => (
              <article key={t.id} className="p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{t.subject}</span>
                      <span aria-hidden="true">·</span>
                      <span>{t.courseTitle || 'عمومی'}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{formatDateFa(t.createdAtIso)}</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">{t.title}</h4>
                  </div>

                  <div className="flex items-center gap-3">
                    {t.status === 'open' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>در انتظار پاسخ استاد</span>
                      </span>
                    )}
                    {t.status === 'answered' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>پاسخ داده‌شده</span>
                      </span>
                    )}
                    {t.status === 'closed' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <Lock className="w-3.5 h-3.5" />
                        <span>بسته‌شده</span>
                      </span>
                    )}

                    {t.status !== 'closed' && (
                      <button
                        type="button"
                        onClick={() => void closeTicket(t.id)}
                        className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 hover:border-slate-500 text-xs font-medium text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer"
                      >
                        بستن تیکت
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {t.questionBody}
                </p>

                {t.instructorReply && (
                  <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                      <UserCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      <span>پاسخ {t.instructorName || 'استاد دپارتمان'}:</span>
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                      {t.instructorReply}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
