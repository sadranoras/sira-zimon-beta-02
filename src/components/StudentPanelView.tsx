import React, { useMemo, useState } from 'react';
import {
  Award,
  Bell,
  BookOpen,
  Calculator,
  Compass,
  FileCheck2,
  LogOut,
  MessageSquare,
  Radio,
  Settings,
  ShieldCheck,
  ShoppingBag,
  User as UserIcon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DIAMOND_PACKAGE } from '../data/seedData';
import type { StudentGrade, StudentTab, StudyField } from '../types';
import { formatToman, toPersianDigits } from '../utils/formatters';
import { TarazProgressChart } from './TarazProgressChart';
import { KonkurAnalyzerCard } from './KonkurAnalyzerCard';
import { MajorSimulatorView } from './MajorSimulatorView';
import { StudentTicketsView } from './StudentTicketsView';
import { StudentNotificationsView } from './StudentNotificationsView';

export const StudentPanelView: React.FC = () => {
  const {
    user,
    userProfile,
    isAdmin,
    hasDiamondAccess,
    courses,
    enrollments,
    examAttempts,
    orders,
    tickets,
    examNotifications,
    liveClasses,
    unreadNotificationsCount,
    setView,
    studentPanelTab: tab,
    setStudentPanelTab: setTab,
    openCourseDetail,
    openLiveClass,
    openReportCard,
    addToCart,
    setIsCartOpen,
    cart,
    signInWithGoogle,
    signOut,
    updateMyProfile,
  } = useApp();

  const [nameInput, setNameInput] = useState(userProfile?.displayName || '');
  const [gradeInput, setGradeInput] = useState<StudentGrade>(userProfile?.grade || 'دوازدهم');
  const [fieldInput, setFieldInput] = useState<StudyField>(userProfile?.field || 'علوم تجربی');
  const [savingProfile, setSavingProfile] = useState(false);

  const myCourses = useMemo(() => {
    return courses.filter((c) => {
      if (hasDiamondAccess && c.isDiamondIncluded) return true;
      return enrollments.some((e) => e.courseId === c.id);
    });
  }, [courses, enrollments, hasDiamondAccess]);

  const avgTaraz = useMemo(() => {
    if (examAttempts.length === 0) return 0;
    const sum = examAttempts.reduce((acc, a) => acc + a.taraz, 0);
    return Math.round(sum / examAttempts.length);
  }, [examAttempts]);

  const liveNowCount = useMemo(
    () => liveClasses.filter((lc) => lc.status === 'live').length,
    [liveClasses]
  );

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-10 space-y-5">
          <UserIcon className="w-10 h-10 text-emerald-700 dark:text-emerald-400 mx-auto" />
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">ورود به پنل کاربری دانش‌آموز</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            برای دسترسی به کلاس‌های آنلاین، مشاهده کارنامه‌های تراز و رتبه، دریافت جزوات و مدیریت اشتراک الماس با حساب گوگل خود وارد شوید.
          </p>
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="w-full py-3 px-5 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg cursor-pointer"
          >
            ورود سریع با حساب گوگل
          </button>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateMyProfile(nameInput || userProfile?.displayName || 'دانش‌آموز ماز', gradeInput, fieldInput);
    } finally {
      setSavingProfile(false);
    }
  };

  const answeredTicketsCount = useMemo(
    () => tickets.filter((t) => t.status === 'answered').length,
    [tickets]
  );

  const activeExamNotifications = useMemo(
    () => examNotifications.filter((n) => n.isActive),
    [examNotifications]
  );

  const navItems: { id: StudentTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'نمای کلی داشبورد', icon: <Award className="w-4 h-4" /> },
    {
      id: 'notifications',
      label:
        unreadNotificationsCount > 0
          ? `اعلان‌های آزمون (${toPersianDigits(unreadNotificationsCount)} جدید)`
          : 'اعلان‌های آزمون',
      icon: <Bell className="w-4 h-4" />,
    },
    { id: 'courses', label: 'دوره‌های من', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'exams', label: 'کارنامه‌های آزمون', icon: <FileCheck2 className="w-4 h-4" /> },
    { id: 'analyzer', label: 'تحلیلگر تراز کنکور', icon: <Calculator className="w-4 h-4" /> },
    { id: 'major-sim', label: 'شبیه‌ساز انتخاب رشته', icon: <Compass className="w-4 h-4" /> },
    {
      id: 'tickets',
      label:
        answeredTicketsCount > 0
          ? `تیکت‌ها و رفع اشکال (${toPersianDigits(answeredTicketsCount)} پاسخ)`
          : 'تیکت‌ها و رفع اشکال',
      icon: <MessageSquare className="w-4 h-4" />,
    },
    { id: 'orders', label: 'سفارش‌ها و سبد', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'profile', label: 'پروفایل تحصیلی', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Workspace Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>پنل کاربری دانش‌آموز</span>
            <span aria-hidden="true">·</span>
            <span>{userProfile?.grade || 'دوازدهم'}</span>
            <span aria-hidden="true">·</span>
            <span>{userProfile?.field || 'علوم تجربی'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            سلام، {userProfile?.displayName || user.displayName || 'دانش‌آموز'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setView('admin-panel')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap shrink-0"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>ورود به پنل مدیریت</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => openLiveClass()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap shrink-0"
          >
            <Radio className="w-4 h-4" />
            <span>
              {liveNowCount > 0
                ? `ورود به کلاس زنده (${toPersianDigits(liveNowCount)})`
                : 'اتاق کلاس آنلاین'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 hover:border-emerald-600 dark:hover:border-emerald-500 text-xs font-semibold text-slate-800 dark:text-slate-100 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>سبد خرید ({toPersianDigits(cart.length)})</span>
          </button>
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-700 rounded-lg cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar */}
        <aside className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id);
                if (item.id === 'profile' && userProfile) {
                  setNameInput(userProfile.displayName);
                  setGradeInput(userProfile.grade);
                  setFieldInput(userProfile.field);
                }
              }}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                tab === item.id
                  ? 'bg-emerald-700 dark:bg-emerald-600 text-white font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Main Viewport */}
        <div className="lg:col-span-9 space-y-6">
          {tab === 'overview' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">وضعیت اشتراک الماس</p>
                  <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {hasDiamondAccess ? 'فعال (دسترسی کامل)' : 'غیرفعال'}
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">دوره‌های در دسترس</p>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                    {toPersianDigits(myCourses.length)} دوره
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">میانگین تراز آزمون‌ها</p>
                  <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {avgTaraz > 0 ? toPersianDigits(avgTaraz) : '—'}
                  </p>
                </div>
              </div>

              {activeExamNotifications.length > 0 && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                      <Bell className="w-4 h-4" />
                      <span>
                        {unreadNotificationsCount > 0
                          ? `${toPersianDigits(unreadNotificationsCount)} اعلان خوانده‌نشده برای آزمون‌های پیش‌رو`
                          : 'اطلاع‌رسانی زمان شروع آزمون‌های برنامه‌ریزی‌شده'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        {activeExamNotifications[0].scheduledStartLabel}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {activeExamNotifications[0].title}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTab('notifications')}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer shrink-0"
                  >
                    مشاهده اعلان‌ها و یادآور
                  </button>
                </div>
              )}

              <TarazProgressChart attempts={examAttempts} onStartExam={() => setView('exams')} />

              {!hasDiamondAccess && (
                <div className="bg-slate-900 dark:bg-slate-900 dark:border dark:border-slate-800 text-white rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold">اشتراک الماس ماز را فعال کنید</h2>
                    <p className="text-xs sm:text-sm text-slate-300">
                      دسترسی یکجا به تمام دوره‌های سالیانه، آزمون‌های آزمایشی و جمع‌بندی CPR
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      addToCart({
                        id: DIAMOND_PACKAGE.id,
                        type: 'diamond',
                        title: DIAMOND_PACKAGE.title,
                        subtitle: DIAMOND_PACKAGE.subtitle,
                        price: DIAMOND_PACKAGE.price,
                      })
                    }
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                  >
                    افزودن به سبد ({formatToman(DIAMOND_PACKAGE.price)})
                  </button>
                </div>
              )}

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">دسترسی سریع به دوره‌های من</h2>
                  <button
                    type="button"
                    onClick={() => setView('courses')}
                    className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    مشاهده کاتالوگ دوره‌ها
                  </button>
                </div>

                {myCourses.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 py-4">
                    هنوز در هیچ دوره‌ای ثبت‌نام نکرده‌اید. می‌توانید پیش‌نمایش رایگان تمام دوره‌ها را در کاتالوگ مشاهده کنید.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {myCourses.map((c) => {
                      const enr = enrollments.find((e) => e.courseId === c.id);
                      const completedCount = enr?.completedLessonIds.length ?? 0;
                      return (
                        <div
                          key={c.id}
                          className="py-3.5 flex flex-wrap items-center justify-between gap-3"
                        >
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{c.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                              {c.instructor} · {toPersianDigits(completedCount)} جلسه تکمیل‌شده
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => openCourseDetail(c.id)}
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                          >
                            ورود به کلاس
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {tab === 'courses' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">دوره‌های فعال شما</h2>
                <button
                  type="button"
                  onClick={() => openLiveClass()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>ورود به کلاس آنلاین زنده</span>
                </button>
              </div>
              {myCourses.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-400">هیچ دوره فعالی در حساب شما ثبت نشده است.</p>
                  <button
                    type="button"
                    onClick={() => setView('courses')}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    مشاهده و ثبت‌نام در دوره‌ها
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myCourses.map((c) => (
                    <div
                      key={c.id}
                      className="p-5 border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 rounded-xl flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-1.5">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {c.category} · {c.grade}
                        </p>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">{c.title}</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{c.instructor}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openCourseDetail(c.id)}
                        className="w-full py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        مشاهده جلسات و جزوه
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'exams' && (
            <div className="space-y-6">
              <TarazProgressChart attempts={examAttempts} onStartExam={() => setView('exams')} />

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">کارنامه‌های آزمون‌های من</h2>
                  <button
                    type="button"
                    onClick={() => setView('exams')}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    شرکت در آزمون جدید
                  </button>
                </div>
                {examAttempts.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">
                    هنوز در هیچ آزمونی شرکت نکرده‌اید.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          <th className="py-3 px-3">آزمون</th>
                          <th className="py-3 px-3">درصد</th>
                          <th className="py-3 px-3">تراز</th>
                          <th className="py-3 px-3">رتبه تخمینی</th>
                          <th className="py-3 px-3 text-left">کارنامه</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                        {examAttempts.map((att) => (
                          <tr key={att.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                            <td className="py-3.5 px-3 font-semibold text-slate-900 dark:text-white">{att.examTitle}</td>
                            <td className="py-3.5 px-3 tabular-nums text-emerald-700 dark:text-emerald-400 font-bold">
                              {toPersianDigits(att.percentage)}٪
                            </td>
                            <td className="py-3.5 px-3 tabular-nums font-bold text-slate-900 dark:text-white">
                              {toPersianDigits(att.taraz)}
                            </td>
                            <td className="py-3.5 px-3 tabular-nums text-slate-700 dark:text-slate-300">
                              {toPersianDigits(att.estimatedRank)}
                            </td>
                            <td className="py-3.5 px-3 text-left">
                              <button
                                type="button"
                                onClick={() => openReportCard(att)}
                                className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold hover:border-emerald-600 dark:hover:border-emerald-500 cursor-pointer"
                              >
                                مشاهده و تحلیل
                              </button>
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

          {tab === 'notifications' && <StudentNotificationsView />}
          {tab === 'analyzer' && <KonkurAnalyzerCard />}
          {tab === 'major-sim' && <MajorSimulatorView />}
          {tab === 'tickets' && <StudentTicketsView />}

          {tab === 'orders' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">تاریخچه سفارش‌ها و ثبت‌نام‌ها</h2>
              {orders.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">سفارشی ثبت نشده است.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="py-4 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {ord.itemTitles.join('، ')}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                          کد سفارش: {ord.id} · وضعیت:{' '}
                          {ord.status === 'paid'
                            ? 'پرداخت‌شده'
                            : ord.status === 'pending'
                              ? 'در انتظار'
                              : 'لغوشده'}
                        </p>
                      </div>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
                        {formatToman(ord.totalAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'profile' && (
            <form
              onSubmit={handleSaveProfile}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 max-w-xl"
            >
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">ویرایش پروفایل تحصیلی</h2>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">نام و نام خانوادگی</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">مقطع تحصیلی</label>
                <select
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value as StudentGrade)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-600"
                >
                  <option value="دهم">دهم</option>
                  <option value="یازدهم">یازدهم</option>
                  <option value="دوازدهم">دوازدهم</option>
                  <option value="فارغ‌التحصیل">فارغ‌التحصیل</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">رشته تحصیلی</label>
                <select
                  value={fieldInput}
                  onChange={(e) => setFieldInput(e.target.value as StudyField)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-emerald-600"
                >
                  <option value="علوم تجربی">علوم تجربی</option>
                  <option value="ریاضی و فیزیک">ریاضی و فیزیک</option>
                  <option value="ادبیات و علوم انسانی">ادبیات و علوم انسانی</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg cursor-pointer"
              >
                {savingProfile ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
