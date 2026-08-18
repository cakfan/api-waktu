import {
  computeSolarCoordinates,
  julianDay,
  approximateTransit,
  correctedTransit,
  correctedHourAngle,
} from "./astronomical";
import { degreesToRadians, radiansToDegrees } from "./math-utils";

export interface SolarTimeResult {
  transit: number;
  sunrise: number;
  sunset: number;
}

const SUNRISE_SUNSET_ALTITUDE = -50.0 / 60.0;

export function computeSolarTime(
  year: number,
  month: number,
  day: number,
  coordinates: { latitude: number; longitude: number }
): SolarTimeResult {
  const jd = julianDay(year, month, day, 0);
  const prevJd = jd - 1;
  const nextJd = jd + 1;

  const solar = computeSolarCoordinates(jd);
  const prevSolar = computeSolarCoordinates(prevJd);
  const nextSolar = computeSolarCoordinates(nextJd);

  const m0 = approximateTransit(
    coordinates.longitude,
    solar.apparentSiderealTime,
    solar.rightAscension
  );

  const transit = correctedTransit(
    m0,
    coordinates.longitude,
    solar.apparentSiderealTime,
    solar.rightAscension,
    prevSolar.rightAscension,
    nextSolar.rightAscension
  );

  const sunrise = correctedHourAngle(
    m0,
    SUNRISE_SUNSET_ALTITUDE,
    coordinates,
    false,
    solar.apparentSiderealTime,
    solar.rightAscension,
    prevSolar.rightAscension,
    nextSolar.rightAscension,
    solar.declination,
    prevSolar.declination,
    nextSolar.declination
  );

  const sunset = correctedHourAngle(
    m0,
    SUNRISE_SUNSET_ALTITUDE,
    coordinates,
    true,
    solar.apparentSiderealTime,
    solar.rightAscension,
    prevSolar.rightAscension,
    nextSolar.rightAscension,
    solar.declination,
    prevSolar.declination,
    nextSolar.declination
  );

  return { transit, sunrise, sunset };
}

export function computeHourAngle(
  year: number,
  month: number,
  day: number,
  coordinates: { latitude: number; longitude: number },
  angle: number,
  afterTransit: boolean
): number {
  const jd = julianDay(year, month, day, 0);
  const prevJd = jd - 1;
  const nextJd = jd + 1;

  const solar = computeSolarCoordinates(jd);
  const prevSolar = computeSolarCoordinates(prevJd);
  const nextSolar = computeSolarCoordinates(nextJd);

  const m0 = approximateTransit(
    coordinates.longitude,
    solar.apparentSiderealTime,
    solar.rightAscension
  );

  return correctedHourAngle(
    m0,
    angle,
    coordinates,
    afterTransit,
    solar.apparentSiderealTime,
    solar.rightAscension,
    prevSolar.rightAscension,
    nextSolar.rightAscension,
    solar.declination,
    prevSolar.declination,
    nextSolar.declination
  );
}

export function computeAfternoon(
  year: number,
  month: number,
  day: number,
  coordinates: { latitude: number; longitude: number },
  shadowLength: number
): number {
  const jd = julianDay(year, month, day, 0);
  const solar = computeSolarCoordinates(jd);
  const prevSolar = computeSolarCoordinates(jd - 1);
  const nextSolar = computeSolarCoordinates(jd + 1);

  const m0 = approximateTransit(
    coordinates.longitude,
    solar.apparentSiderealTime,
    solar.rightAscension
  );

  const tangent = Math.abs(coordinates.latitude - solar.declination);
  const inverse = shadowLength + Math.tan(degreesToRadians(tangent));
  const angle = radiansToDegrees(Math.atan(1.0 / inverse));

  return correctedHourAngle(
    m0,
    angle,
    coordinates,
    true,
    solar.apparentSiderealTime,
    solar.rightAscension,
    prevSolar.rightAscension,
    nextSolar.rightAscension,
    solar.declination,
    prevSolar.declination,
    nextSolar.declination
  );
}
