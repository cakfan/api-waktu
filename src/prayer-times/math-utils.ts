export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function normalizeToScale(value: number, max: number): number {
  return value - max * Math.floor(value / max);
}

export function unwindAngle(angle: number): number {
  return normalizeToScale(angle, 360);
}

export function quadrantShiftAngle(angle: number): number {
  if (angle >= -180 && angle <= 180) {
    return angle;
  }
  return angle - 360 * Math.round(angle / 360);
}
