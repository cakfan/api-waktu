import {
  degreesToRadians,
  radiansToDegrees,
  unwindAngle,
  normalizeToScale,
  quadrantShiftAngle,
} from "./math-utils";

function isLeapYear(year: number): boolean {
  if (year % 4 !== 0) return false;
  if (year % 100 === 0 && year % 400 !== 0) return false;
  return true;
}

export function julianDay(
  year: number,
  month: number,
  day: number,
  hours = 0
): number {
  const Y = month > 2 ? year : year - 1;
  const M = month > 2 ? month : month + 12;
  const D = day + hours / 24;
  const A = Math.trunc(Y / 100);
  const B = 2 - A + Math.trunc(A / 4);

  return (
    Math.trunc(365.25 * (Y + 4716)) +
    Math.trunc(30.6001 * (M + 1)) +
    D +
    B -
    1524.5
  );
}

export function julianCentury(julianDay: number): number {
  return (julianDay - 2451545.0) / 36525;
}

export function dayOfYear(year: number, month: number, day: number): number {
  const feb = isLeapYear(year) ? 29 : 28;
  const months = [31, feb, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let total = 0;
  for (let i = 0; i < month - 1; i++) {
    total += months[i]!;
  }
  return total + day;
}

function meanSolarLongitude(T: number): number {
  const L0 = 280.4664567 + 36000.76983 * T + 0.0003032 * T * T;
  return unwindAngle(L0);
}

function meanLunarLongitude(T: number): number {
  return unwindAngle(218.3165 + 481267.8813 * T);
}

function ascendingLunarNodeLongitude(T: number): number {
  const Omega =
    125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000;
  return unwindAngle(Omega);
}

function meanSolarAnomaly(T: number): number {
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  return unwindAngle(M);
}

function solarEquationOfTheCenter(T: number, meanAnomaly: number): number {
  const Mrad = degreesToRadians(meanAnomaly);
  const term1 =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad);
  const term2 = (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad);
  const term3 = 0.000289 * Math.sin(3 * Mrad);
  return term1 + term2 + term3;
}

function apparentSolarLongitude(T: number, meanLongitude: number): number {
  const longitude =
    meanLongitude + solarEquationOfTheCenter(T, meanSolarAnomaly(T));
  const Omega = 125.04 - 1934.136 * T;
  const Lambda =
    longitude - 0.00569 - 0.00478 * Math.sin(degreesToRadians(Omega));
  return unwindAngle(Lambda);
}

function meanObliquityOfTheEcliptic(T: number): number {
  return (
    23.439291 -
    0.013004167 * T -
    0.0000001639 * T * T +
    0.0000005036 * T * T * T
  );
}

function apparentObliquityOfTheEcliptic(
  T: number,
  meanObliquity: number
): number {
  const Omega = 125.04 - 1934.136 * T;
  return meanObliquity + 0.00256 * Math.cos(degreesToRadians(Omega));
}

function meanSiderealTime(T: number): number {
  const JD = T * 36525 + 2451545.0;
  const Theta =
    280.46061837 +
    360.98564736629 * (JD - 2451545) +
    0.000387933 * T * T -
    (T * T * T) / 38710000;
  return unwindAngle(Theta);
}

function nutationInLongitude(
  T: number,
  solarLongitude: number,
  lunarLongitude: number,
  ascendingNode: number
): number {
  const L0 = solarLongitude;
  const Lp = lunarLongitude;
  const Omega = ascendingNode;
  return (
    (-17.2 / 3600) * Math.sin(degreesToRadians(Omega)) -
    (1.32 / 3600) * Math.sin(2 * degreesToRadians(L0)) -
    (0.23 / 3600) * Math.sin(2 * degreesToRadians(Lp)) +
    (0.21 / 3600) * Math.sin(2 * degreesToRadians(Omega))
  );
}

function nutationInObliquity(
  T: number,
  solarLongitude: number,
  lunarLongitude: number,
  ascendingNode: number
): number {
  const L0 = solarLongitude;
  const Lp = lunarLongitude;
  const Omega = ascendingNode;
  return (
    (9.2 / 3600) * Math.cos(degreesToRadians(Omega)) +
    (0.57 / 3600) * Math.cos(2 * degreesToRadians(L0)) +
    (0.1 / 3600) * Math.cos(2 * degreesToRadians(Lp)) +
    (0.09 / 3600) * Math.cos(2 * degreesToRadians(Omega))
  );
}

function interpolate(y2: number, y1: number, y3: number, n: number): number {
  const a = y2 - y1;
  const b = y3 - y2;
  const c = b - a;
  return y2 + (n / 2) * (a + b + n * c);
}

function interpolateAngles(
  y2: number,
  y1: number,
  y3: number,
  n: number
): number {
  const a = unwindAngle(y2 - y1);
  const b = unwindAngle(y3 - y2);
  const c = b - a;
  return y2 + (n / 2) * (a + b + n * c);
}

export interface SolarCoordinates {
  declination: number;
  rightAscension: number;
  apparentSiderealTime: number;
}

export function computeSolarCoordinates(jd: number): SolarCoordinates {
  const T = julianCentury(jd);
  const L0 = meanSolarLongitude(T);
  const Lp = meanLunarLongitude(T);
  const Omega = ascendingLunarNodeLongitude(T);
  const Lambda = degreesToRadians(apparentSolarLongitude(T, L0));
  const Theta0 = meanSiderealTime(T);
  const dPsi = nutationInLongitude(T, L0, Lp, Omega);
  const dEpsilon = nutationInObliquity(T, L0, Lp, Omega);
  const Epsilon0 = meanObliquityOfTheEcliptic(T);
  const EpsilonApparent = degreesToRadians(
    apparentObliquityOfTheEcliptic(T, Epsilon0)
  );

  const declination = radiansToDegrees(
    Math.asin(Math.sin(EpsilonApparent) * Math.sin(Lambda))
  );

  const rightAscension = unwindAngle(
    radiansToDegrees(
      Math.atan2(
        Math.cos(EpsilonApparent) * Math.sin(Lambda),
        Math.cos(Lambda)
      )
    )
  );

  const apparentSiderealTime =
    Theta0 +
    (dPsi * 3600 * Math.cos(degreesToRadians(Epsilon0 + dEpsilon))) / 3600;

  return { declination, rightAscension, apparentSiderealTime };
}

export function approximateTransit(
  longitude: number,
  siderealTime: number,
  rightAscension: number
): number {
  const Lw = longitude * -1;
  let m0 = normalizeToScale((rightAscension + Lw - siderealTime) / 360, 1);

  const expectedTransit = normalizeToScale((12.0 - longitude / 15.0) / 24.0, 1);
  if (m0 - expectedTransit > 0.5) {
    m0 -= 1.0;
  } else if (expectedTransit - m0 > 0.5) {
    m0 += 1.0;
  }

  return m0;
}

export function correctedTransit(
  approximateTransit: number,
  longitude: number,
  siderealTime: number,
  rightAscension: number,
  prevRightAscension: number,
  nextRightAscension: number
): number {
  const Lw = longitude * -1;
  const Theta = unwindAngle(siderealTime + 360.985647 * approximateTransit);
  const a = unwindAngle(
    interpolateAngles(rightAscension, prevRightAscension, nextRightAscension, approximateTransit)
  );
  const H = quadrantShiftAngle(Theta - Lw - a);
  const dm = H / -360;
  return (approximateTransit + dm) * 24;
}

export function correctedHourAngle(
  approximateTransit: number,
  angle: number,
  coordinates: { latitude: number; longitude: number },
  afterTransit: boolean,
  siderealTime: number,
  rightAscension: number,
  prevRightAscension: number,
  nextRightAscension: number,
  declination: number,
  prevDeclination: number,
  nextDeclination: number
): number {
  const Lw = coordinates.longitude * -1;

  const term1 = Math.sin(degreesToRadians(angle));
  const term2 =
    Math.sin(degreesToRadians(coordinates.latitude)) *
    Math.sin(degreesToRadians(declination));
  const term3 =
    Math.cos(degreesToRadians(coordinates.latitude)) *
    Math.cos(degreesToRadians(declination));
  const H0 = radiansToDegrees(Math.acos((term1 - term2) / term3));

  const m = afterTransit
    ? approximateTransit + H0 / 360
    : approximateTransit - H0 / 360;

  const Theta = unwindAngle(siderealTime + 360.985647 * m);
  const a = unwindAngle(
    interpolateAngles(rightAscension, prevRightAscension, nextRightAscension, m)
  );
  const delta = interpolate(declination, prevDeclination, nextDeclination, m);
  const H = Theta - Lw - a;

  const h = altitudeOfCelestialBody(coordinates.latitude, delta, H);
  const term4 = h - angle;
  const term5 =
    360 *
    Math.cos(degreesToRadians(delta)) *
    Math.cos(degreesToRadians(coordinates.latitude)) *
    Math.sin(degreesToRadians(H));
  const dm = term4 / term5;

  return (m + dm) * 24;
}

function altitudeOfCelestialBody(
  observerLatitude: number,
  declination: number,
  localHourAngle: number
): number {
  const Phi = observerLatitude;
  const delta = declination;
  const H = localHourAngle;
  const term1 =
    Math.sin(degreesToRadians(Phi)) * Math.sin(degreesToRadians(delta));
  const term2 =
    Math.cos(degreesToRadians(Phi)) *
    Math.cos(degreesToRadians(delta)) *
    Math.cos(degreesToRadians(H));
  return radiansToDegrees(Math.asin(term1 + term2));
}
