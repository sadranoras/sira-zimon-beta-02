import React, { useMemo, useState } from 'react';
import { Radio, Search, ShoppingBag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GENERATED_IMAGES } from '../data/seedData';
import type { CourseCategory, GradeLevel } from '../types';
import { formatToman, toPersianDigits } from '../utils/formatters';
import { ResilientImage } from './ResilientImage';

const GRADES: ('همه' | GradeLevel)[] = ['همه', 'دهم', 'یازدهم', 'دوازدهم', 'جامع کنکور'];
const CATEGORIES: ('همه' | CourseCategory)[] = [
  'همه',
  'زیست‌شناسی',
  'جمع‌بندی CPR',
  'شیمی',
  'فیزیک',
  'ریاضی',
];

export const CoursesView: React.FC = () => {
  const {
    courses,
    openCourseDetail,
    openLiveClass,
    addToCart,
    cart,
    setIsCartOpen,
    isEnrolledInCourse,
  } = useApp();

  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'همه' | GradeLevel>('همه');
  const [categoryFilter, setCategoryFilter] = useState<'همه' | CourseCategory>('همه');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter((c) => {
      if (gradeFilter !== 'همه' && c.grade !== gradeFilter) return false;
      if (categoryFilter !== 'همه' && c.category !== categoryFilter) return false;
      if (
        q &&
        !c.title.toLowerCase().includes(q) &&
        !c.instructor.toLowerCase().includes(q) &&
        !c.subtitle.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [courses, search, gradeFilter, categoryFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            دوره‌ها و کلاس‌های آنلاین
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            کلاس‌های سالیانه، نکته و تست، جمع‌بندی CPR و آمادگی امتحانات نهایی
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => openLiveClass()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-sm font-semibold text-white rounded-lg cursor-pointer whitespace-nowrap shrink-0"
          >
            <Radio className="w-4 h-4" />
            <span>ورود به کلاس آنلاین</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-emerald-600 text-sm font-semibold text-slate-800 dark:text-slate-100 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>سبد خرید ({toPersianDigits(cart.length)})</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجوی نام دوره یا استاد..."
              className="w-full pr-10 pl-4 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-lg overflow-x-auto">
            {GRADES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGradeFilter(g)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  gradeFilter === g
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-2">
            دسته‌بندی درس:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <p className="text-base font-bold text-slate-800 dark:text-white">
            دوره‌ای با این مشخصات یافت نشد
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setGradeFilter('همه');
              setCategoryFilter('همه');
            }}
            className="px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-600 rounded-lg cursor-pointer"
          >
            پاک کردن فیلترها
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course) => {
            const enrolled = isEnrolledInCourse(course.id);
            const finalPrice = course.discountPrice ?? course.price;
            return (
              <article
                key={course.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between"
              >
                <div onClick={() => openCourseDetail(course.id)} className="cursor-pointer group">
                  <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden border-b border-slate-100 dark:border-slate-800">
                    <ResilientImage
                      src={course.imageUrl}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                      fallbackTitle={course.title}
                    />
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{course.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{course.grade}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{toPersianDigits(course.sessionsCount)} جلسه</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {course.title}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {course.subtitle}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                        <ResilientImage
                          src={GENERATED_IMAGES.instructorPortrait}
                          alt={course.instructor}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {course.instructor}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between gap-3">
                  <div>
                    {course.discountPrice !== undefined && course.discountPrice < course.price && (
                      <p className="text-xs text-slate-400 line-through tabular-nums">
                        {formatToman(course.price)}
                      </p>
                    )}
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
                      {formatToman(finalPrice)}
                    </p>
                  </div>

                  {enrolled ? (
                    <button
                      type="button"
                      onClick={() => openCourseDetail(course.id)}
                      className="px-4 py-2 bg-slate-900 dark:bg-emerald-700 hover:bg-slate-800 dark:hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                    >
                      ورود به کلاس
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        addToCart({
                          id: course.id,
                          type: 'course',
                          title: course.title,
                          subtitle: `${course.instructor} · ${course.grade}`,
                          price: finalPrice,
                        })
                      }
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                    >
                      افزودن به سبد
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

