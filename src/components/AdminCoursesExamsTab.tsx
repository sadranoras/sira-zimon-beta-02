import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Edit3, FileText, Film, Plus, Trash2, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GENERATED_IMAGES } from '../data/seedData';
import type {
  Course,
  CourseCategory,
  CourseLesson,
  Exam,
  ExamDifficulty,
  ExamQuestion,
  GradeLevel,
  QuestionDifficulty,
} from '../types';
import { formatToman, toPersianDigits } from '../utils/formatters';

export const AdminCoursesTab: React.FC = () => {
  const {
    courses,
    booklets,
    saveCourse,
    deleteCourse,
    fetchCourseLessons,
    saveCourseLesson,
    deleteCourseLesson,
    notify,
  } = useApp();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [instructor, setInstructor] = useState('دکتر فرزام فرهمندنیا');
  const [instructorTitle, setInstructorTitle] = useState('مدرس برتر زیست‌شناسی کنکور');
  const [grade, setGrade] = useState<GradeLevel>('جامع کنکور');
  const [category, setCategory] = useState<CourseCategory>('زیست‌شناسی');
  const [price, setPrice] = useState(3500000);
  const [discountPrice, setDiscountPrice] = useState<string>('');
  const [durationHours, setDurationHours] = useState(40);
  const [sessionsCount, setSessionsCount] = useState(16);
  const [imageUrl, setImageUrl] = useState(GENERATED_IMAGES.cellBiology);
  const [description, setDescription] = useState('');
  const [isDiamondIncluded, setIsDiamondIncluded] = useState(true);
  const [featured, setFeatured] = useState(true);
  const [saving, setSaving] = useState(false);

  // Lessons management
  const [lessonsCourseId, setLessonsCourseId] = useState<string | null>(null);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [lessonFormOpen, setLessonFormOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonOrder, setLessonOrder] = useState(1);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDuration, setLessonDuration] = useState(90);
  const [lessonPreview, setLessonPreview] = useState(false);
  const [lessonTopic, setLessonTopic] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonBookletTitle, setLessonBookletTitle] = useState('');
  const [lessonBookletUrl, setLessonBookletUrl] = useState('');
  const [lessonKeyPoints, setLessonKeyPoints] = useState('');

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setSubtitle('');
    setInstructor('دکتر فرزام فرهمندنیا');
    setInstructorTitle('مدرس برتر زیست‌شناسی کنکور');
    setGrade('جامع کنکور');
    setCategory('زیست‌شناسی');
    setPrice(3500000);
    setDiscountPrice('');
    setDurationHours(40);
    setSessionsCount(16);
    setImageUrl(GENERATED_IMAGES.cellBiology);
    setDescription('');
    setIsDiamondIncluded(true);
    setFeatured(true);
  };

  const openEditCourse = (c: Course) => {
    setEditingId(c.id);
    setTitle(c.title);
    setSubtitle(c.subtitle);
    setInstructor(c.instructor);
    setInstructorTitle(c.instructorTitle);
    setGrade(c.grade);
    setCategory(c.category);
    setPrice(c.price);
    setDiscountPrice(c.discountPrice !== undefined ? String(c.discountPrice) : '');
    setDurationHours(c.durationHours);
    setSessionsCount(c.sessionsCount);
    setImageUrl(c.imageUrl);
    setDescription(c.description);
    setIsDiamondIncluded(c.isDiamondIncluded);
    setFeatured(c.featured);
    setShowForm(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveCourse(
        {
          title,
          subtitle,
          instructor,
          instructorTitle,
          grade,
          category,
          price: Number(price),
          discountPrice: discountPrice !== '' ? Number(discountPrice) : undefined,
          durationHours: Number(durationHours),
          sessionsCount: Number(sessionsCount),
          imageUrl,
          description,
          isDiamondIncluded,
          featured,
        },
        editingId || undefined
      );
      setShowForm(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const toggleLessonsManager = async (courseId: string) => {
    if (lessonsCourseId === courseId) {
      setLessonsCourseId(null);
      return;
    }
    setLessonsCourseId(courseId);
    const list = await fetchCourseLessons(courseId);
    setLessons(list);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonsCourseId) return;
    await saveCourseLesson(
      lessonsCourseId,
      {
        order: Number(lessonOrder),
        title: lessonTitle,
        durationMinutes: Number(lessonDuration),
        isFreePreview: lessonPreview,
        videoTopic: lessonTopic,
        videoUrl: lessonVideoUrl,
        bookletTitle: lessonBookletTitle,
        bookletUrl: lessonBookletUrl,
        keyPoints: lessonKeyPoints,
      },
      editingLessonId || undefined
    );
    const updated = await fetchCourseLessons(lessonsCourseId);
    setLessons(updated);
    setLessonFormOpen(false);
    setEditingLessonId(null);
    setLessonTitle('');
    setLessonTopic('');
    setLessonVideoUrl('');
    setLessonBookletTitle('');
    setLessonBookletUrl('');
    setLessonKeyPoints('');
  };

  const handleImportTextNotes = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setLessonKeyPoints(text.slice(0, 3900));
      if (!lessonBookletTitle.trim()) {
        setLessonBookletTitle(file.name.replace(/\.(txt|md)$/i, ''));
      }
      notify('متن فایل در بخش نکات و جزوه این جلسه بارگذاری شد.', 'success');
    } catch {
      notify('خواندن فایل متنی امکان‌پذیر نبود.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">مدیریت دوره‌ها و جلسات کلاسی</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ایجاد دوره جدید، ویرایش قیمت، افزودن سرفصل و نکات خط‌به‌خط هر جلسه
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowForm((v) => !v);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{showForm ? 'بستن فرم' : 'افزودن دوره جدید'}</span>
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSaveCourse}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4"
        >
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {editingId ? 'ویرایش دوره' : 'ایجاد دوره جدید'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">عنوان دوره</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">زیرعنوان کوتاه</label>
              <input
                type="text"
                required
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">نام مدرس</label>
              <input
                type="text"
                required
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">سمت / معرفی مدرس</label>
              <input
                type="text"
                value={instructorTitle}
                onChange={(e) => setInstructorTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">مقطع</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value as GradeLevel)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                <option value="دهم">دهم</option>
                <option value="یازدهم">یازدهم</option>
                <option value="دوازدهم">دوازدهم</option>
                <option value="جامع کنکور">جامع کنکور</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">دسته‌بندی</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CourseCategory)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
              >
                <option value="زیست‌شناسی">زیست‌شناسی</option>
                <option value="جمع‌بندی CPR">جمع‌بندی CPR</option>
                <option value="شیمی">شیمی</option>
                <option value="فیزیک">فیزیک</option>
                <option value="ریاضی">ریاضی</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">قیمت اصلی (تومان)</label>
              <input
                type="number"
                min={0}
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">قیمت با تخفیف (اختیاری)</label>
              <input
                type="number"
                min={0}
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                placeholder="خالی = بدون تخفیف"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-lg tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">ساعات تدریس</label>
              <input
                type="number"
                min={1}
                required
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg tabular-nums"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">تعداد جلسات</label>
              <input
                type="number"
                min={1}
                required
                value={sessionsCount}
                onChange={(e) => setSessionsCount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg tabular-nums"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">تصویر دوره</label>
            <select
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            >
              <option value={GENERATED_IMAGES.cellBiology}>تصویر سلول یوکاریوتی</option>
              <option value={GENERATED_IMAGES.anatomyHeart}>تصویر آناتومی قلب</option>
              <option value={GENERATED_IMAGES.geneticsLab}>تصویر ژنتیک و DNA</option>
              <option value={GENERATED_IMAGES.heroLab}>تصویر آزمایشگاه میکروسکوپ</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">توضیحات کامل</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-800 dark:text-slate-200">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDiamondIncluded}
                onChange={(e) => setIsDiamondIncluded(e.target.checked)}
              />
              <span>شامل اشتراک الماس</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              <span>نمایش در صفحه اصلی</span>
            </label>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              {saving ? 'در حال ذخیره...' : 'ذخیره دوره'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg cursor-pointer"
            >
              انصراف
            </button>
          </div>
        </form>
      )}

      {/* Courses List */}
      <div className="space-y-4">
        {courses.map((course) => {
          const expanded = lessonsCourseId === course.id;
          return (
            <div key={course.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{course.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{course.grade}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{formatToman(course.discountPrice ?? course.price)}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{course.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{course.instructor}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void toggleLessonsManager(course.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-emerald-600 cursor-pointer"
                  >
                    <span>مدیریت جلسات</span>
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditCourse(course)}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer"
                    aria-label="ویرایش دوره"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteCourse(course.id)}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-400 cursor-pointer"
                    aria-label="حذف دوره"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {expanded && (
                <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      جلسات دوره ({toPersianDigits(lessons.length)})
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLessonId(null);
                        setLessonOrder(lessons.length + 1);
                        setLessonTitle('');
                        setLessonDuration(90);
                        setLessonPreview(false);
                        setLessonTopic('');
                        setLessonVideoUrl('');
                        setLessonBookletTitle('');
                        setLessonBookletUrl('');
                        setLessonKeyPoints('');
                        setLessonFormOpen((v) => !v);
                      }}
                      className="px-3.5 py-1.5 bg-slate-900 dark:bg-emerald-600 text-white text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      {lessonFormOpen ? 'بستن' : 'افزودن جلسه'}
                    </button>
                  </div>

                  {lessonFormOpen && (
                    <form
                      onSubmit={handleSaveLesson}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          type="number"
                          min={1}
                          required
                          value={lessonOrder}
                          onChange={(e) => setLessonOrder(Number(e.target.value))}
                          placeholder="شماره جلسه"
                          className="px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                        />
                        <input
                          type="text"
                          required
                          value={lessonTitle}
                          onChange={(e) => setLessonTitle(e.target.value)}
                          placeholder="عنوان جلسه"
                          className="px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg sm:col-span-2"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="number"
                          min={1}
                          required
                          value={lessonDuration}
                          onChange={(e) => setLessonDuration(Number(e.target.value))}
                          placeholder="مدت زمان (دقیقه)"
                          className="px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                        />
                        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={lessonPreview}
                            onChange={(e) => setLessonPreview(e.target.checked)}
                          />
                          <span>پیش‌نمایش رایگان برای همه</span>
                        </label>
                      </div>

                      <input
                        type="text"
                        required
                        value={lessonTopic}
                        onChange={(e) => setLessonTopic(e.target.value)}
                        placeholder="محور تدریس ویدیویی"
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />

                      {/* Offline Video Attachment */}
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                          <Film className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                          <span>ویدیوی جلسه آفلاین (لینک MP4، آپارات، یوتیوب یا پخش مستقیم)</span>
                        </label>
                        <input
                          type="url"
                          dir="ltr"
                          value={lessonVideoUrl}
                          onChange={(e) => setLessonVideoUrl(e.target.value)}
                          placeholder="https://example.com/session-01.mp4  or  https://www.aparat.com/v/..."
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-lg"
                        />
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          در صورت وارد کردن لینک MP4 یا لینک آپارات/یوتیوب، پلیر اختصاصی ویدیو برای دانش‌آموزان داخل صفحه جلسه فعال می‌شود.
                        </p>
                      </div>

                      {/* Offline Booklet Attachment */}
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                            <FileText className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                            <span>جزوه و فایل کمک‌آموزشی این جلسه</span>
                          </label>

                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value=""
                              onChange={(e) => {
                                const b = booklets.find((item) => item.id === e.target.value);
                                if (!b) return;
                                setLessonBookletTitle(b.title);
                                if (!lessonKeyPoints.trim()) {
                                  setLessonKeyPoints(b.summaryContent.slice(0, 3900));
                                }
                              }}
                              className="px-2.5 py-1 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg"
                            >
                              <option value="">انتخاب سریع از بانک جزوات...</option>
                              {booklets.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.title}
                                </option>
                              ))}
                            </select>

                            <label className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:border-emerald-600 cursor-pointer">
                              <Upload className="w-3.5 h-3.5" />
                              <span>درون‌ریزی فایل متنی (.txt)</span>
                              <input
                                type="file"
                                accept=".txt,.md,text/plain"
                                onChange={(e) => void handleImportTextNotes(e)}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={lessonBookletTitle}
                            onChange={(e) => setLessonBookletTitle(e.target.value)}
                            placeholder="عنوان جزوه جلسه (مثلاً: جزوه رنگی و تست‌های جلسه ۱)"
                            className="px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                          />
                          <input
                            type="url"
                            dir="ltr"
                            value={lessonBookletUrl}
                            onChange={(e) => setLessonBookletUrl(e.target.value)}
                            placeholder="https://example.com/booklet-01.pdf  (لینک فایل PDF)"
                            className="px-3 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-300 dark:border-slate-700 rounded-lg"
                          />
                        </div>
                      </div>

                      <textarea
                        rows={4}
                        required
                        value={lessonKeyPoints}
                        onChange={(e) => setLessonKeyPoints(e.target.value)}
                        placeholder="متن کامل نکات کلیدی و جزوه خلاصه این جلسه (علاوه بر نمایش در صفحه، به‌صورت جزوه آفلاین قابل دانلود در اختیار دانش‌آموز قرار می‌گیرد)..."
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-700 dark:bg-emerald-600 text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        ذخیره جلسه
                      </button>
                    </form>
                  )}

                  <div className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    {lessons.map((l) => (
                      <div key={l.id} className="p-3.5 flex items-center justify-between gap-3">
                        <div className="text-xs space-y-0.5">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {toPersianDigits(l.order)}. {l.title}
                          </p>
                          <p className="text-slate-500 dark:text-slate-400">
                            {toPersianDigits(l.durationMinutes)} دقیقه
                            {l.isFreePreview ? ' · رایگان' : ''}
                            {l.videoUrl ? ' · دارای ویدیو آفلاین' : ''}
                            {l.bookletUrl || l.bookletTitle ? ' · دارای جزوه' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLessonId(l.id);
                              setLessonOrder(l.order);
                              setLessonTitle(l.title);
                              setLessonDuration(l.durationMinutes);
                              setLessonPreview(l.isFreePreview);
                              setLessonTopic(l.videoTopic);
                              setLessonVideoUrl(l.videoUrl || '');
                              setLessonBookletTitle(l.bookletTitle || '');
                              setLessonBookletUrl(l.bookletUrl || '');
                              setLessonKeyPoints(l.keyPoints);
                              setLessonFormOpen(true);
                            }}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteCourseLesson(course.id, l.id);
                              const updated = await fetchCourseLessons(course.id);
                              setLessons(updated);
                            }}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const AdminExamsTab: React.FC = () => {
  const {
    exams,
    saveExam,
    deleteExam,
    fetchExamQuestions,
    saveExamQuestion,
    deleteExamQuestion,
  } = useApp();

  const [showExamForm, setShowExamForm] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [code, setCode] = useState('MZ-1406-NEW');
  const [subject, setSubject] = useState('زیست‌شناسی جامع');
  const [grade, setGrade] = useState<GradeLevel>('جامع کنکور');
  const [strategyWeek, setStrategyWeek] = useState('طبق برنامه راهبردی');
  const [scheduledDate, setScheduledDate] = useState('پنج‌شنبه این هفته');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState<ExamDifficulty>('سطح کنکور');
  const [isActive, setIsActive] = useState(true);
  const [isDiamondIncluded, setIsDiamondIncluded] = useState(true);
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState('');

  // Questions editor state
  const [questionsExamId, setQuestionsExamId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [qFormOpen, setQFormOpen] = useState(false);
  const [editingQId, setEditingQId] = useState<string | null>(null);
  const [qOrder, setQOrder] = useState(1);
  const [qSubject, setQSubject] = useState('زیست‌شناسی');
  const [qTopic, setQTopic] = useState('');
  const [qStem, setQStem] = useState('');
  const [qOpt1, setQOpt1] = useState('');
  const [qOpt2, setQOpt2] = useState('');
  const [qOpt3, setQOpt3] = useState('');
  const [qOpt4, setQOpt4] = useState('');
  const [qCorrect, setQCorrect] = useState(0);
  const [qDifficulty, setQDifficulty] = useState<QuestionDifficulty>('متوسط');
  const [qExplanation, setQExplanation] = useState('');

  const openEditExam = (ex: Exam) => {
    setEditingExamId(ex.id);
    setTitle(ex.title);
    setCode(ex.code);
    setSubject(ex.subject);
    setGrade(ex.grade);
    setStrategyWeek(ex.strategyWeek);
    setScheduledDate(ex.scheduledDate);
    setDurationMinutes(ex.durationMinutes);
    setTotalQuestions(ex.totalQuestions);
    setDifficulty(ex.difficulty);
    setIsActive(ex.isActive);
    setIsDiamondIncluded(ex.isDiamondIncluded);
    setPrice(ex.price);
    setDescription(ex.description);
    setShowExamForm(true);
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveExam(
      {
        title,
        code,
        subject,
        grade,
        strategyWeek,
        scheduledDate,
        durationMinutes: Number(durationMinutes),
        totalQuestions: Number(totalQuestions),
        difficulty,
        isActive,
        isDiamondIncluded,
        price: Number(price),
        description,
      },
      editingExamId || undefined
    );
    setShowExamForm(false);
    setEditingExamId(null);
  };

  const toggleQuestions = async (examId: string) => {
    if (questionsExamId === examId) {
      setQuestionsExamId(null);
      return;
    }
    setQuestionsExamId(examId);
    const list = await fetchExamQuestions(examId);
    setQuestions(list);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionsExamId) return;
    await saveExamQuestion(
      questionsExamId,
      {
        order: Number(qOrder),
        subject: qSubject,
        topic: qTopic,
        stem: qStem,
        option1: qOpt1,
        option2: qOpt2,
        option3: qOpt3,
        option4: qOpt4,
        correctOption: Number(qCorrect),
        explanation: qExplanation,
        difficulty: qDifficulty,
      },
      editingQId || undefined
    );
    const updated = await fetchExamQuestions(questionsExamId);
    setQuestions(updated);
    setQFormOpen(false);
    setEditingQId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">مدیریت آزمون‌ها و بانک سوالات</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ساخت آزمون جدید، تعیین زمان و بودجه‌بندی، و افزودن سوالات تستی با پاسخ تشریحی
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingExamId(null);
            setTitle('');
            setDescription('');
            setShowExamForm((v) => !v);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{showExamForm ? 'بستن فرم' : 'ایجاد آزمون جدید'}</span>
        </button>
      </div>

      {showExamForm && (
        <form
          onSubmit={handleSaveExam}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان آزمون"
              className="px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg md:col-span-2"
            />
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="کد آزمون (مثلاً MZ-1406-02)"
              className="px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg font-mono-tabular"
            />
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="درس"
              className="px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
            />
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value as GradeLevel)}
              className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            >
              <option value="دهم">دهم</option>
              <option value="یازدهم">یازدهم</option>
              <option value="دوازدهم">دوازدهم</option>
              <option value="جامع کنکور">جامع کنکور</option>
            </select>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as ExamDifficulty)}
              className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            >
              <option value="استاندارد">استاندارد</option>
              <option value="سطح کنکور">سطح کنکور</option>
              <option value="چالشی">چالشی</option>
            </select>
            <input
              type="text"
              value={strategyWeek}
              onChange={(e) => setStrategyWeek(e.target.value)}
              placeholder="بودجه‌بندی برنامه راهبردی"
              className="px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
            />
            <input
              type="text"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              placeholder="تاریخ برگزاری"
              className="px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
            />
            <input
              type="number"
              min={5}
              required
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              placeholder="زمان (دقیقه)"
              className="px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
            />
          </div>

          <textarea
            rows={2}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="توضیحات آزمون"
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
          />

          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-800 dark:text-slate-200">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              <span>آزمون فعال است</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDiamondIncluded}
                onChange={(e) => setIsDiamondIncluded(e.target.checked)}
              />
              <span>مشمول اشتراک الماس</span>
            </label>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-700 dark:bg-emerald-600 text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            ذخیره آزمون
          </button>
        </form>
      )}

      {/* Exams list */}
      <div className="space-y-4">
        {exams.map((exam) => {
          const expanded = questionsExamId === exam.id;
          return (
            <div key={exam.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                    {exam.code} · {exam.grade} · {exam.isActive ? 'فعال' : 'بسته'}
                  </p>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{exam.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void toggleQuestions(exam.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-emerald-600 cursor-pointer"
                  >
                    <span>بانک سوالات</span>
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditExam(exam)}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteExam(exam.id)}
                    className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {expanded && (
                <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      سوالات ثبت‌شده ({toPersianDigits(questions.length)})
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQId(null);
                        setQOrder(questions.length + 1);
                        setQSubject(exam.subject);
                        setQTopic('');
                        setQStem('');
                        setQOpt1('');
                        setQOpt2('');
                        setQOpt3('');
                        setQOpt4('');
                        setQCorrect(0);
                        setQExplanation('');
                        setQFormOpen((v) => !v);
                      }}
                      className="px-3.5 py-1.5 bg-slate-900 dark:bg-emerald-600 text-white text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      {qFormOpen ? 'بستن' : 'افزودن سوال'}
                    </button>
                  </div>

                  {qFormOpen && (
                    <form
                      onSubmit={handleSaveQuestion}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <input
                          type="number"
                          min={1}
                          required
                          value={qOrder}
                          onChange={(e) => setQOrder(Number(e.target.value))}
                          placeholder="شماره"
                          className="px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                        />
                        <input
                          type="text"
                          required
                          value={qSubject}
                          onChange={(e) => setQSubject(e.target.value)}
                          placeholder="درس"
                          className="px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                        />
                        <input
                          type="text"
                          required
                          value={qTopic}
                          onChange={(e) => setQTopic(e.target.value)}
                          placeholder="مبحث"
                          className="px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                        />
                        <select
                          value={qDifficulty}
                          onChange={(e) => setQDifficulty(e.target.value as QuestionDifficulty)}
                          className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                        >
                          <option value="ساده">ساده</option>
                          <option value="متوسط">متوسط</option>
                          <option value="دشوار">دشوار</option>
                        </select>
                      </div>

                      <textarea
                        rows={2}
                        required
                        value={qStem}
                        onChange={(e) => setQStem(e.target.value)}
                        placeholder="صورت سوال..."
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          value={qOpt1}
                          onChange={(e) => setQOpt1(e.target.value)}
                          placeholder="گزینه ۱"
                          className="px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                        />
                        <input
                          type="text"
                          required
                          value={qOpt2}
                          onChange={(e) => setQOpt2(e.target.value)}
                          placeholder="گزینه ۲"
                          className="px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                        />
                        <input
                          type="text"
                          required
                          value={qOpt3}
                          onChange={(e) => setQOpt3(e.target.value)}
                          placeholder="گزینه ۳"
                          className="px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                        />
                        <input
                          type="text"
                          required
                          value={qOpt4}
                          onChange={(e) => setQOpt4(e.target.value)}
                          placeholder="گزینه ۴"
                          className="px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">گزینه صحیح:</label>
                        <select
                          value={qCorrect}
                          onChange={(e) => setQCorrect(Number(e.target.value))}
                          className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                        >
                          <option value={0}>گزینه ۱</option>
                          <option value={1}>گزینه ۲</option>
                          <option value={2}>گزینه ۳</option>
                          <option value={3}>گزینه ۴</option>
                        </select>
                      </div>

                      <textarea
                        rows={2}
                        required
                        value={qExplanation}
                        onChange={(e) => setQExplanation(e.target.value)}
                        placeholder="پاسخ‌نامه تشریحی سوال..."
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg"
                      />

                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-700 dark:bg-emerald-600 text-white text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        ذخیره سوال
                      </button>
                    </form>
                  )}

                  <div className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    {questions.map((q) => (
                      <div key={q.id} className="p-3.5 flex items-start justify-between gap-3">
                        <div className="text-xs space-y-1">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {toPersianDigits(q.order)}. {q.stem}
                          </p>
                          <p className="text-slate-500 dark:text-slate-400">
                            مبحث: {q.topic} · گزینه صحیح: {toPersianDigits(q.correctOption + 1)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingQId(q.id);
                              setQOrder(q.order);
                              setQSubject(q.subject);
                              setQTopic(q.topic);
                              setQStem(q.stem);
                              setQOpt1(q.option1);
                              setQOpt2(q.option2);
                              setQOpt3(q.option3);
                              setQOpt4(q.option4);
                              setQCorrect(q.correctOption);
                              setQDifficulty(q.difficulty);
                              setQExplanation(q.explanation);
                              setQFormOpen(true);
                            }}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteExamQuestion(exam.id, q.id);
                              const updated = await fetchExamQuestions(exam.id);
                              setQuestions(updated);
                            }}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
