import React, { useState } from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { AppView } from '../types';
import { toPersianDigits } from '../utils/formatters';

export const Navbar: React.FC = () => {
  const {
    view,
    setView,
    user,
    isAdmin,
    theme,
    toggleTheme,
    unreadNotificationsCount,
    signInWithGoogle,
  } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: { label: string; target: AppView }[] = [
    { label: 'صفحه اصلی', target: 'home' },
    { label: 'دوره‌ها', target: 'courses' },
    { label: 'کلاس آنلاین', target: 'live-classroom' },
    { label: 'آزمون‌ها', target: 'exams' },
    { label: 'جزوات', target: 'booklets' },
    { label: 'مقالات', target: 'articles' },
  ];

  const handleNav = (target: AppView) => {
    setView(target);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrimaryCta = () => {
    setMobileMenuOpen(false);
    if (!user) {
      void signInWithGoogle();
    } else if (isAdmin) {
      setView('admin-panel');
    } else {
      setView('student-panel');
    }
  };

  const ctaLabel = !user
    ? 'ورود به پنل'
    : isAdmin
      ? 'پنل مدیریت'
      : unreadNotificationsCount > 0
        ? `پنل کاربری (${toPersianDigits(unreadNotificationsCount)})`
        : 'پنل کاربری';

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 no-print transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-600 rounded"
        >
          زیست‌ماز
        </button>

        {/* Zone 2: 6 concise single-line text nav links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          {navLinks.map((item) => {
            const isActive =
              view === item.target ||
              (item.target === 'courses' && view === 'course-detail') ||
              (item.target === 'exams' && (view === 'exam-runner' || view === 'report-card'));
            return (
              <button
                key={item.target}
                type="button"
                onClick={() => handleNav(item.target)}
                className={`py-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors border-b-2 ${
                  isActive
                    ? 'text-emerald-700 dark:text-emerald-400 border-emerald-600 dark:border-emerald-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 border-transparent hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Theme Toggle + Primary Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'}
            title={theme === 'dark' ? 'حالت روشن' : 'حالت تاریک'}
            className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-emerald-600 dark:hover:border-emerald-500 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          <button
            type="button"
            onClick={handlePrimaryCta}
            className="hidden md:inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums"
          >
            {ctaLabel}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="منوی ناوبری"
            className="lg:hidden p-2.5 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4 space-y-2">
          {navLinks.map((item) => (
            <button
              key={item.target}
              type="button"
              onClick={() => handleNav(item.target)}
              className={`block w-full text-right px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${
                view === item.target
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <button
              type="button"
              onClick={handlePrimaryCta}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-emerald-700 dark:bg-emerald-600 rounded-lg cursor-pointer"
            >
              {ctaLabel}
            </button>
            {user && isAdmin && (
              <button
                type="button"
                onClick={() => handleNav('student-panel')}
                className="w-full py-2 px-4 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer"
              >
                مشاهده پنل دانش‌آموزی
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

