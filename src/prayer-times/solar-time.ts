import {
  computeSolarCoordinates,
  julianDay,
  approximateTransit,
  correctedTransit,
  correctedHourAngle,
} from "./astronomical";
import { degreesToRadians, radiansToDegrees } from "./math-utils";
import type { SolarCoordinates } from "./astronomical";

export interface SolarTimeResult {
  transit: number;
  sunrise: number;
  sunset: number;
}

export interface SolarDayData {
  solar: SolarCoordinates;
  prevSolar: SolarCoordinates;
  nextSolar: SolarCoordinates;
  m0: number;
}

const SUNRISE_SUNSET_ALTITUDE = -50.0 / 60.0;

export function computeSolarDayData(
  year: number,
  month: number,
  day: number,
  longitude: number
): SolarDayData {
  const jd = julianDay(year, month, day, 0);
  const solar = computeSolarCoordinates(jd);
  const prevSolar = computeSolarCoordinates(jd - 1);
  const nextSolar = computeSolarCoordinates(jd + 1);
  const m0 = approximateTransit(longitude, solar.apparentSiderealTime, solar.rightAscension);
  return { solar, prevSolar, nextSolar, m0 };
}

export function computeSolarTimeFromData(
  data: SolarDayData,
  latitude: number,
  longitude: number
): SolarTimeResult {
  const { solar, prevSolar, nextSolar, m0 } = data;

  const transit = correctedTransit(
    m0, longitude, solar.apparentSiderealTime, solar.rightAscension,
    prevSolar.rightAscension, nextSolar.rightAscension
  );

  const sunrise = correctedHourAngle(
    m0, SUNRISE_SUNSET_ALTITUDE, { latitude, longitude }, false,
    solar.apparentSiderealTime, solar.rightAscension,
    prevSolar.rightAscension, nextSolar.rightAscension,
    solar.declination, prevSolar.declination, nextSolar.declination
  );

  const sunset = correctedHourAngle(
    m0, SUNRISE_SUNSET_ALTITUDE, { latitude, longitude }, true,
    solar.apparentSiderealTime, solar.rightAscension,
    prevSolar.rightAscension, nextSolar.rightAscension,
    solar.declination, prevSolar.declination, nextSolar.declination
  );

  return { transit, sunrise, sunset };
}

export function computeHourAngleFromData(
  data: SolarDayData,
  latitude: number,
  longitude: number,
  angle: number,
  afterTransit: boolean
): number {
  const { solar, prevSolar, nextSolar, m0 } = data;

  return correctedHourAngle(
    m0, angle, { latitude, longitude }, afterTransit,
    solar.apparentSiderealTime, solar.rightAscension,
    prevSolar.rightAscension, nextSolar.rightAscension,
    solar.declination, prevSolar.declination, nextSolar.declination
  );
}

export function computeAfternoonFromData(
  data: SolarDayData,
  latitude: number,
  longitude: number,
  shadowLength: number
): number {
  const { solar, prevSolar, nextSolar, m0 } = data;

  const tangent = Math.abs(latitude - solar.declination);
  const inverse = shadowLength + Math.tan(degreesToRadians(tangent));
  const angle = radiansToDegrees(Math.atan(1.0 / inverse));

  return correctedHourAngle(
    m0, angle, { latitude, longitude }, true,
    solar.apparentSiderealTime, solar.rightAscension,
    prevSolar.rightAscension, nextSolar.rightAscension,
    solar.declination, prevSolar.declination, nextSolar.declination
  );
}

export function computeSolarTime(
  year: number,
  month: number,
  day: number,
  coordinates: { latitude: number; longitude: number }
): SolarTimeResult {
  const data = computeSolarDayData(year, month, day, coordinates.longitude);
  return computeSolarTimeFromData(data, coordinates.latitude, coordinates.longitude);
}

export function computeHourAngle(
  year: number,
  month: number,
  day: number,
  coordinates: { latitude: number; longitude: number },
  angle: number,
  afterTransit: boolean
): number {
  const data = computeSolarDayData(year, month, day, coordinates.longitude);
  return computeHourAngleFromData(data, coordinates.latitude, coordinates.longitude, angle, afterTransit);
}

export function computeAfternoon(
  year: number,
  month: number,
  day: number,
  coordinates: { latitude: number; longitude: number },
  shadowLength: number
): number {
  const data = computeSolarDayData(year, month, day, coordinates.longitude);
  return computeAfternoonFromData(data, coordinates.latitude, coordinates.longitude, shadowLength);
}
