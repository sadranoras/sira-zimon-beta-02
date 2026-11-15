import React, { useState } from 'react';
import { Trash2, X, ShoppingBag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatToman, toPersianDigits } from '../utils/formatters';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    checkoutCart,
    user,
  } = useApp();
  const [submitting, setSubmitting] = useState(false);

  if (!isCartOpen) return null;

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = async () => {
    setSubmitting(true);
    try {
      await checkoutCart();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 dark:bg-slate-950/75 backdrop-blur-[2px] no-print">
      <div
        className="fixed inset-0"
        onClick={() => setIsCartOpen(false)}
        aria-hidden="true"
      />
      <aside className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 h-full border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xl">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              سبد خرید ({toPersianDigits(cart.length)})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            aria-label="بستن سبد خرید"
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <p className="text-base font-semibold text-slate-800 dark:text-slate-100">سبد خرید شما خالی است</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                می‌توانید دوره‌های سالیانه، بسته‌های آزمون، جزوات یا اشتراک جامع الماس را انتخاب کنید.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/60 flex items-start justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.type === 'diamond'
                      ? 'اشتراک جامع'
                      : item.type === 'course'
                        ? 'دوره آموزشی'
                        : 'جزوه و بانک تست'}
                  </p>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{item.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{item.subtitle}</p>
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 tabular-nums pt-1">
                    {formatToman(item.price)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.id)}
                  aria-label="حذف از سبد خرید"
                  className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">مبلغ قابل پرداخت</span>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white tabular-nums">
                {formatToman(total)}
              </span>
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={handleCheckout}
              className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer"
            >
              {submitting
                ? 'در حال ثبت سفارش...'
                : user
                  ? 'تکمیل ثبت‌نام و فعال‌سازی آنی'
                  : 'ورود با گوگل و تکمیل ثبت‌نام'}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};
