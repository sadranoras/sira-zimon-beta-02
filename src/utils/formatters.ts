export function toPersianDigits(input: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(input).replace(/\d/g, (digit) => persianDigits[Number(digit)] ?? digit);
}

export function toEnglishDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

export function normalizeIranPhone(raw: string): string | null {
  const digitsOnly = toEnglishDigits(raw).replace(/[\s\-().+]/g, '');
  let normalized = digitsOnly;
  if (normalized.startsWith('0098')) {
    normalized = `0${normalized.slice(4)}`;
  } else if (normalized.startsWith('98') && normalized.length === 12) {
    normalized = `0${normalized.slice(2)}`;
  } else if (normalized.startsWith('9') && normalized.length === 10) {
    normalized = `0${normalized}`;
  }
  return /^09\d{9}$/.test(normalized) ? normalized : null;
}

export function phoneToSyntheticEmail(normalizedPhone: string): string {
  return `u${normalizedPhone}@phone.biomaze.ir`;
}

export function formatIranScheduleRange(startTimeIso?: string, endTimeIso?: string): string {
  if (!startTimeIso) return '';
  const startDate = new Date(startTimeIso);
  if (Number.isNaN(startDate.getTime())) return '';

  const dateStr = new Intl.DateTimeFormat('fa-IR', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(startDate);
  const startTimeStr = new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(startDate);

  if (endTimeIso) {
    const endDate = new Date(endTimeIso);
    if (!Number.isNaN(endDate.getTime())) {
      const endTimeStr = new Intl.DateTimeFormat('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(endDate);
      return `${dateStr} · ساعت ${startTimeStr} تا ${endTimeStr}`;
    }
  }
  return `${dateStr} · ساعت ${startTimeStr}`;
}

export function formatToman(amount: number): string {
  if (amount === 0) return 'رایگان';
  return `${toPersianDigits(amount.toLocaleString('en-US'))} تومان`;
}

export function formatSecondsToClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  if (hours > 0) {
    const hh = String(hours).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export function slugifySafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  const ts = Date.now().toString(36);
  return `${prefix}-${ts}-${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function computeExamStats(
  questionsCount: number,
  correctCount: number,
  wrongCount: number
): {
  blankCount: number;
  percentage: number;
  taraz: number;
  estimatedRank: number;
} {
  const total = Math.max(1, questionsCount);
  const blankCount = Math.max(0, total - correctCount - wrongCount);
  const rawPct = ((3 * correctCount - wrongCount) / (3 * total)) * 100;
  const percentage = Math.round(rawPct * 10) / 10;

  // Realistic Konkur Taraz curve (range 1000..12000, mean ~5800)
  const clampedPct = Math.max(-33.3, Math.min(100, percentage));
  const taraz = Math.round(
    Math.max(1200, Math.min(11500, 4600 + ((clampedPct + 33.3) / 133.3) * 6200))
  );

  // Realistic estimated rank out of ~18,400 cohort
  const ratio = Math.max(0, Math.min(1, (11500 - taraz) / 10300));
  const estimatedRank = Math.max(1, Math.round(1 + Math.pow(ratio, 2.2) * 18400));

  return {
    blankCount,
    percentage,
    taraz,
    estimatedRank,
  };
}
