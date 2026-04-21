function fmt(n) {
  return Number(n.toFixed(2));
}

function toCanvasPoint(p, size) {
  return { x: size / 2 + p.x, y: size / 2 - p.y };
}

export function buildScene(geometry, options = {}) {
  const size = options.size || geometry.radius * 2 + 80;
  const center = size / 2;
  const layers = [];

  if (geometry.input.styleMode === 'with-map') {
    layers.push({
      type: 'map-placeholder',
      rect: { x: 20, y: 20, w: size - 40, h: size - 40 }
    });
  }

  layers.push({ type: 'dial-circle', center, radius: geometry.radius });

  for (const marker of geometry.monthMarkers) {
    const gp = toCanvasPoint(marker.gnomon, size);
    layers.push({ type: 'gnomon-marker', month: marker.month, x: gp.x, y: gp.y });
  }

  for (const line of geometry.hourLines) {
    const gp = toCanvasPoint(line.gnomon, size);
    for (const seg of line.segments) {
      const p = toCanvasPoint(seg.point, size);
      layers.push({
        type: 'shadow-line',
        month: line.month,
        hour: seg.solarHour,
        from: gp,
        to: p
      });
    }
  }

  return { size, center, layers };
}

export function renderSvg(scene) {
  const parts = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${scene.size}" height="${scene.size}" viewBox="0 0 ${scene.size} ${scene.size}">`);
  parts.push('<rect width="100%" height="100%" fill="white"/>');
  for (const layer of scene.layers) {
    if (layer.type === 'map-placeholder') {
      parts.push(`<rect x="${layer.rect.x}" y="${layer.rect.y}" width="${layer.rect.w}" height="${layer.rect.h}" fill="#f3f6f9" stroke="#d0dae3" stroke-dasharray="6 4"/>`);
      parts.push(`<text x="${layer.rect.x + 8}" y="${layer.rect.y + 20}" font-size="12" fill="#7a8a99">Map placeholder layer</text>`);
    }
    if (layer.type === 'dial-circle') {
      parts.push(`<circle cx="${fmt(layer.center)}" cy="${fmt(layer.center)}" r="${fmt(layer.radius)}" fill="none" stroke="#0f172a" stroke-width="2"/>`);
    }
    if (layer.type === 'shadow-line') {
      parts.push(`<line x1="${fmt(layer.from.x)}" y1="${fmt(layer.from.y)}" x2="${fmt(layer.to.x)}" y2="${fmt(layer.to.y)}" stroke="#2563eb" stroke-width="0.8" opacity="0.55"/>`);
    }
    if (layer.type === 'gnomon-marker') {
      parts.push(`<circle cx="${fmt(layer.x)}" cy="${fmt(layer.y)}" r="3.2" fill="#dc2626"/>`);
      parts.push(`<text x="${fmt(layer.x + 5)}" y="${fmt(layer.y - 5)}" font-size="10" fill="#991b1b">M${layer.month}</text>`);
    }
  }
  parts.push('</svg>');
  return parts.join('');
}
