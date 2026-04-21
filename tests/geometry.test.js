import test from 'node:test';
import assert from 'node:assert/strict';
import { toRad, sunVectorHorizontal, shadowDirectionFromSun, intersectRayWithCircle } from '../src/compute/solar.js';
import { computeDialGeometry } from '../src/compute/geometry.js';
import sample from '../src/config/sample-config.json' with { type: 'json' };

test('hour-angle symmetry around solar noon at equinox', () => {
  const lat = toRad(52.52);
  const dec = 0;
  const h1 = toRad(30);
  const h2 = toRad(-30);
  const s1 = shadowDirectionFromSun(sunVectorHorizontal(lat, dec, h1));
  const s2 = shadowDirectionFromSun(sunVectorHorizontal(lat, dec, h2));
  assert.ok(Math.abs(s1.x + s2.x) < 1e-10);
  assert.ok(Math.abs(s1.y - s2.y) < 1e-10);
});

test('ray-circle intersection lands on circle', () => {
  const hit = intersectRayWithCircle({ x: 0, y: 0 }, { x: 1, y: 2 }, 100);
  assert.ok(hit);
  const rr = Math.hypot(hit.x, hit.y);
  assert.ok(Math.abs(rr - 100) < 1e-7);
});

test('regression sample: january gnomon marker south of center in northern hemisphere', () => {
  const geom = computeDialGeometry(sample);
  const january = geom.monthMarkers.find((m) => m.month === 1);
  assert.ok(january);
  assert.ok(january.gnomon.y < 0);
});
