import fs from 'node:fs';
import zlib from 'node:zlib';

export function writeJson(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

export function writeSvg(path, svg) {
  fs.writeFileSync(path, svg, 'utf8');
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function setPixel(image, x, y, rgba) {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) return;
  const idx = (y * image.width + x) * 4;
  image.data[idx] = rgba[0];
  image.data[idx + 1] = rgba[1];
  image.data[idx + 2] = rgba[2];
  image.data[idx + 3] = rgba[3];
}

function drawLine(image, x0, y0, x1, y1, rgba) {
  let x = Math.round(x0), y = Math.round(y0);
  const tx = Math.round(x1), ty = Math.round(y1);
  const dx = Math.abs(tx - x), sx = x < tx ? 1 : -1;
  const dy = -Math.abs(ty - y), sy = y < ty ? 1 : -1;
  let err = dx + dy;
  while (true) {
    setPixel(image, x, y, rgba);
    if (x === tx && y === ty) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
}

function drawCircle(image, cx, cy, r, rgba) {
  const steps = Math.max(64, Math.round(2 * Math.PI * r));
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    setPixel(image, Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a)), rgba);
  }
}

function fillCircle(image, cx, cy, r, rgba) {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r) setPixel(image, cx + x, cy + y, rgba);
    }
  }
}

export function writePng(path, scene) {
  const w = Math.round(scene.size);
  const h = Math.round(scene.size);
  const image = { width: w, height: h, data: Buffer.alloc(w * h * 4, 255) };

  for (const layer of scene.layers) {
    if (layer.type === 'map-placeholder') {
      const x0 = Math.round(layer.rect.x), y0 = Math.round(layer.rect.y);
      const x1 = Math.round(layer.rect.x + layer.rect.w), y1 = Math.round(layer.rect.y + layer.rect.h);
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) setPixel(image, x, y, [243, 246, 249, 255]);
    }
    if (layer.type === 'dial-circle') drawCircle(image, layer.center, layer.center, layer.radius, [15, 23, 42, 255]);
    if (layer.type === 'shadow-line') drawLine(image, layer.from.x, layer.from.y, layer.to.x, layer.to.y, [37, 99, 235, 180]);
    if (layer.type === 'gnomon-marker') fillCircle(image, Math.round(layer.x), Math.round(layer.y), 3, [220, 38, 38, 255]);
  }

  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    image.data.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }

  const signature = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const idat = zlib.deflateSync(raw);
  const png = Buffer.concat([signature, pngChunk('IHDR', ihdr), pngChunk('IDAT', idat), pngChunk('IEND', Buffer.alloc(0))]);
  fs.writeFileSync(path, png);
}

export function writePdf(path, scene) {
  const width = 595.28, height = 841.89;
  const scale = Math.min((width - 48) / scene.size, (height - 48) / scene.size);
  const ox = (width - scene.size * scale) / 2;
  const oy = (height - scene.size * scale) / 2;
  const tx = (v) => ox + v * scale;
  const ty = (v) => height - (oy + v * scale);

  const cmds = [];
  cmds.push('1 1 1 rg 0 0 595.28 841.89 re f');
  for (const layer of scene.layers) {
    if (layer.type === 'dial-circle') {
      const c = 0.5522847498 * layer.radius;
      const cx = tx(layer.center), cy = ty(layer.center), r = layer.radius * scale, k = c * scale;
      cmds.push('0.06 0.09 0.16 RG 1 w');
      cmds.push(`${cx+r} ${cy} m ${cx+r} ${cy+k} ${cx+k} ${cy+r} ${cx} ${cy+r} c ${cx-k} ${cy+r} ${cx-r} ${cy+k} ${cx-r} ${cy} c ${cx-r} ${cy-k} ${cx-k} ${cy-r} ${cx} ${cy-r} c ${cx+k} ${cy-r} ${cx+r} ${cy-k} ${cx+r} ${cy} c S`);
    }
    if (layer.type === 'shadow-line') {
      cmds.push('0.15 0.39 0.92 RG 0.5 w');
      cmds.push(`${tx(layer.from.x)} ${ty(layer.from.y)} m ${tx(layer.to.x)} ${ty(layer.to.y)} l S`);
    }
    if (layer.type === 'gnomon-marker') {
      const x = tx(layer.x), y = ty(layer.y), r = 2.2;
      cmds.push('0.86 0.15 0.15 rg');
      cmds.push(`${x} ${y} ${r} 0 360 arc f`);
    }
  }

  // replace unsupported arc by small circle polygon approximation
  const normalized = cmds.flatMap((c) => c.includes(' arc ') ? [] : [c]);
  for (const layer of scene.layers.filter((l) => l.type === 'gnomon-marker')) {
    const x = tx(layer.x), y = ty(layer.y), r = 2.2;
    normalized.push('0.86 0.15 0.15 rg');
    normalized.push(`${x+r} ${y} m ${x} ${y+r} l ${x-r} ${y} l ${x} ${y-r} l h f`);
  }

  const stream = normalized.join('\n') + '\n';
  const objects = [];
  objects.push('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj');
  objects.push('2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj');
  objects.push(`3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Contents 4 0 R >> endobj`);
  objects.push(`4 0 obj << /Length ${Buffer.byteLength(stream)} >> stream\n${stream}endstream endobj`);

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const obj of objects) { offsets.push(Buffer.byteLength(pdf)); pdf += obj + '\n'; }
  const xrefPos = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  fs.writeFileSync(path, pdf);
  return Promise.resolve();
}
