import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, validateConfig } from '../config/index.js';
import { computeDialGeometry } from '../compute/geometry.js';
import { buildScene, renderSvg } from '../render/dial.js';
import { writeJson, writeSvg } from '../export/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const configPath = path.join(root, 'src/config/sample-config.json');

const config = validateConfig(loadConfig(configPath));
const geometry = computeDialGeometry(config);
const scene = buildScene(geometry, { size: config.dialRadius * 2 + 100 });
const svg = renderSvg(scene);

writeJson(path.join(root, 'outputs/sample-geometry.json'), geometry);
writeSvg(path.join(root, 'outputs/sample-dial.svg'), svg);

console.log('Generated text-based sample outputs in outputs/');
