/**
 * upshiftai — ancient dependency lineage.
 * Resolve tree, fetch registry metadata, detect ancient/legacy/fork, output report.
 */

import { loadLockfile, flattenPackages, buildTreeWithDepth, fetchRegistryMetadata } from './resolvers/npm.js';
import { loadRequirements, requirementsToTree, fetchPyPIMetadata } from './resolvers/pip.js';
import { loadGoMod, goModToTree } from './resolvers/go.js';
import { buildReport, reportToMarkdown } from './report.js';

/**
 * Analyze a project directory. Auto-detects npm, pip, or go (first found).
 *
 * @param {string} projectRoot - path to project
 * @param {{ ancientMonths?: number, fetchRegistry?: boolean, ecosystem?: 'npm'|'pip'|'go'|'auto' }} options
 * @returns {Promise<object>} report
 */
export async function analyze(projectRoot, options = {}) {
  const ecosystem = options.ecosystem ?? 'auto';
  if (ecosystem === 'npm') return analyzeNpm(projectRoot, options);
  if (ecosystem === 'pip') return analyzePip(projectRoot, options);
  if (ecosystem === 'go') return analyzeGo(projectRoot, options);
  if (loadLockfile(projectRoot)) return analyzeNpm(projectRoot, options);
  if (loadRequirements(projectRoot)) return analyzePip(projectRoot, options);
  if (loadGoMod(projectRoot)) return analyzeGo(projectRoot, options);
  return {
    ok: false,
    error: 'No package-lock.json, requirements.txt, or go.mod found',
    summary: { total: 0, ancient: 0, deprecated: 0, forkHint: 0 },
    entries: [],
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Analyze npm project (package-lock.json).
 */
export async function analyzeNpm(projectRoot, options = {}) {
  const fetchRegistry = options.fetchRegistry !== false;
  const ancientMonths = options.ancientMonths ?? 24;

  const loaded = loadLockfile(projectRoot);
  if (!loaded) {
    return {
      ok: false,
      error: 'No package-lock.json found',
      summary: { total: 0, ancient: 0, deprecated: 0, forkHint: 0 },
      entries: [],
      generatedAt: new Date().toISOString(),
    };
  }

  const { lockfile } = loaded;
  const flat = flattenPackages(lockfile);
  const tree = buildTreeWithDepth(flat, lockfile);

  const metadata = new Map();
  if (fetchRegistry) {
    const seen = new Set();
    for (const node of tree) {
      const key = node.key;
      if (seen.has(key)) continue;
      seen.add(key);
      const meta = await fetchRegistryMetadata(node.name, node.version);
      metadata.set(key, meta);
      metadata.set(node.name, meta);
    }
  }

  const report = buildReport(tree, metadata, { ancientMonths });
  report.ok = true;
  report.ecosystem = 'npm';
  return report;
}

/**
 * Analyze pip project (requirements.txt).
 */
export async function analyzePip(projectRoot, options = {}) {
  const fetchRegistry = options.fetchRegistry !== false;
  const ancientMonths = options.ancientMonths ?? 24;

  const loaded = loadRequirements(projectRoot);
  if (!loaded) {
    return {
      ok: false,
      error: 'No requirements.txt found',
      summary: { total: 0, ancient: 0, deprecated: 0, forkHint: 0 },
      entries: [],
      generatedAt: new Date().toISOString(),
    };
  }

  const tree = requirementsToTree(loaded.requirements);
  const metadata = new Map();
  if (fetchRegistry) {
    for (const node of tree) {
      const meta = await fetchPyPIMetadata(node.name, node.version);
      metadata.set(node.key, meta);
      metadata.set(node.name, meta);
    }
  }

  const report = buildReport(tree, metadata, { ancientMonths });
  report.ok = true;
  report.ecosystem = 'pip';
  return report;
}

/**
 * Analyze Go project (go.mod). No registry fetch (proxy API not wired).
 */
export async function analyzeGo(projectRoot, options = {}) {
  const ancientMonths = options.ancientMonths ?? 24;

  const loaded = loadGoMod(projectRoot);
  if (!loaded) {
    return {
      ok: false,
      error: 'No go.mod found',
      summary: { total: 0, ancient: 0, deprecated: 0, forkHint: 0 },
      entries: [],
      generatedAt: new Date().toISOString(),
    };
  }

  const tree = goModToTree(loaded);
  const metadata = new Map(); // Go proxy not wired; no lastPublish/deprecated
  const report = buildReport(tree, metadata, { ancientMonths });
  report.ok = true;
  report.ecosystem = 'go';
  return report;
}

/**
 * Same as analyze() but also return markdown string.
 *
 * @param {string} projectRoot
 * @param {{ ancientMonths?: number, fetchRegistry?: boolean }} options
 * @returns {Promise<{ report: object, markdown: string }>}
 */
export async function analyzeWithMarkdown(projectRoot, options = {}) {
  const report = await analyze(projectRoot, options);
  const markdown = reportToMarkdown(report);
  return { report, markdown };
}

export { loadLockfile, flattenPackages, buildTreeWithDepth, fetchRegistryMetadata } from './resolvers/npm.js';
export { loadRequirements, requirementsToTree, fetchPyPIMetadata } from './resolvers/pip.js';
export { loadGoMod, goModToTree, loadGoSum } from './resolvers/go.js';
export { analyzePackage, ageSignal, forkHint, isDeprecated, isOldPython } from './detectors/ancient.js';
export { buildReport, reportToMarkdown, reportToCsv } from './report.js';
export { getReplacementSuggestions } from './suggestions.js';
export { createCheckpoint, rollback, getLatestCheckpoint, getCheckpointFiles } from './checkpoint.js';
export { loadConfig, requiresApproval } from './config.js';
export { on, off, emit, requestApproval } from './events.js';
export { approvalGate, applyNpmUpgrade, applyNpmReplace } from './apply.js';
