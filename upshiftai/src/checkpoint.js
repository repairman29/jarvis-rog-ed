/**
 * Checkpoint and rollback for safe automations.
 * Saves manifest + lockfile copies to .upshiftai-tmp/checkpoints/<timestamp>/;
 * rollback restores from latest checkpoint.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, resolve } from 'path';

const CHECKPOINTS_DIR = '.upshiftai-tmp/checkpoints';
const META_FILE = 'meta.json';

/**
 * Detect ecosystem from project root (same logic as analyze: lockfile presence).
 * @param {string} projectRoot
 * @returns {'npm'|'pip'|null}
 */
export function detectEcosystem(projectRoot) {
  const root = resolve(projectRoot);
  if (existsSync(join(root, 'package-lock.json')) || existsSync(join(root, 'package.json'))) return 'npm';
  if (existsSync(join(root, 'pyproject.toml')) || existsSync(join(root, 'requirements.txt'))) return 'pip';
  return null;
}

/**
 * List manifest/lockfile paths we should checkpoint for this ecosystem.
 * @param {string} projectRoot
 * @param {'npm'|'pip'} ecosystem
 * @returns {Array<{ absolute: string, rel: string }>}
 */
export function getCheckpointFiles(projectRoot, ecosystem) {
  const root = resolve(projectRoot);
  const out = [];
  if (ecosystem === 'npm') {
    if (existsSync(join(root, 'package.json'))) out.push({ absolute: join(root, 'package.json'), rel: 'package.json' });
    if (existsSync(join(root, 'package-lock.json'))) out.push({ absolute: join(root, 'package-lock.json'), rel: 'package-lock.json' });
  }
  if (ecosystem === 'pip') {
    if (existsSync(join(root, 'pyproject.toml'))) out.push({ absolute: join(root, 'pyproject.toml'), rel: 'pyproject.toml' });
    if (existsSync(join(root, 'requirements.txt'))) out.push({ absolute: join(root, 'requirements.txt'), rel: 'requirements.txt' });
    const reqDir = join(root, 'requirements');
    if (existsSync(reqDir)) {
      try {
        for (const name of readdirSync(reqDir)) {
          if (name.endsWith('.txt')) {
            const abs = join(reqDir, name);
            out.push({ absolute: abs, rel: `requirements/${name}` });
          }
        }
      } catch {
        // ignore
      }
    }
  }
  return out;
}

/**
 * Create a checkpoint: copy manifest/lockfile into .upshiftai-tmp/checkpoints/<timestamp>/.
 * @param {string} projectRoot
 * @param {{ ecosystem?: 'npm'|'pip', reason?: string }} options
 * @returns {{ path: string, timestamp: string, files: string[] } | { error: string }}
 */
export function createCheckpoint(projectRoot, options = {}) {
  const root = resolve(projectRoot);
  const ecosystem = options.ecosystem ?? detectEcosystem(root);
  if (!ecosystem) {
    return { error: 'No npm or pip project found (no package-lock.json/pyproject.toml/requirements.txt)' };
  }
  const files = getCheckpointFiles(root, ecosystem);
  if (files.length === 0) {
    return { error: `No manifest files found for ${ecosystem}` };
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const cpDir = join(root, CHECKPOINTS_DIR, timestamp);
  if (!existsSync(cpDir)) mkdirSync(cpDir, { recursive: true });

  for (const { absolute, rel } of files) {
    const dest = join(cpDir, rel);
    const destDir = resolve(dest, '..');
    if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
    copyFileSync(absolute, dest);
  }
  const meta = {
    timestamp: new Date().toISOString(),
    ecosystem,
    reason: options.reason || 'manual',
    files: files.map((f) => f.rel),
  };
  writeFileSync(join(cpDir, META_FILE), JSON.stringify(meta, null, 2), 'utf8');
  return { path: cpDir, timestamp, files: files.map((f) => f.rel) };
}

/**
 * Find the latest checkpoint directory (by name = timestamp).
 * @param {string} projectRoot
 * @returns {string|null} path to checkpoint dir or null
 */
export function getLatestCheckpoint(projectRoot) {
  const root = resolve(projectRoot);
  const base = join(root, CHECKPOINTS_DIR);
  if (!existsSync(base)) return null;
  let latest = null;
  let latestTs = '';
  try {
    for (const name of readdirSync(base)) {
      const full = join(base, name);
      if (existsSync(join(full, META_FILE)) && name > latestTs) {
        latestTs = name;
        latest = full;
      }
    }
  } catch {
    return null;
  }
  return latest;
}

/**
 * Restore project from latest checkpoint.
 * @param {string} projectRoot
 * @param {{ dryRun?: boolean }} options
 * @returns {{ restored: string[], checkpoint: string } | { error: string }}
 */
export function rollback(projectRoot, options = {}) {
  const root = resolve(projectRoot);
  const cpPath = getLatestCheckpoint(root);
  if (!cpPath) {
    return { error: 'No checkpoint found. Run "upshiftai-deps checkpoint" first.' };
  }
  const metaPath = join(cpPath, META_FILE);
  const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
  const files = meta.files || [];
  if (options.dryRun) {
    return { restored: files, checkpoint: cpPath, dryRun: true };
  }
  const restored = [];
  for (const rel of files) {
    const src = join(cpPath, rel);
    const dest = join(root, rel);
    if (existsSync(src)) {
      const destDir = resolve(dest, '..');
      if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
      copyFileSync(src, dest);
      restored.push(rel);
    }
  }
  return { restored, checkpoint: cpPath };
}
