import React from 'react';
import { ArrowLeft, Check, Radio, ShoppingBag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DIAMOND_PACKAGE, GENERATED_IMAGES } from '../data/seedData';
import { formatToman, toPersianDigits } from '../utils/formatters';
import { ResilientImage } from './ResilientImage';

export const HomeView: React.FC = () => {
  const {
    courses,
    exams,
    articles,
    liveClasses,
    setView,
    openCourseDetail,
    openLiveClass,
    startExamRunner,
    addToCart,
    cart,
    setIsCartOpen,
    hasDiamondAccess,
    isAdmin,
  } = useApp();

  const featuredCourses = courses.slice(0, 3);
  const activeExams = exams.filter((e) => e.isActive).slice(0, 4);
  const topArticles = articles.slice(0, 3);
  const activeLiveClass = liveClasses.find((c) => c.status === 'live') ?? liveClasses[0];

  return (
    <div className="space-y-20 pb-20">
      {/* Contextual Storefront Utility Strip */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span>سال تحصیلی ۱۴۰۶–۱۴۰۵</span>
            <span aria-hidden="true">·</span>
            <span>پوشش کامل کنکور تجربی و امتحانات نهایی</span>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setView('admin-panel')}
                className="font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 cursor-pointer whitespace-nowrap shrink-0"
              >
                ورود به پنل مدیریت
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="inline-flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>سبد خرید ({toPersianDigits(cart.length)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Split Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6 py-4">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              آکادمی تخصصی زیست‌شناسی و آزمون‌های آزمایشی کنکور
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-[3.1rem] font-extrabold text-slate-900 dark:text-white leading-[1.2] tracking-tight max-w-2xl">
              مسیر تسلط کامل بر زیست‌شناسی کنکور و امتحانات نهایی
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              کلاس‌های آنلاین سالیانه، همایش‌های جمع‌بندی CPR، شبیه‌ساز آزمون‌های آزمایشی با کارنامه تراز و رتبه واقعی و بانک جزوات خط‌به‌خط کتاب درسی در یک پلتفرم یکپارچه.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() =>
                  hasDiamondAccess
                    ? setView('courses')
                    : addToCart({
                        id: DIAMOND_PACKAGE.id,
                        type: 'diamond',
                        title: DIAMOND_PACKAGE.title,
                        subtitle: DIAMOND_PACKAGE.subtitle,
                        price: DIAMOND_PACKAGE.price,
                      })
                }
                className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {hasDiamondAccess ? 'مشاهده دوره‌های اشتراک الماس' : 'دریافت اشتراک جامع الماس'}
              </button>
              <button
                type="button"
                onClick={() => setView('exams')}
                className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-400 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>شرکت در آزمون آنلاین</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="w-full h-full min-h-[300px] lg:min-h-[420px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <ResilientImage
                src={GENERATED_IMAGES.heroLab}
                alt="آزمایشگاه تخصصی آموزش زیست‌شناسی زیست‌ماز"
                className="w-full h-full object-cover"
                fallbackTitle="آزمایشگاه تخصصی زیست‌ماز"
              />
            </div>
          </div>
        </div>

        {/* 4-Column KPI Strip directly below Hero */}
        <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-200 dark:divide-slate-800">
          <div className="p-6 space-y-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {toPersianDigits('18,400+')}
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              جامعه آماری داوطلبان در هر مرحله آزمون
            </p>
          </div>
          <div className="p-6 space-y-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {toPersianDigits('24')} مرحله
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              آزمون استاندارد مطابق برنامه راهبردی
            </p>
          </div>
          <div className="p-6 space-y-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {toPersianDigits('340')} ساعت
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              تدریس خط‌به‌خط، شکل‌خوانی و جمع‌بندی CPR
            </p>
          </div>
          <div className="p-6 space-y-1">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {toPersianDigits('100%')}
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              پوشش مفاهیم کنکور سراسری و امتحان نهایی
            </p>
          </div>
        </div>

        {/* Live Classroom Banner */}
        {activeLiveClass && (
          <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Radio className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  {activeLiveClass.status === 'live'
                    ? 'کلاس آنلاین هم‌اکنون در حال برگزاری است'
                    : 'جلسه بعدی کلاس آنلاین'}
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {activeLiveClass.title} — {activeLiveClass.instructorName} ({activeLiveClass.scheduledLabel})
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openLiveClass(activeLiveClass.id)}
              className="px-4 py-2 bg-slate-900 dark:bg-emerald-700 hover:bg-slate-800 dark:hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap shrink-0"
            >
              ورود به تالار کلاس آنلاین
            </button>
          </div>
        )}
      </section>

      {/* Diamond Subscription Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 dark:bg-slate-900 border border-slate-800 text-white rounded-2xl p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-5">
            <p className="text-xs font-semibold text-emerald-400">
              طرح جامع سالیانه · پرفروش‌ترین پکیج داوطلبان تجربی
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold leading-snug">
              {DIAMOND_PACKAGE.title}
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              با تهیه اشتراک الماس به جای ثبت‌نام جداگانه در هر دوره و آزمون، تمامی کلاس‌های سالیانه، نکته و تست، همایش جمع‌بندی CPR، امتحانات نهایی و کل ۲۴ مرحله آزمون آزمایشی یکجا برای شما فعال می‌شود.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-sm text-slate-200">
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>تمام کلاس‌های سالیانه دهم، یازدهم و دوازدهم</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>۲۴ مرحله آزمون آزمایشی با کارنامه تراز و رتبه</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>همایش‌های جمع‌بندی CPR و ۲۰ امتحان نهایی</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>دسترسی نامحدود به بانک جزوات و پاسخ‌نامه تشریحی</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700 rounded-xl p-6 sm:p-8 space-y-5">
            <div className="space-y-1">
              <p className="text-xs text-slate-400">مجموع ارزش دوره‌ها و آزمون‌ها به صورت تکی</p>
              <p className="text-base text-slate-400 line-through tabular-nums">
                {formatToman(DIAMOND_PACKAGE.originalPrice)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-emerald-400 font-medium">هزینه اشتراک جامع یک‌ساله الماس</p>
              <p className="text-3xl font-extrabold text-white tabular-nums">
                {formatToman(DIAMOND_PACKAGE.price)}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                hasDiamondAccess
                  ? setView('student-panel')
                  : addToCart({
                      id: DIAMOND_PACKAGE.id,
                      type: 'diamond',
                      title: DIAMOND_PACKAGE.title,
                      subtitle: DIAMOND_PACKAGE.subtitle,
                      price: DIAMOND_PACKAGE.price,
                    })
              }
              className="w-full py-3.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer"
            >
              {hasDiamondAccess ? 'اشتراک الماس شما فعال است' : 'افزودن اشتراک الماس به سبد خرید'}
            </button>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              دوره‌های آموزشی برگزیده
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              تدریس مفهومی و ترکیبی توسط رتبه‌های برتر و مولفان مرجع زیست‌شناسی و علوم تجربی
            </p>
          </div>
          <button
            type="button"
            onClick={() => setView('courses')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>مشاهده همه دوره‌ها</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredCourses.map((course) => {
            const finalPrice = course.discountPrice ?? course.price;
            return (
              <article
                key={course.id}
                onClick={() => openCourseDetail(course.id)}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-600/50 transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div>
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
                      <span className="tabular-nums">{toPersianDigits(course.durationHours)} ساعت</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {course.subtitle}
                    </p>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/40 dark:bg-slate-950/50">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                      <ResilientImage
                        src={GENERATED_IMAGES.instructorPortrait}
                        alt={course.instructor}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                      {course.instructor}
                    </span>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
                      {formatToman(finalPrice)}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Active Mock Exams Table */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              آزمون‌های آزمایشی فعال و شبیه‌ساز کنکور
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              همگام با برنامه راهبردی به همراه محاسبه آنی درصد، تراز، رتبه و پاسخ‌نامه تشریحی
            </p>
          </div>
          <button
            type="button"
            onClick={() => setView('exams')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>آرشیو آزمون‌ها</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <th className="py-3.5 px-5">عنوان آزمون</th>
                  <th className="py-3.5 px-4">کد</th>
                  <th className="py-3.5 px-4">مقطع / درس</th>
                  <th className="py-3.5 px-4">زمان و سوالات</th>
                  <th className="py-3.5 px-4">سطح</th>
                  <th className="py-3.5 px-5 text-left">اقدام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {activeExams.map((exam) => (
                  <tr
                    key={exam.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-4 px-5">
                      <p className="font-bold text-slate-900 dark:text-white">{exam.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {exam.strategyWeek}
                      </p>
                    </td>
                    <td className="py-4 px-4 font-mono-tabular text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {exam.code}
                    </td>
                    <td className="py-4 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {exam.grade} · {exam.subject}
                    </td>
                    <td className="py-4 px-4 text-slate-700 dark:text-slate-300 tabular-nums whitespace-nowrap">
                      {toPersianDigits(exam.durationMinutes)} دقیقه ·{' '}
                      {toPersianDigits(exam.totalQuestions)} سوال
                    </td>
                    <td className="py-4 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {exam.difficulty}
                    </td>
                    <td className="py-4 px-5 text-left whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => startExamRunner(exam.id)}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        شروع آزمون
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Study Guides & Articles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              مقالات روش مطالعه و مشاوره زیست‌شناسی
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              راهنمای علمی مطالعه کتاب درسی، تحلیل شکل‌ها و مدیریت زمان در جلسه آزمون
            </p>
          </div>
          <button
            type="button"
            onClick={() => setView('articles')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>همه مقالات</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topArticles.map((article) => (
            <article
              key={article.id}
              onClick={() => setView('articles')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-emerald-600/50 transition-colors cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{article.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{article.publishedDate}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    {toPersianDigits(article.readMinutes)} دقیقه مطالعه
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {article.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                  {article.excerpt}
                </p>
              </div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                نویسنده: {article.author}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

