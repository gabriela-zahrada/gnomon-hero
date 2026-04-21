import {
  dayOfYearFromMonth,
  intersectRayWithCircle,
  shadowDirectionFromSun,
  solarDeclinationForDayOfYear,
  sunVectorHorizontal,
  toRad
} from './solar.js';

function monthDeclination(month) {
  return solarDeclinationForDayOfYear(dayOfYearFromMonth(month, 15));
}

function gnomonYOffsetCircularizedAnalemmatic(radius, latitudeRad, declinationRad) {
  // Assumption: analemmatic displacement y = M*cos(phi)*tan(delta), circularized with M=radius.
  return radius * Math.cos(latitudeRad) * Math.tan(declinationRad);
}

export function computeDialGeometry(config) {
  const latitudeRad = toRad(config.latitude);
  const northOffsetRad = toRad(config.northOffsetDeg || 0);
  const radius = config.dialRadius;
  const interval = config.hourIntervalMinutes;
  const hours = [];
  for (let m = -360; m <= 360; m += interval) {
    hours.push(12 + m / 60);
  }

  const monthMarkers = [];
  if (config.gnomonPositioning?.type === 'month') {
    for (const month of config.gnomonPositioning.months) {
      const decl = monthDeclination(month);
      const y = config.dialMode === 'movable'
        ? gnomonYOffsetCircularizedAnalemmatic(radius, latitudeRad, decl)
        : 0;
      monthMarkers.push({ month, declinationRad: decl, gnomon: { x: 0, y } });
    }
  }

  const hourLines = [];
  for (const marker of monthMarkers) {
    const segments = [];
    for (const h of hours) {
      const hourAngleRad = toRad((h - 12) * 15);
      const sun = sunVectorHorizontal(latitudeRad, marker.declinationRad, hourAngleRad);
      if (sun.zUp <= 0) continue;
      const shadow = shadowDirectionFromSun(sun);
      const hit = intersectRayWithCircle(marker.gnomon, shadow, radius);
      if (!hit) continue;
      const xr = hit.x * Math.cos(northOffsetRad) - hit.y * Math.sin(northOffsetRad);
      const yr = hit.x * Math.sin(northOffsetRad) + hit.y * Math.cos(northOffsetRad);
      segments.push({ solarHour: h, point: { x: xr, y: yr } });
    }
    hourLines.push({ month: marker.month, gnomon: marker.gnomon, segments });
  }

  return {
    meta: {
      mode: config.dialMode,
      model: config.gnomonPositioning?.model || 'none',
      assumptions: [
        'Horizontal dial plane with vertical gnomon shadow projection.',
        'Solar declination uses Cooper day-of-year approximation.',
        'Movable gnomon uses circularized analemmatic displacement y = R*cos(phi)*tan(delta).',
        'Equation of time and atmospheric refraction are ignored.'
      ]
    },
    input: config,
    radius,
    monthMarkers,
    hourLines
  };
}
