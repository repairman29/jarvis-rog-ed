/**
 * Resolve Go dependencies from go.mod (and go.sum for full list).
 * go.mod has require block(s); go.sum has module@version per line. No registry fetch (proxy API is different).
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

/**
 * @param {string} projectRoot
 * @returns {{ modules: Array<{ path: string, version: string, indirect?: boolean }>, root: string } | null }
 */
export function loadGoMod(projectRoot) {
  const root = resolve(projectRoot);
  const goModPath = join(root, 'go.mod');
  if (!existsSync(goModPath)) return null;
  const content = readFileSync(goModPath, 'utf8');
  const modules = parseGoMod(content);
  return { modules, root };
}

/**
 * Parse go.mod require blocks. Handles:
 * require ( path v1.2.3 path2 v2.0.0 )
 * require path v1.2.3
 * // indirect
 * @param {string} content
 * @returns {Array<{ path: string, version: string, indirect?: boolean }>}
 */
function parseGoMod(content) {
  const results = [];
  const lines = content.split(/\r?\n/);
  let inRequire = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('//')) continue;

    if (trimmed.startsWith('require (')) {
      inRequire = true;
      continue;
    }
    if (inRequire) {
      if (trimmed === ')') {
        inRequire = false;
        continue;
      }
      const indirect = trimmed.includes('// indirect');
      const parts = trimmed.split(/\s+/).filter((p) => p && !p.startsWith('//'));
      const path = parts[0];
      const version = parts[1] || '';
      if (path && path !== ')') results.push({ path, version, indirect });
      continue;
    }
    const singleRequire = trimmed.match(/^require\s+(\S+)\s+(\S+)/);
    if (singleRequire) {
      const [, path, version] = singleRequire;
      const indirect = trimmed.includes('// indirect');
      results.push({ path, version, indirect });
    }
  }

  return results;
}

/**
 * Optionally merge go.sum entries (module version) so we have one row per module@version.
 * go.sum format: module version [/go.mod version]
 * @param {string} projectRoot
 * @returns {Set<string>} "path@version"
 */
export function loadGoSum(projectRoot) {
  const root = resolve(projectRoot);
  const goSumPath = join(root, 'go.sum');
  if (!existsSync(goSumPath)) return new Set();
  const content = readFileSync(goSumPath, 'utf8');
  const set = new Set();
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(/\s+/);
    const path = parts[0];
    const version = parts[1];
    if (path && version) set.add(`${path}@${version}`);
  }
  return set;
}

/**
 * Build tree-like list (depth 0 for direct, 1 for indirect) for report compatibility.
 * @param {{ modules: Array<{ path: string, version: string, indirect?: boolean }> }} loaded
 * @returns {Array<{ key: string, name: string, version: string, depth: number, why: string[] }>}
 */
export function goModToTree(loaded) {
  return loaded.modules.map((m) => ({
    key: `${m.path}@${m.version}`,
    name: m.path,
    version: m.version,
    depth: m.indirect ? 1 : 0,
    why: m.indirect ? ['go.mod (indirect)'] : ['go.mod'],
  }));
}
