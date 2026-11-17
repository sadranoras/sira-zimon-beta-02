import React, { useState } from 'react';
import { ExternalLink, Eye, EyeOff, Lock, Phone, User, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import firebaseConfig from '../../firebase-applet-config.json';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    signInWithGoogle,
    signInWithPhonePassword,
    registerWithPhonePassword,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorCode, setErrorCode] = useState('');

  if (!isAuthModalOpen) return null;

  const firebaseProvidersUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setErrorCode('');
    setSubmitting(true);
    try {
      const res =
        mode === 'login'
          ? await signInWithPhonePassword(phone, password)
          : await registerWithPhonePassword(displayName, phone, password);
      if (!res.ok && res.error) {
        setErrorMsg(res.error);
        setErrorCode(res.errorCode || '');
      } else {
        setDisplayName('');
        setPhone('');
        setPassword('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-xs p-4"
      onClick={() => setIsAuthModalOpen(false)}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              ورود یا ثبت‌نام در زیست‌ماز
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ورود با شماره موبایل و رمز عبور یا حساب گوگل
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(false)}
            aria-label="بستن پنجره ورود"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Login / Register Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
                setErrorCode('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              ورود با شماره تلفن
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg('');
                setErrorCode('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              ثبت‌نام با شماره تلفن
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  نام و نام خانوادگی
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="مثلاً: سارا محمدی"
                    className="w-full pr-9 pl-3 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                شماره موبایل
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  required
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09123456789"
                  className="w-full pr-9 pl-3 py-2.5 text-sm text-left border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 tabular-nums"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                رمز عبور
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  dir="ltr"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="حداقل ۶ کاراکتر"
                  className="w-full pr-9 pl-10 py-2.5 text-sm text-left border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 leading-relaxed space-y-2.5">
                <p>{errorMsg}</p>
                {errorCode === 'auth/operation-not-allowed' && (
                  <div className="pt-2 border-t border-rose-200 dark:border-rose-800/80 space-y-2 text-slate-700 dark:text-slate-300">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      راهنمای فعال‌سازی در کمتر از ۳۰ ثانیه:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px]">
                      <li>دکمه زیر را بزنید تا صفحه Sign-in method پروژه باز شود.</li>
                      <li>روی <strong>Add new provider</strong> (یا Email/Password) کلیک کنید.</li>
                      <li>گزینه اول (<strong>Email/Password</strong>) را Enable و سپس <strong>Save</strong> کنید.</li>
                    </ol>
                    <a
                      href={firebaseProvidersUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>باز کردن تنظیمات Sign-in method در کنسول فایربیس</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-sm font-bold rounded-xl cursor-pointer transition-colors"
            >
              {submitting
                ? 'در حال بررسی...'
                : mode === 'login'
                  ? 'ورود با شماره تلفن و رمز عبور'
                  : 'ساخت حساب کاربری و ورود'}
            </button>
          </form>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="px-3 bg-white dark:bg-slate-900 text-xs text-slate-400 shrink-0">
              یا
            </span>
          </div>

          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="w-full py-2.5 px-4 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-semibold rounded-xl cursor-pointer transition-colors"
          >
            ورود سریع با حساب گوگل (Google)
          </button>
        </div>
      </div>
    </div>
  );
};
