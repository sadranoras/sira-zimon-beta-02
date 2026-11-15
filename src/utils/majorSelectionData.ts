export type QuotaRegion = 1 | 2 | 3;
export type UniversityPeriod = 'روزانه' | 'پردیس خودگردان' | 'دانشگاه آزاد';
export type MajorGroup =
  | 'پزشکی و دندان‌پزشکی و داروسازی'
  | 'توانبخشی و پیراپزشکی'
  | 'علوم پایه زیستی و دامپزشکی';

export interface HistoricalMajorCutoff {
  id: string;
  majorName: string;
  university: string;
  city: string;
  group: MajorGroup;
  period: UniversityPeriod;
  minTaraz: number;
  lastYearAvgBioPct: number;
  maxRankByRegion: Record<QuotaRegion, number>;
  bestRankByRegion: Record<QuotaRegion, number>;
}

export type AdmissionTier = 'high' | 'borderline' | 'low';

export interface SimulatedMajorResult extends HistoricalMajorCutoff {
  cutoffRankForRegion: number;
  bestRankForRegion: number;
  probabilityPct: number;
  tier: AdmissionTier;
  tierLabel: string;
  reasonText: string;
}

export const HISTORICAL_CUTOFFS: HistoricalMajorCutoff[] = [
  {
    id: 'med-tehran',
    majorName: 'پزشکی',
    university: 'دانشگاه علوم پزشکی تهران',
    city: 'تهران',
    group: 'پزشکی و دندان‌پزشکی و داروسازی',
    period: 'روزانه',
    minTaraz: 10350,
    lastYearAvgBioPct: 79,
    bestRankByRegion: { 1: 1, 2: 1, 3: 1 },
    maxRankByRegion: { 1: 210, 2: 340, 3: 185 },
  },
  {
    id: 'dent-sbmu',
    majorName: 'دندان‌پزشکی',
    university: 'دانشگاه علوم پزشکی شهید بهشتی',
    city: 'تهران',
    group: 'پزشکی و دندان‌پزشکی و داروسازی',
    period: 'روزانه',
    minTaraz: 10050,
    lastYearAvgBioPct: 75,
    bestRankByRegion: { 1: 120, 2: 180, 3: 90 },
    maxRankByRegion: { 1: 420, 2: 680, 3: 340 },
  },
  {
    id: 'med-iums',
    majorName: 'پزشکی',
    university: 'دانشگاه علوم پزشکی ایران',
    city: 'تهران',
    group: 'پزشکی و دندان‌پزشکی و داروسازی',
    period: 'روزانه',
    minTaraz: 9850,
    lastYearAvgBioPct: 74,
    bestRankByRegion: { 1: 190, 2: 290, 3: 150 },
    maxRankByRegion: { 1: 580, 2: 920, 3: 480 },
  },
  {
    id: 'med-shiraz',
    majorName: 'پزشکی',
    university: 'دانشگاه علوم پزشکی شیراز',
    city: 'شیراز',
    group: 'پزشکی و دندان‌پزشکی و داروسازی',
    period: 'روزانه',
    minTaraz: 9650,
    lastYearAvgBioPct: 72,
    bestRankByRegion: { 1: 310, 2: 450, 3: 240 },
    maxRankByRegion: { 1: 890, 2: 1380, 3: 720 },
  },
  {
    id: 'med-isfahan',
    majorName: 'پزشکی',
    university: 'دانشگاه علوم پزشکی اصفهان',
    city: 'اصفهان',
    group: 'پزشکی و دندان‌پزشکی و داروسازی',
    period: 'روزانه',
    minTaraz: 9520,
    lastYearAvgBioPct: 70,
    bestRankByRegion: { 1: 410, 2: 560, 3: 310 },
    maxRankByRegion: { 1: 1050, 2: 1620, 3: 840 },
  },
  {
    id: 'pharm-tehran',
    majorName: 'داروسازی',
    university: 'دانشگاه علوم پزشکی تهران',
    city: 'تهران',
    group: 'پزشکی و دندان‌پزشکی و داروسازی',
    period: 'روزانه',
    minTaraz: 9380,
    lastYearAvgBioPct: 68,
    bestRankByRegion: { 1: 480, 2: 720, 3: 390 },
    maxRankByRegion: { 1: 1280, 2: 1980, 3: 1040 },
  },
  {
    id: 'med-mashhad',
    majorName: 'پزشکی',
    university: 'دانشگاه علوم پزشکی مشهد',
    city: 'مشهد',
    group: 'پزشکی و دندان‌پزشکی و داروسازی',
    period: 'روزانه',
    minTaraz: 9300,
    lastYearAvgBioPct: 68,
    bestRankByRegion: { 1: 520, 2: 810, 3: 410 },
    maxRankByRegion: { 1: 1420, 2: 2240, 3: 1180 },
  },
  {
    id: 'dent-tabriz',
    majorName: 'دندان‌پزشکی',
    university: 'دانشگاه علوم پزشکی تبریز',
    city: 'تبریز',
    group: 'پزشکی و دندان‌پزشکی و داروسازی',
    period: 'روزانه',
    minTaraz: 9120,
    lastYearAvgBioPct: 66,
    bestRankByRegion: { 1: 680, 2: 960, 3: 510 },
    maxRankByRegion: { 1: 1790, 2: 2680, 3: 1410 },
  },
  {
    id: 'med-babol',
    majorName: 'پزشکی',
    university: 'دانشگاه علوم پزشکی بابل',
    city: 'بابل',
    group: 'پزشکی و دندان‌پزشکی و داروسازی',
    period: 'روزانه',
    minTaraz: 8780,
    lastYearAvgBioPct: 63,
    bestRankByRegion: { 1: 1150, 2: 1650, 3: 890 },
    maxRankByRegion: { 1: 2450, 2: 3650, 3: 1980 },
  },
  {
    id: 'med-azad-tehran',
    majorName: 'پزشکی',
    university: 'دانشگاه علوم پزشکی آزاد اسلامی تهران',
    city: 'تهران',
    group: 'پزشکی و دندان‌پزشکی و داروسازی',
    period: 'دانشگاه آزاد',
    minTaraz: 8450,
    lastYearAvgBioPct: 60,
    bestRankByRegion: { 1: 1600, 2: 2300, 3: 1300 },
    maxRankByRegion: { 1: 3500, 2: 5200, 3: 2900 },
  },
  {
    id: 'med-pardis-iums',
    majorName: 'پزشکی (پردیس خودگردان)',
    university: 'دانشگاه علوم پزشکی ایران',
    city: 'تهران',
    group: 'پزشکی و دندان‌پزشکی و داروسازی',
    period: 'پردیس خودگردان',
    minTaraz: 8550,
    lastYearAvgBioPct: 61,
    bestRankByRegion: { 1: 1450, 2: 2100, 3: 1150 },
    maxRankByRegion: { 1: 3200, 2: 4750, 3: 2650 },
  },
  {
    id: 'physio-tehran',
    majorName: 'فیزیوتراپی',
    university: 'دانشگاه علوم پزشکی تهران',
    city: 'تهران',
    group: 'توانبخشی و پیراپزشکی',
    period: 'روزانه',
    minTaraz: 8480,
    lastYearAvgBioPct: 59,
    bestRankByRegion: { 1: 1400, 2: 2050, 3: 1100 },
    maxRankByRegion: { 1: 3100, 2: 4850, 3: 2600 },
  },
  {
    id: 'physio-shiraz',
    majorName: 'فیزیوتراپی',
    university: 'دانشگاه علوم پزشکی شیراز',
    city: 'شیراز',
    group: 'توانبخشی و پیراپزشکی',
    period: 'روزانه',
    minTaraz: 7950,
    lastYearAvgBioPct: 54,
    bestRankByRegion: { 1: 2500, 2: 3700, 3: 2000 },
    maxRankByRegion: { 1: 5100, 2: 7600, 3: 4100 },
  },
  {
    id: 'optometry-sbmu',
    majorName: 'بینایی‌سنجی',
    university: 'دانشگاه علوم پزشکی شهید بهشتی',
    city: 'تهران',
    group: 'توانبخشی و پیراپزشکی',
    period: 'روزانه',
    minTaraz: 8100,
    lastYearAvgBioPct: 55,
    bestRankByRegion: { 1: 2100, 2: 3200, 3: 1750 },
    maxRankByRegion: { 1: 4500, 2: 6800, 3: 3650 },
  },
  {
    id: 'nursing-tehran',
    majorName: 'پرستاری',
    university: 'دانشگاه علوم پزشکی تهران',
    city: 'تهران',
    group: 'توانبخشی و پیراپزشکی',
    period: 'روزانه',
    minTaraz: 7250,
    lastYearAvgBioPct: 48,
    bestRankByRegion: { 1: 4600, 2: 6800, 3: 3700 },
    maxRankByRegion: { 1: 9800, 2: 14200, 3: 7900 },
  },
  {
    id: 'or-sbmu',
    majorName: 'اتاق عمل',
    university: 'دانشگاه علوم پزشکی شهید بهشتی',
    city: 'تهران',
    group: 'توانبخشی و پیراپزشکی',
    period: 'روزانه',
    minTaraz: 7050,
    lastYearAvgBioPct: 46,
    bestRankByRegion: { 1: 5200, 2: 7600, 3: 4200 },
    maxRankByRegion: { 1: 11200, 2: 16500, 3: 9200 },
  },
  {
    id: 'anesthesia-iums',
    majorName: 'هوشبری',
    university: 'دانشگاه علوم پزشکی ایران',
    city: 'تهران',
    group: 'توانبخشی و پیراپزشکی',
    period: 'روزانه',
    minTaraz: 6850,
    lastYearAvgBioPct: 44,
    bestRankByRegion: { 1: 5900, 2: 8800, 3: 4800 },
    maxRankByRegion: { 1: 12600, 2: 18400, 3: 10300 },
  },
  {
    id: 'vet-ut',
    majorName: 'دکترای عمومی دامپزشکی',
    university: 'دانشگاه تهران',
    city: 'تهران',
    group: 'علوم پایه زیستی و دامپزشکی',
    period: 'روزانه',
    minTaraz: 7600,
    lastYearAvgBioPct: 51,
    bestRankByRegion: { 1: 3500, 2: 5300, 3: 2900 },
    maxRankByRegion: { 1: 7900, 2: 11800, 3: 6400 },
  },
  {
    id: 'biotech-ut',
    majorName: 'زیست‌فناوری (بیوتکنولوژی)',
    university: 'دانشگاه تهران',
    city: 'تهران',
    group: 'علوم پایه زیستی و دامپزشکی',
    period: 'روزانه',
    minTaraz: 7450,
    lastYearAvgBioPct: 52,
    bestRankByRegion: { 1: 3800, 2: 5800, 3: 3100 },
    maxRankByRegion: { 1: 8600, 2: 12900, 3: 7100 },
  },
  {
    id: 'cellbio-sbu',
    majorName: 'زیست‌شناسی سلولی و مولکولی',
    university: 'دانشگاه شهید بهشتی',
    city: 'تهران',
    group: 'علوم پایه زیستی و دامپزشکی',
    period: 'روزانه',
    minTaraz: 6200,
    lastYearAvgBioPct: 40,
    bestRankByRegion: { 1: 9200, 2: 13800, 3: 7500 },
    maxRankByRegion: { 1: 19500, 2: 28500, 3: 15800 },
  },
];

export function simulateMajorChances(params: {
  rankInRegion: number;
  taraz: number;
  region: QuotaRegion;
  groupFilter: 'همه' | MajorGroup;
  periodFilter: 'همه' | UniversityPeriod;
}): SimulatedMajorResult[] {
  const { rankInRegion, taraz, region, groupFilter, periodFilter } = params;

  return HISTORICAL_CUTOFFS.filter((item) => {
    if (groupFilter !== 'همه' && item.group !== groupFilter) return false;
    if (periodFilter !== 'همه' && item.period !== periodFilter) return false;
    return true;
  })
    .map((item) => {
      const cutoffRank = item.maxRankByRegion[region];
      const bestRank = item.bestRankByRegion[region];

      // Combined rank ratio & taraz delta against historical final report card cutoffs
      const rankRatio = rankInRegion / Math.max(1, cutoffRank);
      const tarazDelta = taraz - item.minTaraz;

      // Logistic curve centered on historical cutoff rank + taraz offset
      const rankScore = (1 - rankRatio) * 3.8;
      const tarazScore = (tarazDelta / 900) * 1.4;
      const combined = 0.65 * rankScore + 0.35 * tarazScore + 0.25;
      const rawProb = 1 / (1 + Math.exp(-combined));
      const probabilityPct = Math.round(Math.max(4, Math.min(97, rawProb * 100)));

      let tier: AdmissionTier = 'low';
      let tierLabel = 'احتمال پایین (انتخاب چالشی)';
      let reasonText = `رتبه شما بالاتر از آخرین رتبه قبولی پارسال در منطقه ${region} است.`;

      if (probabilityPct >= 70) {
        tier = 'high';
        tierLabel = 'احتمال قبولی بالا (مطمئن)';
        reasonText = `رتبه و تراز شما در محدوده امن پذیرفته‌شدگان سال گذشته قرار دارد.`;
      } else if (probabilityPct >= 40) {
        tier = 'borderline';
        tierLabel = 'احتمال مرزی (انتخاب منطقی)';
        reasonText = `نزدیک به مرز آخرین قبولی پارسال؛ مناسب برای چیدمان میانی دفترچه انتخاب رشته.`;
      }

      return {
        ...item,
        cutoffRankForRegion: cutoffRank,
        bestRankForRegion: bestRank,
        probabilityPct,
        tier,
        tierLabel,
        reasonText,
      };
    })
    .sort((a, b) => b.probabilityPct - a.probabilityPct);
}
