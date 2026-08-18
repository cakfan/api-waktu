const PASARAN_NAMES = ["Pon", "Wage", "Kliwon", "Legi", "Pahing"] as const;

const DAY_OF_WEEK_NAMES = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
] as const;

const WUKU_NAMES = [
  "Sinta",
  "Landep",
  "Wukir",
  "Kurantil",
  "Tolu",
  "Gumbreg",
  "Warigalit",
  "Warigagung",
  "Julungwangi",
  "Sungsang",
  "Galungan",
  "Kuningan",
  "Langkir",
  "Mandasiya",
  "Julungpujut",
  "Pahang",
  "Kuruwelut",
  "Marakeh",
  "Tambir",
  "Medangkungan",
  "Maktal",
  "Wuye",
  "Manahil",
  "Prangbakat",
  "Bala",
  "Wugu",
  "Wayang",
  "Kulawu",
  "Dukut",
  "Watugunung",
] as const;

const NEPTU_WEEKDAY = [1, 3, 2, 4, 3, 5, 5] as const;
const NEPTU_PASARAN = [4, 3, 8, 3, 7] as const;

const WUKU_NAMES_COUNT = 30;
const MATLAB_EPOCH_TO_JDN = 1721059;
const WUKU_OFFSET = 25;

export type PasaranName = (typeof PASARAN_NAMES)[number];
export type DayOfWeekName = (typeof DAY_OF_WEEK_NAMES)[number];
export type WukuName = (typeof WUKU_NAMES)[number];

export interface JavaneseDateResult {
  dayOfWeek: DayOfWeekName;
  pasaran: PasaranName;
  wuku: WukuName;
  neptu: number;
  date: string;
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

function computeDayOfWeekAndPasaran(
  year: number,
  month: number,
  day: number
): { dayOfWeekIndex: number; pasaranIndex: number } {
  let adjustedMonth = month;
  let adjustedYear = year;

  if (month < 3) {
    adjustedMonth = month + 13;
    adjustedYear = year - 1;
  } else {
    adjustedMonth = month + 1;
  }

  const century = Math.floor(adjustedYear / 100);
  const yearInCentury = adjustedYear % 100;

  const w =
    day +
    Math.floor((153 * adjustedMonth) / 5) +
    15 * yearInCentury +
    Math.floor(yearInCentury / 4) +
    19 * century +
    Math.floor(century / 4) +
    5;

  const dayOfWeekIndex = ((w % 7) + 7) % 7;
  const pasaranIndex = ((w % 5) + 5) % 5;

  return { dayOfWeekIndex, pasaranIndex };
}

function computeWukuIndex(jdn: number): number {
  const matlabDatenum = jdn - MATLAB_EPOCH_TO_JDN;
  const raw = Math.floor((matlabDatenum - 2) / 7) + WUKU_OFFSET;
  return ((raw % WUKU_NAMES_COUNT) + WUKU_NAMES_COUNT) % WUKU_NAMES_COUNT;
}

export function convertToJavanese(
  year: number,
  month: number,
  day: number
): JavaneseDateResult {
  const jdn = toJulianDayNumber(year, month, day);
  const { dayOfWeekIndex, pasaranIndex } = computeDayOfWeekAndPasaran(year, month, day);
  const wukuIndex = computeWukuIndex(jdn);

  const dayOfWeek = DAY_OF_WEEK_NAMES[dayOfWeekIndex]!;
  const pasaran = PASARAN_NAMES[pasaranIndex]!;
  const wuku = WUKU_NAMES[wukuIndex]!;
  const neptu = NEPTU_WEEKDAY[dayOfWeekIndex]! + NEPTU_PASARAN[pasaranIndex]!;

  const monthStr = String(month).padStart(2, "0");
  const dayStr = String(day).padStart(2, "0");
  const date = `${year}-${monthStr}-${dayStr}`;

  return { dayOfWeek, pasaran, wuku, neptu, date };
}
