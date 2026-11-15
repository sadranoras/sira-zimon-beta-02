import React, { useMemo, useState } from 'react';
import { BookOpen, Printer, Search, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Booklet, BookletCategory } from '../types';
import { formatToman, toPersianDigits } from '../utils/formatters';

const CATEGORIES: ('همه' | BookletCategory)[] = [
  'همه',
  'جزوه کلاسی',
  'نکات ترکیبی',
  'بانک تست',
  'برنامه راهبردی',
];

export const BookletsView: React.FC = () => {
  const { booklets, addToCart, hasDiamondAccess, orders } = useApp();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'همه' | BookletCategory>('همه');
  const [readingBooklet, setReadingBooklet] = useState<Booklet | null>(null);

  const purchasedIds = useMemo(() => {
    const ids = new Set<string>();
    orders.forEach((o) => {
      if (o.status === 'paid') o.itemIds.forEach((id) => ids.add(id));
    });
    return ids;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return booklets.filter((b) => {
      if (category !== 'همه' && b.category !== category) return false;
      if (
        q &&
        !b.title.toLowerCase().includes(q) &&
        !b.subject.toLowerCase().includes(q) &&
        !b.description.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [booklets, search, category]);

  const canAccess = (b: Booklet) => b.isFree || hasDiamondAccess || purchasedIds.has(b.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6 space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          بانک جزوات، نکات ترکیبی و برنامه راهبردی
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          جزوات رنگی کلاسی، خلاصه شکل‌های کتاب درسی و دفترچه‌های برنامه راهبردی آزمون‌های ماز
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی جزوه یا مبحث..."
            className="w-full pr-10 pl-4 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600"
          />
        </div>
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                category === c
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((booklet) => {
          const unlocked = canAccess(booklet);
          return (
            <article
              key={booklet.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{booklet.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{booklet.grade}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{toPersianDigits(booklet.pagesCount)} صفحه</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular">{booklet.fileSizeLabel}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {booklet.title}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {booklet.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
                  {booklet.isFree ? 'رایگان' : formatToman(booklet.price)}
                </span>

                {unlocked ? (
                  <button
                    type="button"
                    onClick={() => setReadingBooklet(booklet)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>مطالعه آنلاین و چاپ</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      addToCart({
                        id: booklet.id,
                        type: 'booklet',
                        title: booklet.title,
                        subtitle: `${booklet.category} · ${booklet.grade}`,
                        price: booklet.price,
                      })
                    }
                    className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                  >
                    افزودن به سبد خرید
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Booklet Online Reader Modal */}
      {readingBooklet && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 no-print">
              <div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                  {readingBooklet.category} · {readingBooklet.grade}
                </p>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {readingBooklet.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>چاپ / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReadingBooklet(null)}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {readingBooklet.description}
              </p>
              <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 leading-loose whitespace-pre-line">
                {readingBooklet.summaryContent}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

