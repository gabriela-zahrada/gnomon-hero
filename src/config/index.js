import fs from 'node:fs';

export function loadConfig(configPath) {
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

export function validateConfig(config) {
  const required = [
    'latitude',
    'longitude',
    'timezone',
    'dialRadius',
    'northOffsetDeg',
    'styleMode',
    'hourIntervalMinutes',
    'dialMode',
    'gnomonPositioning',
    'export'
  ];
  for (const key of required) {
    if (!(key in config)) {
      throw new Error(`Missing required config field: ${key}`);
    }
  }
  if (!['fixed', 'movable'].includes(config.dialMode)) {
    throw new Error('dialMode must be fixed or movable');
  }
  return config;
}
