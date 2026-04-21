const DEG = Math.PI / 180;

export function toRad(deg) {
  return deg * DEG;
}

export function toDeg(rad) {
  return rad / DEG;
}

// Cooper approximation: sufficient for prototype.
export function solarDeclinationForDayOfYear(dayOfYear) {
  return toRad(23.44) * Math.sin((2 * Math.PI * (284 + dayOfYear)) / 365);
}

export function dayOfYearFromMonth(month, day = 15) {
  const ref = new Date(Date.UTC(2025, month - 1, day));
  const start = new Date(Date.UTC(2025, 0, 1));
  return Math.floor((ref - start) / 86400000) + 1;
}

export function sunVectorHorizontal(latitudeRad, declinationRad, hourAngleRad) {
  const xEast = Math.cos(declinationRad) * Math.sin(hourAngleRad);
  const yNorth =
    Math.cos(latitudeRad) * Math.sin(declinationRad) -
    Math.sin(latitudeRad) * Math.cos(declinationRad) * Math.cos(hourAngleRad);
  const zUp =
    Math.sin(latitudeRad) * Math.sin(declinationRad) +
    Math.cos(latitudeRad) * Math.cos(declinationRad) * Math.cos(hourAngleRad);
  return { xEast, yNorth, zUp };
}

export function shadowDirectionFromSun(sunVector) {
  return { x: -sunVector.xEast, y: -sunVector.yNorth };
}

export function intersectRayWithCircle(origin, direction, radius) {
  const { x: ox, y: oy } = origin;
  const { x: dx, y: dy } = direction;
  const a = dx * dx + dy * dy;
  const b = 2 * (ox * dx + oy * dy);
  const c = ox * ox + oy * oy - radius * radius;
  const disc = b * b - 4 * a * c;
  if (disc < 0 || a === 0) return null;
  const root = Math.sqrt(disc);
  const t1 = (-b - root) / (2 * a);
  const t2 = (-b + root) / (2 * a);
  const t = Math.max(t1, t2);
  if (t <= 0) return null;
  return { x: ox + t * dx, y: oy + t * dy, t };
}
