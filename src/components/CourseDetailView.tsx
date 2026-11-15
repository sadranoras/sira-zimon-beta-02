import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Download,
  ExternalLink,
  FileText,
  Film,
  Lock,
  PlayCircle,
  Radio,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GENERATED_IMAGES } from '../data/seedData';
import type { CourseLesson } from '../types';
import { formatIranScheduleRange, formatToman, toPersianDigits } from '../utils/formatters';
import { downloadOfflineLessonBooklet, resolveLessonVideoSource } from '../utils/media';
import { ResilientImage } from './ResilientImage';

export const CourseDetailView: React.FC = () => {
  const {
    courses,
    liveClasses,
    selectedCourseId,
    setView,
    openLiveClass,
    fetchCourseLessons,
    isEnrolledInCourse,
    enrollments,
    toggleLessonComplete,
    addToCart,
    hasDiamondAccess,
    isAdmin,
    notify,
  } = useApp();

  const course = courses.find((c) => c.id === selectedCourseId) ?? courses[0];
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [activeLesson, setActiveLesson] = useState<CourseLesson | null>(null);

  useEffect(() => {
    if (!course) return;
    let mounted = true;
    setLoadingLessons(true);
    fetchCourseLessons(course.id).then((list) => {
      if (!mounted) return;
      setLessons(list);
      setActiveLesson(list[0] ?? null);
      setLoadingLessons(false);
    });
    return () => {
      mounted = false;
    };
  }, [course, fetchCourseLessons]);

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-lg font-bold text-slate-900 dark:text-white">دوره مورد نظر یافت نشد</p>
        <button
          type="button"
          onClick={() => setView('courses')}
          className="px-5 py-2.5 bg-emerald-700 text-white rounded-lg text-sm font-semibold cursor-pointer"
        >
          بازگشت به لیست دوره‌ها
        </button>
      </div>
    );
  }

  const enrolled = isEnrolledInCourse(course.id);
  const enrollment = enrollments.find((e) => e.courseId === course.id);
  const completedIds = enrollment?.completedLessonIds ?? [];
  const finalPrice = course.discountPrice ?? course.price;
  const canViewLesson = (lesson: CourseLesson) => enrolled || lesson.isFreePreview;
  const courseLiveClasses = liveClasses.filter((lc) => lc.courseId === course.id);
  const primaryLiveClass =
    courseLiveClasses.find((lc) => lc.status === 'live') ?? courseLiveClasses[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setView('courses')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به همه دوره‌ها</span>
        </button>

        {primaryLiveClass && (
          <button
            type="button"
            onClick={() => openLiveClass(primaryLiveClass.id)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            <Radio className="w-4 h-4" />
            <span>
              {primaryLiveClass.status === 'live'
                ? 'ورود به کلاس آنلاین در حال پخش'
                : 'ورود به کلاس آنلاین این دوره'}
            </span>
          </button>
        )}
      </div>

      {courseLiveClasses.length > 0 && (
        <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>کلاس‌های آنلاین متصل به این دوره ({toPersianDigits(courseLiveClasses.length)})</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {courseLiveClasses.map((lc) => (
              <div
                key={lc.id}
                className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {lc.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {formatIranScheduleRange(lc.startTimeIso, lc.endTimeIso) || lc.scheduledLabel} ·{' '}
                    {lc.isFree ? 'عمومی' : 'اختصاصی ثبت‌نام‌شدگان'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openLiveClass(lc.id)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
                >
                  ورود
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Header Split */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{course.category}</span>
              <span aria-hidden="true">·</span>
              <span>مقطع {course.grade}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{toPersianDigits(course.sessionsCount)} جلسه</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {toPersianDigits(course.durationHours)} ساعت آموزش
              </span>
              {course.isDiamondIncluded && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    مشمول اشتراک الماس
                  </span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-snug">
              {course.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {course.description}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                <ResilientImage
                  src={GENERATED_IMAGES.instructorPortrait}
                  alt={course.instructor}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {course.instructor}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {course.instructorTitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {enrolled ? (
                <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  {hasDiamondAccess && course.isDiamondIncluded
                    ? 'فعال از طریق اشتراک الماس'
                    : 'ثبت‌نام شما در این دوره فعال است'}
                </div>
              ) : (
                <>
                  <div className="text-left">
                    {course.discountPrice !== undefined && course.discountPrice < course.price && (
                      <p className="text-xs text-slate-400 line-through tabular-nums">
                        {formatToman(course.price)}
                      </p>
                    )}
                    <p className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                      {formatToman(finalPrice)}
                    </p>
                  </div>
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
                    className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                  >
                    ثبت‌نام در دوره
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="w-full h-full min-h-[240px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
            <ResilientImage
              src={course.imageUrl}
              alt={course.title}
              className="w-full h-full object-cover"
              fallbackTitle={course.title}
            />
          </div>
        </div>
      </div>

      {/* Lessons Workspace: Syllabus List + Interactive Lesson Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Syllabus Sidebar */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">سرفصل جلسات دوره</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {toPersianDigits(lessons.length)} جلسه بارگذاری‌شده
            </span>
          </div>

          {loadingLessons ? (
            <div className="p-6 space-y-3">
              <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
              <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
            </div>
          ) : lessons.length === 0 ? (
            <div className="p-6 text-sm text-slate-500 dark:text-slate-400 text-center">
              هنوز جلسه‌ای برای این دوره ثبت نشده است.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {lessons.map((lesson) => {
                const isSelected = activeLesson?.id === lesson.id;
                const unlocked = canViewLesson(lesson);
                const done = completedIds.includes(lesson.id);
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => setActiveLesson(lesson)}
                    className={`w-full text-right p-4 transition-colors flex items-start justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="mt-0.5 text-emerald-700 dark:text-emerald-400 shrink-0">
                        {unlocked ? (
                          done ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <PlayCircle className="w-4 h-4" />
                          )
                        ) : (
                          <Lock className="w-4 h-4 text-slate-400" />
                        )}
                      </span>
                      <div className="space-y-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                          {lesson.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          {toPersianDigits(lesson.durationMinutes)} دقیقه
                          {lesson.isFreePreview ? ' · پیش‌نمایش رایگان' : ''}
                          {lesson.videoUrl ? ' · ویدیو آفلاین' : ''}
                          {lesson.bookletUrl || lesson.bookletTitle ? ' · جزوه' : ''}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Lesson Content Viewer */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          {activeLesson ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="space-y-1">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                    جلسه {toPersianDigits(activeLesson.order)} ·{' '}
                    {toPersianDigits(activeLesson.durationMinutes)} دقیقه
                  </p>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {activeLesson.title}
                  </h2>
                </div>

                {enrolled && (
                  <button
                    type="button"
                    onClick={() => toggleLessonComplete(course.id, course.title, activeLesson.id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border cursor-pointer whitespace-nowrap shrink-0 ${
                      completedIds.includes(activeLesson.id)
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-800 dark:text-emerald-300'
                        : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-emerald-600'
                    }`}
                  >
                    {completedIds.includes(activeLesson.id) ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تکمیل شده</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4" />
                        <span>علامت‌گذاری به عنوان دیده‌شده</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {canViewLesson(activeLesson) ? (
                (() => {
                  const videoSource = resolveLessonVideoSource(activeLesson.videoUrl);
                  const resolvedBookletTitle =
                    activeLesson.bookletTitle?.trim() ||
                    `جزوه نکات خط‌به‌خط ${activeLesson.title}`;

                  return (
                    <div className="space-y-6">
                      {/* Offline Recorded Video Player Stage */}
                      {videoSource ? (
                        <div className="space-y-3">
                          <div className="rounded-xl overflow-hidden border border-slate-800 bg-black">
                            {videoSource.kind === 'native' ? (
                              <video
                                key={videoSource.src}
                                src={videoSource.src}
                                controls
                                playsInline
                                preload="metadata"
                                className="w-full aspect-video bg-black"
                              />
                            ) : videoSource.kind === 'iframe' ? (
                              <iframe
                                key={videoSource.src}
                                src={videoSource.src}
                                title={activeLesson.title}
                                className="w-full aspect-video border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                allowFullScreen
                              />
                            ) : (
                              <div className="p-8 text-center text-white space-y-3">
                                <Film className="w-8 h-8 text-emerald-400 mx-auto" />
                                <p className="text-sm font-bold">{activeLesson.videoTopic}</p>
                                <a
                                  href={videoSource.originalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  <span>پخش ویدیوی ضبط‌شده جلسه</span>
                                </a>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span>
                              محور تدریس: <strong className="text-slate-800 dark:text-slate-200">{activeLesson.videoTopic}</strong>
                            </span>
                            <a
                              href={videoSource.originalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold hover:underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>باز کردن لینک ویدیو در پنجره مجزا</span>
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800 text-white rounded-xl p-6 sm:p-8 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs text-emerald-400 font-semibold">محور تدریس ویدیویی جلسه</p>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => setView('admin-panel')}
                                className="text-xs font-semibold text-emerald-300 hover:text-emerald-200 underline cursor-pointer"
                              >
                                افزودن لینک ویدیو از پنل مدیریت
                              </button>
                            )}
                          </div>
                          <p className="text-base sm:text-lg font-bold leading-relaxed">
                            {activeLesson.videoTopic}
                          </p>
                          <p className="text-xs text-slate-400">
                            ارائه‌شده توسط {course.instructor} — ویدیوی ضبط‌شده پس از بارگذاری لینک در این بخش پخش می‌شود و جزوه خلاصه جلسه در ادامه آماده دانلود است.
                          </p>
                        </div>
                      )}

                      {/* Offline Session Booklet & PDF Download Card */}
                      <div className="p-5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-emerald-700 dark:bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="space-y-1 min-w-0">
                            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                              جزوه آفلاین و فایل کمک‌آموزشی جلسه {toPersianDigits(activeLesson.order)}
                            </p>
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                              {resolvedBookletTitle}
                            </h3>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                          {activeLesson.bookletUrl && (
                            <>
                              <a
                                href={activeLesson.bookletUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>مشاهده فایل PDF جزوه</span>
                              </a>
                              <a
                                href={activeLesson.bookletUrl}
                                download={`${resolvedBookletTitle}.pdf`}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>دانلود مستقیم PDF</span>
                              </a>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              downloadOfflineLessonBooklet({
                                courseTitle: course.title,
                                instructor: course.instructor,
                                lessonOrder: activeLesson.order,
                                lessonTitle: activeLesson.title,
                                bookletTitle: resolvedBookletTitle,
                                videoTopic: activeLesson.videoTopic,
                                keyPoints: activeLesson.keyPoints,
                              });
                              notify('فایل جزوه آفلاین این جلسه دانلود شد.', 'success');
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-900 border border-emerald-700 dark:border-emerald-600 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/60 text-xs font-semibold rounded-lg cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>دانلود جزوه خلاصه جلسه</span>
                          </button>
                        </div>
                      </div>

                      {/* Lesson Study Key Points */}
                      <div className="space-y-3">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          نکات کلیدی و خط‌به‌خط این جلسه
                        </h3>
                        <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 leading-loose whitespace-pre-line">
                          {activeLesson.keyPoints}
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="py-12 px-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-4">
                  <Lock className="w-8 h-8 text-slate-400 mx-auto" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    محتوای این جلسه ویژه دانش‌آموزان ثبت‌نام‌شده است
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    برای دسترسی به تدریس کامل و جزوه نکات ترکیبی این جلسه، می‌توانید در این دوره ثبت‌نام کنید یا اشتراک جامع الماس را تهیه نمایید.
                  </p>
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
                    className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-lg cursor-pointer"
                  >
                    افزودن دوره به سبد خرید ({formatToman(finalPrice)})
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              یک جلسه را از لیست سرفصل‌ها انتخاب کنید.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

