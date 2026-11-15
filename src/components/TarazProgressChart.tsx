import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ExamAttempt } from '../types';
import { toPersianDigits } from '../utils/formatters';
import { buildTarazProgressSeries, type TarazProgressPoint } from '../utils/konkurAnalytics';

interface TarazProgressChartProps {
  attempts: ExamAttempt[];
  onStartExam?: () => void;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TarazProgressPoint }>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-xl p-3.5 shadow-lg border border-slate-700 dark:border-slate-800 text-xs space-y-1.5 min-w-[190px]">
      <p className="font-bold text-emerald-400">{point.examTitle}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-slate-300">تراز کسب‌شده</span>
        <span className="font-extrabold tabular-nums text-white">
          {toPersianDigits(point.taraz)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-slate-300">درصد پاسخ‌گویی</span>
        <span className="font-semibold tabular-nums text-slate-100">
          {toPersianDigits(point.percentage)}٪
        </span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-slate-300">رتبه تخمینی</span>
        <span className="font-semibold tabular-nums text-slate-100">
          {toPersianDigits(point.estimatedRank)}
        </span>
      </div>
    </div>
  );
};

export const TarazProgressChart: React.FC<TarazProgressChartProps> = ({
  attempts,
  onStartExam,
}) => {
  const { theme } = useApp();
  const isDark = theme === 'dark';

  const gridStroke = isDark ? '#1E293B' : '#E2E8F0';
  const tickFill = isDark ? '#94A3B8' : '#475569';
  const axisStroke = isDark ? '#334155' : '#CBD5E1';
  const refStroke = isDark ? '#64748B' : '#64748B';
  const refLabelFill = isDark ? '#94A3B8' : '#475569';
  const dotStroke = isDark ? '#0F172A' : '#FFFFFF';
  const lineColor = isDark ? '#10B981' : '#059669';

  const series = useMemo(() => buildTarazProgressSeries(attempts), [attempts]);

  const delta = useMemo(() => {
    if (series.length < 2) return null;
    return series[series.length - 1].taraz - series[series.length - 2].taraz;
  }, [series]);

  const bestTaraz = useMemo(() => {
    if (series.length === 0) return 0;
    return Math.max(...series.map((s) => s.taraz));
  }, [series]);

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            نمودار روند پیشرفت تراز در طول زمان
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            مقایسه تراز آزمون‌های ثبت‌شده شما با خط میانگین تراز جامعه آماری (۵۰۰۰)
          </p>
        </div>

        {series.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="text-left">
              <span className="text-slate-500 dark:text-slate-400 block">بالاترین تراز</span>
              <span className="font-extrabold text-slate-900 dark:text-white tabular-nums text-sm">
                {toPersianDigits(bestTaraz)}
              </span>
            </div>

            {delta !== null && (
              <div className="text-left border-r border-slate-200 dark:border-slate-800 pr-4">
                <span className="text-slate-500 dark:text-slate-400 block">تغییر نسبت به آزمون قبل</span>
                <span
                  className={`inline-flex items-center gap-1 font-extrabold tabular-nums text-sm ${
                    delta >= 0
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-rose-700 dark:text-rose-400'
                  }`}
                >
                  {delta >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>
                    {delta >= 0 ? '+' : ''}
                    {toPersianDigits(delta)}
                  </span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {series.length === 0 ? (
        <div className="py-12 px-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-center space-y-3">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            هنوز داده‌ای برای رسم نمودار پیشرفت ثبت نشده است
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            پس از شرکت در اولین آزمون آزمایشی، نمودار روند تراز، درصد و جایگاه شما در طول زمان به صورت خودکار در این بخش ترسیم می‌شود.
          </p>
          {onStartExam && (
            <button
              type="button"
              onClick={onStartExam}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              شرکت در اولین آزمون
            </button>
          )}
        </div>
      ) : (
        <div className="w-full h-72" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 12, right: 20, left: 4, bottom: 8 }}>
              <defs>
                <linearGradient id="tarazGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={lineColor} stopOpacity={isDark ? 0.35 : 0.22} />
                  <stop offset="95%" stopColor={lineColor} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: tickFill, fontSize: 12 }}
                axisLine={{ stroke: axisStroke }}
                tickLine={false}
              />
              <YAxis
                domain={[1000, 11000]}
                tick={{ fill: tickFill, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => toPersianDigits(v)}
                width={54}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={5000}
                stroke={refStroke}
                strokeDasharray="4 4"
                label={{
                  value: 'میانگین ۵۰۰۰',
                  position: 'insideTopRight',
                  fill: refLabelFill,
                  fontSize: 11,
                }}
              />
              <Area
                type="monotone"
                dataKey="taraz"
                stroke={lineColor}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#tarazGradient)"
                dot={{ r: 4, fill: lineColor, strokeWidth: 2, stroke: dotStroke }}
                activeDot={{ r: 6, fill: isDark ? '#34D399' : '#047857', stroke: dotStroke, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
};
