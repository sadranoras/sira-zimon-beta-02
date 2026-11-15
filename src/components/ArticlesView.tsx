import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Article } from '../types';
import { toPersianDigits } from '../utils/formatters';

export const ArticlesView: React.FC = () => {
  const { articles } = useApp();
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);

  if (activeArticle) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <button
          type="button"
          onClick={() => setActiveArticle(null)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به فهرست مقالات</span>
        </button>

        <article className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 space-y-6">
          <div className="space-y-3 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{activeArticle.category}</span>
              <span aria-hidden="true">·</span>
              <span>{activeArticle.publishedDate}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {toPersianDigits(activeArticle.readMinutes)} دقیقه مطالعه
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-snug">
              {activeArticle.title}
            </h1>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              نویسنده: {activeArticle.author}
            </p>
          </div>

          <div className="text-base text-slate-800 dark:text-slate-200 leading-[2] whitespace-pre-line">
            {activeArticle.content}
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6 space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          مقالات آموزشی و روش مطالعه زیست‌شناسی
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          تحلیل کنکورهای اخیر، تکنیک‌های تست‌زنی ترکیبی و برنامه‌ریزی مطالعاتی ماز
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <article
            key={article.id}
            onClick={() => setActiveArticle(article)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-emerald-600/50 transition-colors cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{article.category}</span>
                <span aria-hidden="true">·</span>
                <span>{article.publishedDate}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {toPersianDigits(article.readMinutes)} دقیقه
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {article.title}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {article.excerpt}
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">{article.author}</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                مطالعه کامل
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

