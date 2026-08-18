import {
  computeSolarTimeFromData,
  computeHourAngleFromData,
  computeAfternoonFromData,
  computeSolarDayData,
} from "./solar-time";

export interface PrayerTimesParams {
  fajrAngle: number;
  ishaAngle: number;
  ishaInterval: number;
  methodAdjustments: {
    fajr: number;
    sunrise: number;
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number;
  };
  rounding: "nearest" | "up" | "none";
  madhab: "shafi" | "hanafi";
}

export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export const KEMENAG: PrayerTimesParams = {
  fajrAngle: 20,
  ishaAngle: 18,
  ishaInterval: 0,
  methodAdjustments: {
    fajr: 0,
    sunrise: 0,
    dhuhr: 1,
    asr: 0,
    maghrib: 0,
    isha: 0,
  },
  rounding: "up",
  madhab: "shafi",
};

export const METHODS: Record<string, PrayerTimesParams> = {
  Kemenag: KEMENAG,
  ISNA: {
    fajrAngle: 15,
    ishaAngle: 15,
    ishaInterval: 0,
    methodAdjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    rounding: "nearest",
    madhab: "shafi",
  },
  MWL: {
    fajrAngle: 18,
    ishaAngle: 17,
    ishaInterval: 0,
    methodAdjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    rounding: "nearest",
    madhab: "shafi",
  },
  Egypt: {
    fajrAngle: 19.5,
    ishaAngle: 17.5,
    ishaInterval: 0,
    methodAdjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    rounding: "nearest",
    madhab: "shafi",
  },
  Karachi: {
    fajrAngle: 18,
    ishaAngle: 18,
    ishaInterval: 0,
    methodAdjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    rounding: "nearest",
    madhab: "hanafi",
  },
  Tehran: {
    fajrAngle: 17.7,
    ishaAngle: 14,
    ishaInterval: 0,
    methodAdjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    rounding: "nearest",
    madhab: "shafi",
  },
  JAKIM: {
    fajrAngle: 20,
    ishaAngle: 18,
    ishaInterval: 0,
    methodAdjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    rounding: "nearest",
    madhab: "shafi",
  },
  Singapore: {
    fajrAngle: 20,
    ishaAngle: 18,
    ishaInterval: 0,
    methodAdjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
    rounding: "nearest",
    madhab: "shafi",
  },
};

function formatTime(hours: number): string {
  let h = Math.floor(hours);
  let m = Math.floor((hours - h) * 60 + 0.5);
  if (m >= 60) {
    h += 1;
    m -= 60;
  }
  h = ((h % 24) + 24) % 24;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function roundedMinute(
  hours: number,
  rounding: "nearest" | "up" | "none"
): number {
  const totalSeconds = hours * 3600;
  const seconds = Math.round(totalSeconds) % 60;
  let offset = 0;

  if (rounding === "up") {
    offset = seconds > 0 ? 60 - seconds : 0;
  } else if (rounding === "nearest") {
    offset = seconds >= 30 ? 60 - seconds : -seconds;
  }

  return (totalSeconds + offset) / 3600;
}

function isValidTime(hours: number): boolean {
  return !isNaN(hours) && isFinite(hours);
}

export function computePrayerTimes(
  year: number,
  month: number,
  day: number,
  latitude: number,
  longitude: number,
  params: PrayerTimesParams = KEMENAG,
  timezoneOffset?: number
): PrayerTimes {
  if (timezoneOffset === undefined) {
    timezoneOffset = Math.round(longitude / 15);
  }

  const todayData = computeSolarDayData(year, month, day, longitude);
  const tomorrowData = computeSolarDayData(year, month, day + 1, longitude);

  const solarTime = computeSolarTimeFromData(todayData, latitude, longitude);
  const tomorrowSolarTime = computeSolarTimeFromData(tomorrowData, latitude, longitude);

  const toUtcDate = (utcHours: number, y: number, m: number, d: number): Date => {
    const totalSeconds = Math.round(utcHours * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const min = Math.floor((totalSeconds % 3600) / 60);
    const sec = totalSeconds % 60;
    return new Date(Date.UTC(y, m - 1, d, h, min, sec));
  };

  const sunsetDate = toUtcDate(solarTime.sunset, year, month, day);
  const tomorrowSunriseDate = toUtcDate(tomorrowSolarTime.sunrise, year, month, day + 1);
  const nightSeconds = (tomorrowSunriseDate.getTime() - sunsetDate.getTime()) / 1000;
  const nightHours = nightSeconds / 3600;

  let fajrTime =
    computeHourAngleFromData(todayData, latitude, longitude, -params.fajrAngle, false) +
    timezoneOffset;

  const safeFajrPortion = 1 / 2;
  const safeFajr = solarTime.sunrise + timezoneOffset - safeFajrPortion * nightHours;
  if (isNaN(fajrTime) || safeFajr > fajrTime) {
    fajrTime = safeFajr;
  }

  let ishaTime: number;
  if (params.ishaInterval > 0) {
    ishaTime = solarTime.sunset + timezoneOffset + params.ishaInterval / 60;
  } else {
    ishaTime =
      computeHourAngleFromData(todayData, latitude, longitude, -params.ishaAngle, true) +
      timezoneOffset;

    const safeIshaPortion = 1 / 2;
    const safeIsha = solarTime.sunset + timezoneOffset + safeIshaPortion * nightHours;
    if (isNaN(ishaTime) || safeIsha < ishaTime) {
      ishaTime = safeIsha;
    }
  }

  const shadowLength = params.madhab === "hanafi" ? 2 : 1;
  const afternoonTime = computeAfternoonFromData(todayData, latitude, longitude, shadowLength);

  const sunriseTime = solarTime.sunrise + timezoneOffset;
  const dhuhrTime = solarTime.transit + timezoneOffset;
  const asrTime = afternoonTime + timezoneOffset;
  const maghribTime = solarTime.sunset + timezoneOffset;

  if (!isValidTime(fajrTime) || !isValidTime(sunriseTime) || !isValidTime(dhuhrTime) ||
      !isValidTime(asrTime) || !isValidTime(maghribTime) || !isValidTime(ishaTime)) {
    throw new Error(`Cannot compute prayer times for latitude ${latitude}, longitude ${longitude}. Location may be in polar region.`);
  }

  const rawTimes = {
    fajr: fajrTime,
    sunrise: sunriseTime,
    dhuhr: dhuhrTime,
    asr: asrTime,
    maghrib: maghribTime,
    isha: ishaTime,
  };

  const adj = params.methodAdjustments;
  const adjusted = {
    fajr: rawTimes.fajr + adj.fajr / 60,
    sunrise: rawTimes.sunrise + adj.sunrise / 60,
    dhuhr: rawTimes.dhuhr + adj.dhuhr / 60,
    asr: rawTimes.asr + adj.asr / 60,
    maghrib: rawTimes.maghrib + adj.maghrib / 60,
    isha: rawTimes.isha + adj.isha / 60,
  };

  return {
    fajr: formatTime(roundedMinute(adjusted.fajr, params.rounding)),
    sunrise: formatTime(roundedMinute(adjusted.sunrise, params.rounding)),
    dhuhr: formatTime(roundedMinute(adjusted.dhuhr, params.rounding)),
    asr: formatTime(roundedMinute(adjusted.asr, params.rounding)),
    maghrib: formatTime(roundedMinute(adjusted.maghrib, params.rounding)),
    isha: formatTime(roundedMinute(adjusted.isha, params.rounding)),
  };
}
