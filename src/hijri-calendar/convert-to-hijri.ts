const HIJRI_MONTH_NAMES = [
  "Muharram",
  "Safar",
  "Rabiul Awal",
  "Rabiul Akhir",
  "Jumadil Awal",
  "Jumadil Akhir",
  "Rajab",
  "Sya'ban",
  "Ramadan",
  "Syawal",
  "Dzulqaidah",
  "Dzulhijjah",
] as const;

const HIJRI_EPOCH_JDN = 1948440;

export type HijriMonthName = (typeof HIJRI_MONTH_NAMES)[number];

export interface HijriDate {
  year: number;
  month: number;
  day: number;
  monthName: HijriMonthName;
  daysInMonth: number;
}

function toJulianDayNumber(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

function julianDayToGregorian(jdn: number): { year: number; month: number; day: number } {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);

  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);

  return { year, month, day };
}

function isHijriLeapYear(year: number): boolean {
  return ((11 * year + 14) % 30) < 11;
}

export function getDaysInHijriMonth(year: number, month: number): number {
  if (month % 2 === 1) return 30;
  if (month < 12) return 29;
  return isHijriLeapYear(year) ? 30 : 29;
}

export function getDaysInHijriYear(year: number): number {
  let total = 0;
  for (let m = 1; m <= 12; m++) {
    total += getDaysInHijriMonth(year, m);
  }
  return total;
}

export function gregorianToHijri(
  year: number,
  month: number,
  day: number
): HijriDate {
  const jd = toJulianDayNumber(year, month, day);

  const l = jd - HIJRI_EPOCH_JDN + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;

  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);

  const l3 = l2 -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;

  const hijriMonth = Math.floor((24 * l3) / 709);
  const hijriDay = l3 - Math.floor((709 * hijriMonth) / 24);
  const hijriYear = 30 * n + j - 30;

  const monthName = HIJRI_MONTH_NAMES[hijriMonth - 1]!;
  const daysInMonth = getDaysInHijriMonth(hijriYear, hijriMonth);

  return {
    year: hijriYear,
    month: hijriMonth,
    day: hijriDay,
    monthName,
    daysInMonth,
  };
}

export function hijriToGregorian(
  year: number,
  month: number,
  day: number
): { year: number; month: number; day: number } {
  const jd = Math.floor(
    (11 * year + 3) / 30 +
    354 * year +
    30 * month -
    Math.floor((month - 1) / 2) +
    day +
    1948440 -
    385
  );

  return julianDayToGregorian(jd);
}

export function getHijriMonthName(month: number): HijriMonthName {
  return HIJRI_MONTH_NAMES[month - 1]!;
}
