import React from 'react';
import { useApp } from '../context/AppContext';

export const Footer: React.FC = () => {
  const { setView, isAdmin } = useApp();

  const go = (
    target:
      | 'home'
      | 'courses'
      | 'live-classroom'
      | 'exams'
      | 'booklets'
      | 'articles'
      | 'student-panel'
      | 'admin-panel'
  ) => {
    setView(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-16 no-print transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 space-y-3">
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">زیست‌ماز</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">
            پلتفرم جامع آموزش آنلاین زیست‌شناسی و دروس تخصصی کنکور تجربی، برگزارکننده آزمون‌های آزمایشی استاندارد مطابق برنامه راهبردی به همراه کارنامه تراز و پاسخ‌نامه تشریحی.
          </p>
        </div>

        <div className="md:col-span-3 space-y-3">
          <p className="text-xs font-bold text-slate-900 dark:text-white">بخش‌های آموزشی</p>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li>
              <button type="button" onClick={() => go('courses')} className="hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer">
                دوره‌ها و کلاس‌های آنلاین
              </button>
            </li>
            <li>
              <button type="button" onClick={() => go('live-classroom')} className="hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer">
                اتاق برگزاری کلاس زنده
              </button>
            </li>
            <li>
              <button type="button" onClick={() => go('exams')} className="hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer">
                آزمون‌های آزمایشی کنکور
              </button>
            </li>
            <li>
              <button type="button" onClick={() => go('booklets')} className="hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer">
                بانک جزوات و برنامه راهبردی
              </button>
            </li>
            <li>
              <button type="button" onClick={() => go('articles')} className="hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer">
                مقالات روش مطالعه
              </button>
            </li>
          </ul>
        </div>

        <div className="md:col-span-4 space-y-3">
          <p className="text-xs font-bold text-slate-900 dark:text-white">حساب کاربری و پشتیبانی</p>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li>
              <button type="button" onClick={() => go('student-panel')} className="hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer">
                پنل کاربری دانش‌آموزان
              </button>
            </li>
            {isAdmin && (
              <li>
                <button type="button" onClick={() => go('admin-panel')} className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline cursor-pointer">
                  ورود به پنل مدیریت
                </button>
              </li>
            )}
            <li className="text-xs text-slate-500 dark:text-slate-400 pt-1">
              ساعات پاسخ‌گویی پشتیبانی آموزشی: شنبه تا پنج‌شنبه ۹ تا ۱۹
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 py-5 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span>تمامی حقوق مادی و معنوی محتوای آموزشی برای آکادمی زیست‌ماز محفوظ است.</span>
        <span>پلتفرم آموزش زیست‌شناسی و آزمون‌های آزمایشی</span>
      </div>
    </footer>
  );
};
