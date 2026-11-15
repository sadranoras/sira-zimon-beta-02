import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Compass,
  MinusCircle,
  Plus,
  Printer,
  RotateCcw,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { toPersianDigits } from '../utils/formatters';
import {
  type MajorGroup,
  type QuotaRegion,
  type SimulatedMajorResult,
  type UniversityPeriod,
  simulateMajorChances,
} from '../utils/majorSelectionData';

const REGION_OPTIONS: { value: QuotaRegion; label: string }[] = [
  { value: 1, label: 'منطقه ۱' },
  { value: 2, label: 'منطقه ۲' },
  { value: 3, label: 'منطقه ۳' },
];

const GROUP_OPTIONS: ('همه' | MajorGroup)[] = [
  'همه',
  'پزشکی و دندان‌پزشکی و داروسازی',
  'توانبخشی و پیراپزشکی',
  'علوم پایه زیستی و دامپزشکی',
];

const PERIOD_OPTIONS: ('همه' | UniversityPeriod)[] = [
  'همه',
  'روزانه',
  'پردیس خودگردان',
  'دانشگاه آزاد',
];

export const MajorSimulatorView: React.FC = () => {
  const { examAttempts, selectedAttempt, notify } = useApp();

  const referenceAttempt = selectedAttempt || examAttempts[0] || null;

  const [rankInRegion, setRankInRegion] = useState<number>(
    referenceAttempt ? Math.max(1, referenceAttempt.estimatedRank) : 1450
  );
  const [taraz, setTaraz] = useState<number>(referenceAttempt ? referenceAttempt.taraz : 9150);
  const [region, setRegion] = useState<QuotaRegion>(2);
  const [groupFilter, setGroupFilter] = useState<'همه' | MajorGroup>('همه');
  const [periodFilter, setPeriodFilter] = useState<'همه' | UniversityPeriod>('همه');

  const [priorityList, setPriorityList] = useState<SimulatedMajorResult[]>([]);

  const results = useMemo(
    () =>
      simulateMajorChances({
        rankInRegion,
        taraz,
        region,
        groupFilter,
        periodFilter,
      }),
    [rankInRegion, taraz, region, groupFilter, periodFilter]
  );

  // Keep probabilities in priority list synced with current rank/taraz/region inputs
  const syncedPriorityList = useMemo(() => {
    const allCurrent = simulateMajorChances({
      rankInRegion,
      taraz,
      region,
      groupFilter: 'همه',
      periodFilter: 'همه',
    });
    return priorityList
      .map((item) => allCurrent.find((r) => r.id === item.id) || item)
      .filter(Boolean);
  }, [priorityList, rankInRegion, taraz, region]);

  const counts = useMemo(() => {
    return {
      high: results.filter((r) => r.tier === 'high').length,
      borderline: results.filter((r) => r.tier === 'borderline').length,
      low: results.filter((r) => r.tier === 'low').length,
    };
  }, [results]);

  const handleLoadFromLatestAttempt = () => {
    if (!referenceAttempt) {
      notify('هنوز کارنامه‌ای در حساب شما ثبت نشده است.', 'info');
      return;
    }
    setRankInRegion(Math.max(1, referenceAttempt.estimatedRank));
    setTaraz(referenceAttempt.taraz);
    notify(`داده‌های کارنامه «${referenceAttempt.examTitle}» بارگذاری شد.`, 'success');
  };

  const addToPriority = (item: SimulatedMajorResult) => {
    if (priorityList.some((p) => p.id === item.id)) {
      notify('این کدرشته هم‌اکنون در لیست اولویت شما قرار دارد.', 'info');
      return;
    }
    setPriorityList((prev) => [...prev, item]);
    notify(`«${item.majorName} - ${item.university}» به لیست اولویت اضافه شد.`, 'success');
  };

  const removeFromPriority = (id: string) => {
    setPriorityList((prev) => prev.filter((p) => p.id !== id));
  };

  const movePriority = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= priorityList.length) return;
    setPriorityList((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Parameters Card */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 no-print">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                شبیه‌ساز انتخاب رشته کنکور تجربی (بر اساس کارنامه‌های نهایی سال‌های قبل)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
              رتبه در سهمیه، تراز کل و منطقه خود را وارد کنید تا شانس قبولی شما بر اساس آخرین رتبه و تراز پذیرفته‌شدگان واقعی سال‌های گذشته در دوره‌های روزانه، پردیس خودگردان و دانشگاه آزاد تخمین زده شود.
            </p>
          </div>

          {referenceAttempt && (
            <button
              type="button"
              onClick={handleLoadFromLatestAttempt}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-emerald-600 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-semibold rounded-lg cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>بارگذاری از کارنامه ({toPersianDigits(referenceAttempt.taraz)})</span>
            </button>
          )}
        </div>

        {/* Filter & Input Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">رتبه در سهمیه منطقه</label>
            <input
              type="number"
              min={1}
              max={500000}
              value={rankInRegion}
              onChange={(e) => setRankInRegion(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg tabular-nums focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">تراز کل آزمون</label>
            <input
              type="number"
              min={2000}
              max={13000}
              step={50}
              value={taraz}
              onChange={(e) => setTaraz(Math.max(2000, Math.min(13000, Number(e.target.value))))}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg tabular-nums focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">سهمیه منطقه</label>
            <select
              value={region}
              onChange={(e) => setRegion(Number(e.target.value) as QuotaRegion)}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
            >
              {REGION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">گروه رشته</label>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value as 'همه' | MajorGroup)}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
            >
              {GROUP_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">دوره دانشگاه</label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as 'همه' | UniversityPeriod)}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600"
            >
              {PERIOD_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-900 dark:text-emerald-200 font-semibold">انتخاب‌های مطمئن (شانس بالا)</p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">احتمال قبولی ۷۰٪ به بالا</p>
            </div>
            <span className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-300 tabular-nums">
              {toPersianDigits(counts.high)}
            </span>
          </div>

          <div className="p-4 bg-amber-50/70 dark:bg-amber-950/35 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-900 dark:text-amber-200 font-semibold">انتخاب‌های منطقی (مرزی)</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">احتمال قبولی ۴۰٪ تا ۶۹٪</p>
            </div>
            <span className="text-2xl font-extrabold text-amber-800 dark:text-amber-300 tabular-nums">
              {toPersianDigits(counts.borderline)}
            </span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold">انتخاب‌های چالشی (احتمال پایین)</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">نیازمند بررسی ظرفیت امسال</p>
            </div>
            <span className="text-2xl font-extrabold text-slate-700 dark:text-slate-300 tabular-nums">
              {toPersianDigits(counts.low)}
            </span>
          </div>
        </div>
      </section>

      {/* Main Split: Historical Cutoff Matrix + Priority List Builder */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Simulation Results Table */}
        <section className="xl:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden no-print">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              نتایج تخمین قبولی در رشته‌ها و دانشگاه‌ها ({toPersianDigits(results.length)} کدرشته)
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              مبنا: منطقه {toPersianDigits(region)} · رتبه {toPersianDigits(rankInRegion)} · تراز{' '}
              {toPersianDigits(taraz)}
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {results.map((item) => {
              const isAdded = syncedPriorityList.some((p) => p.id === item.id);
              const barColor =
                item.tier === 'high'
                  ? 'bg-emerald-600'
                  : item.tier === 'borderline'
                    ? 'bg-amber-500'
                    : 'bg-rose-500';
              const textColor =
                item.tier === 'high'
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : item.tier === 'borderline'
                    ? 'text-amber-700 dark:text-amber-400'
                    : 'text-rose-700 dark:text-rose-400';

              return (
                <div
                  key={item.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{item.period}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.city}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.group}</span>
                    </div>

                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {item.majorName} — {item.university}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                      بازه رتبه قبولی پارسال (منطقه {toPersianDigits(region)}): از{' '}
                      <span className="font-bold text-slate-900 dark:text-white">
                        {toPersianDigits(item.bestRankForRegion)}
                      </span>{' '}
                      تا{' '}
                      <span className="font-bold text-slate-900 dark:text-white">
                        {toPersianDigits(item.cutoffRankForRegion)}
                      </span>{' '}
                      · حداقل تراز: <span className="font-bold text-slate-800 dark:text-slate-200">{toPersianDigits(item.minTaraz)}</span> ·
                      میانگین درصد زیست: <span className="font-bold text-slate-800 dark:text-slate-200">{toPersianDigits(item.lastYearAvgBioPct)}٪</span>
                    </p>

                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.reasonText}</p>
                  </div>

                  {/* Probability Meter + Add Button */}
                  <div className="md:w-56 shrink-0 space-y-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className={`inline-flex items-center gap-1 ${textColor}`}>
                          {item.tier === 'high' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : item.tier === 'borderline' ? (
                            <MinusCircle className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {item.tier === 'high'
                              ? 'قبولی مطمئن'
                              : item.tier === 'borderline'
                                ? 'مرزی'
                                : 'چالشی'}
                          </span>
                        </span>
                        <span className={`tabular-nums text-sm ${textColor}`}>
                          {toPersianDigits(item.probabilityPct)}٪
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColor}`}
                          style={{ width: `${item.probabilityPct}%` }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        isAdded ? removeFromPriority(item.id) : addToPriority(item)
                      }
                      className={`w-full py-2 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        isAdded
                          ? 'border border-emerald-600 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                          : 'bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>در لیست اولویت (حذف)</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>افزودن به لیست انتخاب‌ها</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Priority List Builder (چیدمان دفترچه انتخاب رشته) */}
        <aside className="xl:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                چیدمان دفترچه انتخاب رشته من ({toPersianDigits(syncedPriorityList.length)})
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                رشته‌ها را بر اساس علاقه از بالا به پایین مرتب کنید
              </p>
            </div>
            {syncedPriorityList.length > 0 && (
              <button
                type="button"
                onClick={() => setPriorityList([])}
                title="پاک‌سازی لیست"
                className="p-1.5 text-slate-400 hover:text-rose-700 dark:hover:text-rose-400 cursor-pointer no-print"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          {syncedPriorityList.length === 0 ? (
            <div className="py-10 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                هنوز رشته‌ای به دفترچه پیشنهادی خود اضافه نکرده‌اید
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                از جدول سمت راست، رشته‌های مدنظرتان را اضافه کنید تا ترتیب اولویت‌بندی و شانس قبولی نهایی آن‌ها را برای مشاور یا چاپ آماده کنید.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {syncedPriorityList.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl flex items-start justify-between gap-2"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
                        اولویت {toPersianDigits(idx + 1)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                        {toPersianDigits(item.probabilityPct)}٪ شانس
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.majorName} — {item.university}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {item.period} · آخرین رتبه منطقه {toPersianDigits(region)}:{' '}
                      {toPersianDigits(item.cutoffRankForRegion)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 no-print">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => movePriority(idx, -1)}
                      className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                      aria-label="بالا بردن اولویت"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === syncedPriorityList.length - 1}
                      onClick={() => movePriority(idx, 1)}
                      className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                      aria-label="پایین بردن اولویت"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromPriority(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-700 dark:hover:text-rose-400 cursor-pointer"
                      aria-label="حذف از لیست"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-2 cursor-pointer no-print"
              >
                <Printer className="w-4 h-4" />
                <span>چاپ / ذخیره PDF لیست انتخاب رشته</span>
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
