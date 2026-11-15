import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BellRing,
  BookOpen,
  Database,
  FileText,
  Layers,
  MessageSquare,
  Plus,
  Send,
  ShieldAlert,
  ShoppingBag,
  Trash2,
  Users,
  Video,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { BookletCategory, GradeLevel, TicketStatus } from '../types';
import { formatToman, toPersianDigits } from '../utils/formatters';
import { analyzeCohortDistribution } from '../utils/konkurAnalytics';
import { AdminCoursesTab, AdminExamsTab } from './AdminCoursesExamsTab';
import { AdminLiveClassesTab } from './AdminLiveClassesTab';
import { AdminNotificationsTab } from './AdminNotificationsTab';

type AdminTab =
  | 'overview'
  | 'courses'
  | 'live-classes'
  | 'exams'
  | 'notifications'
  | 'resources'
  | 'tickets'
  | 'orders'
  | 'users';

export const AdminPanelView: React.FC = () => {
  const {
    user,
    isAdmin,
    setView,
    courses,
    exams,
    liveClasses,
    booklets,
    articles,
    allUsers,
    allOrders,
    allAttempts,
    allTickets,
    examNotifications,
    adminRecords,
    catalogFromFirestore,
    seedDatabase,
    saveBooklet,
    deleteBooklet,
    saveArticle,
    deleteArticle,
    toggleUserDiamond,
    updateOrderStatus,
    grantAdminRole,
    revokeAdminRole,
    replyToTicket,
    deleteTicket,
  } = useApp();

  const [tab, setTab] = useState<AdminTab>('overview');
  const [seeding, setSeeding] = useState(false);

  // Ticket reply state
  const [ticketFilter, setTicketFilter] = useState<'all' | TicketStatus>('all');
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyInstructor, setReplyInstructor] = useState('دکتر فرزام فرهمندنیا');
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<'answered' | 'closed'>('answered');

  // Booklet form
  const [showBookletForm, setShowBookletForm] = useState(false);
  const [bTitle, setBTitle] = useState('');
  const [bSubject, setBSubject] = useState('زیست‌شناسی');
  const [bGrade, setBGrade] = useState<GradeLevel>('دوازدهم');
  const [bCategory, setBCategory] = useState<BookletCategory>('نکات ترکیبی');
  const [bPages, setBPages] = useState(32);
  const [bSize, setBSize] = useState('9.5 MB');
  const [bIsFree, setBIsFree] = useState(true);
  const [bPrice, setBPrice] = useState(0);
  const [bDesc, setBDesc] = useState('');
  const [bContent, setBContent] = useState('');

  // Article form
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [aTitle, setATitle] = useState('');
  const [aAuthor, setAAuthor] = useState('دکتر فرزام فرهمندنیا');
  const [aCategory, setACategory] = useState('روش مطالعه زیست');
  const [aMinutes, setAMinutes] = useState(5);
  const [aDate, setADate] = useState('آبان ۱۴۰۵');
  const [aExcerpt, setAExcerpt] = useState('');
  const [aContent, setAContent] = useState('');

  const totalRevenue = useMemo(
    () => allOrders.filter((o) => o.status === 'paid').reduce((s, o) => s + o.totalAmount, 0),
    [allOrders]
  );

  const cohortStats = useMemo(() => analyzeCohortDistribution(allAttempts), [allAttempts]);

  const openTicketsCount = useMemo(
    () => allTickets.filter((t) => t.status === 'open').length,
    [allTickets]
  );

  const filteredTickets = useMemo(() => {
    if (ticketFilter === 'all') return allTickets;
    return allTickets.filter((t) => t.status === ticketFilter);
  }, [allTickets, ticketFilter]);

  if (!user || !isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-4">
          <ShieldAlert className="w-10 h-10 text-rose-600 dark:text-rose-400 mx-auto" />
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
            دسترسی محدود به مدیران سیستم
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            برای ورود به پنل مدیریت زیست‌ماز باید با حساب کاربری دارای دسترسی مدیریت وارد شوید.
          </p>
          <button
            type="button"
            onClick={() => setView('home')}
            className="px-5 py-2.5 bg-slate-900 dark:bg-emerald-700 text-white text-sm font-semibold rounded-lg cursor-pointer"
          >
            بازگشت به صفحه اصلی
          </button>
        </div>
      </div>
    );
  }

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedDatabase();
    } finally {
      setSeeding(false);
    }
  };

  const handleCreateBooklet = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveBooklet({
      title: bTitle,
      subject: bSubject,
      grade: bGrade,
      category: bCategory,
      pagesCount: Number(bPages),
      fileSizeLabel: bSize,
      isFree: bIsFree,
      price: bIsFree ? 0 : Number(bPrice),
      description: bDesc,
      summaryContent: bContent,
    });
    setShowBookletForm(false);
    setBTitle('');
    setBDesc('');
    setBContent('');
  };

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveArticle({
      title: aTitle,
      author: aAuthor,
      category: aCategory,
      readMinutes: Number(aMinutes),
      publishedDate: aDate,
      excerpt: aExcerpt,
      content: aContent,
      featured: true,
    });
    setShowArticleForm(false);
    setATitle('');
    setAExcerpt('');
    setAContent('');
  };

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'آمار کلی و دیتابیس', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'courses', label: 'دوره‌ها و جلسات', icon: <BookOpen className="w-4 h-4" /> },
    {
      id: 'live-classes',
      label: `کلاس‌های آنلاین (${toPersianDigits(liveClasses.length)})`,
      icon: <Video className="w-4 h-4" />,
    },
    { id: 'exams', label: 'آزمون‌ها و سوالات', icon: <Layers className="w-4 h-4" /> },
    {
      id: 'notifications',
      label: `اعلان‌های شروع آزمون (${toPersianDigits(examNotifications.filter((n) => n.isActive).length)})`,
      icon: <BellRing className="w-4 h-4" />,
    },
    { id: 'resources', label: 'جزوات و مقالات', icon: <FileText className="w-4 h-4" /> },
    {
      id: 'tickets',
      label:
        openTicketsCount > 0
          ? `تیکت‌های دانش‌آموزان (${toPersianDigits(openTicketsCount)} باز)`
          : 'تیکت‌های دانش‌آموزان',
      icon: <MessageSquare className="w-4 h-4" />,
    },
    { id: 'orders', label: 'سفارش‌ها و کارنامه‌ها', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'users', label: 'دانش‌آموزان و مدیران', icon: <Users className="w-4 h-4" /> },
  ];

  const inputCls =
    'px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Admin Top Header */}
      <div className="bg-slate-900 dark:bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs text-emerald-400 font-semibold">پنل مدیریت یکپارچه زیست‌ماز</p>
          <h1 className="text-xl sm:text-2xl font-extrabold">
            کنسول مدیریت دوره‌ها، کلاس‌های آنلاین، آزمون‌ها و کاربران
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={seeding}
            onClick={handleSeed}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            <Database className="w-4 h-4" />
            <span>
              {seeding
                ? 'در حال همگام‌سازی...'
                : catalogFromFirestore
                  ? 'بازنشانی داده‌های نمونه'
                  : 'ذخیره داده‌های نمونه در دیتابیس'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setView('student-panel')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>پنل دانش‌آموزی</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                tab === item.id
                  ? 'bg-slate-900 dark:bg-emerald-700 text-white font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </aside>

        <div className="lg:col-span-9 space-y-6">
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">دانش‌آموزان ثبت‌نامی</p>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                    {toPersianDigits(allUsers.length)}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">مجموع فروش تاییدشده</p>
                  <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {formatToman(totalRevenue)}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">کلاس‌های آنلاین</p>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                    {toPersianDigits(liveClasses.length)}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">دوره‌ها و آزمون‌ها</p>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                    {toPersianDigits(courses.length)} / {toPersianDigits(exams.length)}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  دسترسی سریع مدیریت و برگزاری کلاس
                </h2>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setTab('courses')}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    + افزودن دوره یا جلسه جدید
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('live-classes')}
                    className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    + تعریف و برگزاری کلاس آنلاین
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('live-classroom')}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-emerald-600 text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    ورود به تالار کلاس آنلاین
                  </button>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {catalogFromFirestore
                    ? 'کاتالوگ دوره‌ها، کلاس‌های آنلاین، آزمون‌ها، جزوات و مقالات هم‌اکنون به صورت زنده از Firestore بارگذاری می‌شود و هر تغییری بلافاصله برای تمامی کاربران اعمال می‌گردد.'
                    : 'پایگاه داده هنوز خالی است. روی دکمه «ذخیره داده‌های نمونه در دیتابیس» در بالا کلیک کنید تا دوره‌ها، کلاس‌های آنلاین، سوالات و جزوات اولیه در Firestore ذخیره شوند.'}
                </p>
              </div>
            </div>
          )}

          {tab === 'courses' && <AdminCoursesTab />}
          {tab === 'live-classes' && <AdminLiveClassesTab />}
          {tab === 'exams' && <AdminExamsTab />}
          {tab === 'notifications' && <AdminNotificationsTab />}

          {tab === 'resources' && (
            <div className="space-y-8">
              {/* Booklets Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    مدیریت جزوات و فایل‌ها
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowBookletForm((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{showBookletForm ? 'بستن' : 'افزودن جزوه'}</span>
                  </button>
                </div>

                {showBookletForm && (
                  <form
                    onSubmit={handleCreateBooklet}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        value={bTitle}
                        onChange={(e) => setBTitle(e.target.value)}
                        placeholder="عنوان جزوه"
                        className={inputCls}
                      />
                      <input
                        type="text"
                        required
                        value={bSubject}
                        onChange={(e) => setBSubject(e.target.value)}
                        placeholder="درس"
                        className={inputCls}
                      />
                      <select
                        value={bGrade}
                        onChange={(e) => setBGrade(e.target.value as GradeLevel)}
                        className={inputCls}
                      >
                        <option value="دهم">دهم</option>
                        <option value="یازدهم">یازدهم</option>
                        <option value="دوازدهم">دوازدهم</option>
                        <option value="جامع کنکور">جامع کنکور</option>
                      </select>
                      <select
                        value={bCategory}
                        onChange={(e) => setBCategory(e.target.value as BookletCategory)}
                        className={inputCls}
                      >
                        <option value="جزوه کلاسی">جزوه کلاسی</option>
                        <option value="نکات ترکیبی">نکات ترکیبی</option>
                        <option value="بانک تست">بانک تست</option>
                        <option value="برنامه راهبردی">برنامه راهبردی</option>
                      </select>
                      <input
                        type="number"
                        min={1}
                        required
                        value={bPages}
                        onChange={(e) => setBPages(Number(e.target.value))}
                        placeholder="تعداد صفحات"
                        className={inputCls}
                      />
                      <input
                        type="text"
                        required
                        value={bSize}
                        onChange={(e) => setBSize(e.target.value)}
                        placeholder="حجم فایل (مثلاً 12 MB)"
                        className={inputCls}
                      />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-700 dark:text-slate-300">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={bIsFree}
                          onChange={(e) => setBIsFree(e.target.checked)}
                        />
                        <span>رایگان</span>
                      </label>
                      {!bIsFree && (
                        <input
                          type="number"
                          min={0}
                          value={bPrice}
                          onChange={(e) => setBPrice(Number(e.target.value))}
                          placeholder="قیمت (تومان)"
                          className={inputCls}
                        />
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      value={bDesc}
                      onChange={(e) => setBDesc(e.target.value)}
                      placeholder="توضیح کوتاه جزوه"
                      className={`w-full ${inputCls}`}
                    />
                    <textarea
                      rows={3}
                      required
                      value={bContent}
                      onChange={(e) => setBContent(e.target.value)}
                      placeholder="متن نکات جزوه برای مطالعه آنلاین..."
                      className={`w-full ${inputCls}`}
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      ذخیره جزوه
                    </button>
                  </form>
                )}

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800">
                  {booklets.map((b) => (
                    <div key={b.id} className="p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{b.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {b.category} · {b.grade} · {b.isFree ? 'رایگان' : formatToman(b.price)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void deleteBooklet(b.id)}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-700 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Articles Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    مدیریت مقالات وبلاگ
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowArticleForm((v) => !v)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{showArticleForm ? 'بستن' : 'انتشار مقاله جدید'}</span>
                  </button>
                </div>

                {showArticleForm && (
                  <form
                    onSubmit={handleCreateArticle}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        value={aTitle}
                        onChange={(e) => setATitle(e.target.value)}
                        placeholder="عنوان مقاله"
                        className={inputCls}
                      />
                      <input
                        type="text"
                        required
                        value={aAuthor}
                        onChange={(e) => setAAuthor(e.target.value)}
                        placeholder="نویسنده"
                        className={inputCls}
                      />
                      <input
                        type="text"
                        required
                        value={aCategory}
                        onChange={(e) => setACategory(e.target.value)}
                        placeholder="دسته‌بندی"
                        className={inputCls}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          min={1}
                          required
                          value={aMinutes}
                          onChange={(e) => setAMinutes(Number(e.target.value))}
                          placeholder="دقیقه مطالعه"
                          className={inputCls}
                        />
                        <input
                          type="text"
                          required
                          value={aDate}
                          onChange={(e) => setADate(e.target.value)}
                          placeholder="تاریخ انتشار"
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <input
                      type="text"
                      required
                      value={aExcerpt}
                      onChange={(e) => setAExcerpt(e.target.value)}
                      placeholder="خلاصه مقاله"
                      className={`w-full ${inputCls}`}
                    />
                    <textarea
                      rows={4}
                      required
                      value={aContent}
                      onChange={(e) => setAContent(e.target.value)}
                      placeholder="متن کامل مقاله..."
                      className={`w-full ${inputCls}`}
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      انتشار مقاله
                    </button>
                  </form>
                )}

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800">
                  {articles.map((a) => (
                    <div key={a.id} className="p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{a.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {a.author} · {a.publishedDate}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void deleteArticle(a.id)}
                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-700 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'tickets' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  مدیریت تیکت‌ها و پاسخ‌گویی علمی اساتید ({toPersianDigits(allTickets.length)})
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {(
                    [
                      { id: 'all', label: 'همه' },
                      { id: 'open', label: 'در انتظار پاسخ' },
                      { id: 'answered', label: 'پاسخ داده‌شده' },
                      { id: 'closed', label: 'بسته‌شده' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setTicketFilter(f.id)}
                      className={`px-3 py-1.5 rounded-lg font-semibold border cursor-pointer ${
                        ticketFilter === f.id
                          ? 'bg-slate-900 dark:bg-emerald-700 text-white border-slate-900 dark:border-emerald-700'
                          : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredTickets.length === 0 ? (
                <p className="p-8 text-sm text-slate-500 dark:text-slate-400 text-center">
                  تیکتی در این وضعیت ثبت نشده است.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTickets.map((t) => {
                    const isEditing = activeReplyId === t.id;
                    return (
                      <div key={t.id} className="p-5 space-y-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {t.studentName}
                              </span>{' '}
                              ({t.studentEmail}) · {t.subject} · {t.courseTitle || 'عمومی'}
                            </p>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                              {t.title}
                            </h3>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold ${
                                t.status === 'open'
                                  ? 'text-amber-700 dark:text-amber-400'
                                  : t.status === 'answered'
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : 'text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {t.status === 'open'
                                ? 'در انتظار پاسخ'
                                : t.status === 'answered'
                                  ? 'پاسخ داده‌شده'
                                  : 'بسته‌شده'}
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                if (isEditing) {
                                  setActiveReplyId(null);
                                } else {
                                  setActiveReplyId(t.id);
                                  setReplyInstructor(t.instructorName || 'دکتر فرزام فرهمندنیا');
                                  setReplyText(t.instructorReply || '');
                                  setReplyStatus(t.status === 'closed' ? 'closed' : 'answered');
                                }
                              }}
                              className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-emerald-600 text-xs font-semibold rounded-lg cursor-pointer"
                            >
                              {isEditing ? 'انصراف' : t.instructorReply ? 'ویرایش پاسخ' : 'پاسخ به تیکت'}
                            </button>

                            <button
                              type="button"
                              onClick={() => void deleteTicket(t.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-700 cursor-pointer"
                              aria-label="حذف تیکت"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                          {t.questionBody}
                        </p>

                        {t.instructorReply && !isEditing && (
                          <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                              پاسخ ثبت‌شده ({t.instructorName || 'استاد'}):
                            </p>
                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                              {t.instructorReply}
                            </p>
                          </div>
                        )}

                        {isEditing && (
                          <form
                            onSubmit={async (e) => {
                              e.preventDefault();
                              await replyToTicket(t.id, replyInstructor, replyText, replyStatus);
                              setActiveReplyId(null);
                            }}
                            className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <input
                                type="text"
                                required
                                value={replyInstructor}
                                onChange={(e) => setReplyInstructor(e.target.value)}
                                placeholder="نام استاد پاسخ‌گو"
                                className={inputCls}
                              />
                              <select
                                value={replyStatus}
                                onChange={(e) =>
                                  setReplyStatus(e.target.value as 'answered' | 'closed')
                                }
                                className={inputCls}
                              >
                                <option value="answered">وضعیت: پاسخ داده‌شده</option>
                                <option value="closed">وضعیت: بسته‌شده</option>
                              </select>
                            </div>
                            <textarea
                              rows={3}
                              required
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="پاسخ علمی و راهنمایی برای دانش‌آموز..."
                              className={`w-full ${inputCls}`}
                            />
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>ثبت پاسخ استاد</span>
                            </button>
                          </form>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'orders' && (
            <div className="space-y-8">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    سفارش‌های ثبت‌شده ({toPersianDigits(allOrders.length)})
                  </h2>
                </div>
                {allOrders.length === 0 ? (
                  <p className="p-6 text-sm text-slate-500 dark:text-slate-400 text-center">
                    سفارشی ثبت نشده است.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                          <th className="py-3 px-4">دانش‌آموز</th>
                          <th className="py-3 px-4">اقلام</th>
                          <th className="py-3 px-4">مبلغ</th>
                          <th className="py-3 px-4">وضعیت</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {allOrders.map((ord) => (
                          <tr key={ord.id}>
                            <td className="py-3.5 px-4">
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {ord.studentName}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {ord.studentEmail}
                              </p>
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300 max-w-xs">
                              {ord.itemTitles.join('، ')}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white tabular-nums">
                              {formatToman(ord.totalAmount)}
                            </td>
                            <td className="py-3.5 px-4">
                              <select
                                value={ord.status}
                                onChange={(e) =>
                                  void updateOrderStatus(
                                    ord.id,
                                    e.target.value as 'paid' | 'pending' | 'cancelled'
                                  )
                                }
                                className="px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                              >
                                <option value="paid">پرداخت‌شده</option>
                                <option value="pending">در انتظار</option>
                                <option value="cancelled">لغوشده</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    کارنامه‌های ثبت‌شده دانش‌آموزان ({toPersianDigits(allAttempts.length)})
                  </h2>
                  {cohortStats.count > 0 && (
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                      <span>میانگین درصد کل: {toPersianDigits(cohortStats.meanPercentage)}٪</span>
                      <span aria-hidden="true">·</span>
                      <span>انحراف معیار: {toPersianDigits(cohortStats.stdDevPercentage)}٪</span>
                      <span aria-hidden="true">·</span>
                      <span>میانگین تراز: {toPersianDigits(cohortStats.meanTaraz)}</span>
                    </div>
                  )}
                </div>
                {allAttempts.length === 0 ? (
                  <p className="p-6 text-sm text-slate-500 dark:text-slate-400 text-center">
                    کارنامه‌ای ثبت نشده است.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                          <th className="py-3 px-4">داوطلب</th>
                          <th className="py-3 px-4">آزمون</th>
                          <th className="py-3 px-4">درصد</th>
                          <th className="py-3 px-4">تراز</th>
                          <th className="py-3 px-4">رتبه تخمینی</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {allAttempts.map((att) => (
                          <tr key={att.id}>
                            <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                              {att.studentName}
                            </td>
                            <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                              {att.examTitle}
                            </td>
                            <td className="py-3 px-4 font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                              {toPersianDigits(att.percentage)}٪
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white tabular-nums">
                              {toPersianDigits(att.taraz)}
                            </td>
                            <td className="py-3 px-4 text-slate-700 dark:text-slate-300 tabular-nums">
                              {toPersianDigits(att.estimatedRank)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'users' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  مدیریت کاربران، اشتراک الماس و دسترسی ادمین ({toPersianDigits(allUsers.length)})
                </h2>
              </div>
              {allUsers.length === 0 ? (
                <p className="p-6 text-sm text-slate-500 dark:text-slate-400 text-center">
                  کاربری یافت نشد.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                        <th className="py-3 px-4">نام و ایمیل</th>
                        <th className="py-3 px-4">مقطع و رشته</th>
                        <th className="py-3 px-4">اشتراک الماس</th>
                        <th className="py-3 px-4">نقش مدیریت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {allUsers.map((u) => {
                        const isUidAdmin = adminRecords.some((a) => a.uid === u.uid);
                        return (
                          <tr key={u.uid}>
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-slate-900 dark:text-white">
                                {u.displayName}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                                {u.phone || u.email}
                              </p>
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300">
                              {u.grade} · {u.field}
                            </td>
                            <td className="py-3.5 px-4">
                              <button
                                type="button"
                                onClick={() => void toggleUserDiamond(u.uid, u.diamondActive)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer ${
                                  u.diamondActive
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-800 dark:text-emerald-300'
                                    : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {u.diamondActive ? 'الماس فعال' : 'فعال‌سازی الماس'}
                              </button>
                            </td>
                            <td className="py-3.5 px-4">
                              {isUidAdmin ? (
                                <button
                                  type="button"
                                  onClick={() => void revokeAdminRole(u.uid)}
                                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                >
                                  لغو مدیریت
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => void grantAdminRole(u.uid, u.email)}
                                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-slate-900 dark:hover:border-slate-500 cursor-pointer"
                                >
                                  ارتقا به ادمین
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

