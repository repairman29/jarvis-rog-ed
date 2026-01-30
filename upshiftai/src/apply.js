/**
 * Apply upgrade or replace with checkpoint, verify, rollback, and events.
 * HITL: approval gate before executing when config says so.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { spawnSync } from 'child_process';
import { createCheckpoint, rollback as doRollback } from './checkpoint.js';
import { loadConfig, requiresApproval } from './config.js';
import { emit, requestApproval } from './events.js';

/** CLI prompt for approval (ESM: readline is async import). */
async function promptApprovalAsync(message) {
  const { createInterface } = await import('readline');
  return new Promise((resolvePromise) => {
    const rl = createInterface({ input: process.stdin, output: process.stderr });
    rl.question(`${message} (y/n): `, (answer) => {
      rl.close();
      resolvePromise(/^y/i.test(answer?.trim() || ''));
    });
  });
}

/**
 * Run approval gate: if action needs approval per config, prompt or call approval webhook.
 * @param {object} config - from loadConfig
 * @param {string} action - 'upgrade' | 'replace' | 'pin'
 * @param {object} context - { pkg, targetVersion?, targetPackage?, isMajor?, projectRoot }
 * @returns {Promise<boolean>} true = approved (or not required)
 */
export async function approvalGate(config, action, context) {
  const { approval } = config;
  if (!requiresApproval(approval, action, context)) return true;
  if (approval.mode === 'none') return true;
  if (approval.mode === 'webhook' && approval.webhookUrl) {
    const result = await requestApproval(
      approval.webhookUrl,
      { action, ...context },
      { timeoutMs: approval.timeoutMs }
    );
    return result.approved;
  }
  if (approval.mode === 'prompt' && typeof process !== 'undefined' && process.stdin && !process.stdin.isTTY) {
    return false; // non-interactive: require --yes or webhook
  }
  const msg = `Apply ${action} ${context.pkg}${context.targetPackage ? ` → ${context.targetPackage}` : ''}${context.targetVersion ? ` @ ${context.targetVersion}` : ''}?`;
  return await promptApprovalAsync(msg);
}

/**
 * Verify npm: run npm ls; exit 0 = ok.
 * @param {string} projectRoot
 * @returns {{ ok: boolean, stderr?: string }}
 */
function verifyNpm(projectRoot) {
  const r = spawnSync('npm', ['ls'], { cwd: projectRoot, encoding: 'utf8' });
  return { ok: r.status === 0, stderr: r.stderr };
}

/**
 * Get latest version of npm package from registry.
 * @param {string} name
 * @returns {Promise<string|null>}
 */
async function npmLatestVersion(name) {
  const r = spawnSync('npm', ['view', name, 'version'], { encoding: 'utf8' });
  if (r.status !== 0 || !r.stdout) return null;
  return r.stdout.trim();
}

/**
 * Check if target version is a major bump vs current (loose: compare first number).
 * @param {string} current - e.g. "1.2.3"
 * @param {string} target - e.g. "2.0.0"
 */
function isMajorBump(current, target) {
  const c = parseInt(current.split('.')[0], 10);
  const t = parseInt(target.split('.')[0], 10);
  return !Number.isNaN(c) && !Number.isNaN(t) && t > c;
}

/**
 * Apply npm upgrade: set dependency to targetVersion (or latest) and run npm install.
 * @param {string} projectRoot
 * @param {string} pkg - package name
 * @param {string} [targetVersion] - e.g. "latest" or "2.0.0"
 * @param {object} [options] - { dryRun, config, emit }
 */
export async function applyNpmUpgrade(projectRoot, pkg, targetVersion, options = {}) {
  const root = resolve(projectRoot);
  const config = options.config ?? loadConfig(root);
  const webhooks = config.webhooks || [];
  const pkgPath = join(root, 'package.json');
  if (!existsSync(pkgPath)) return { ok: false, error: 'No package.json' };
  const pkgJson = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const deps = pkgJson.dependencies || {};
  const devDeps = pkgJson.devDependencies || {};
  const current = deps[pkg] ?? devDeps[pkg];
  const inDev = pkg in devDeps;
  if (!current) return { ok: false, error: `Package ${pkg} not found in dependencies` };
  const target = targetVersion === 'latest' || !targetVersion
    ? await npmLatestVersion(pkg)
    : targetVersion;
  if (!target) return { ok: false, error: `Could not resolve version for ${pkg}` };
  const isMajor = isMajorBump((current.replace(/^[\^~]/, '')), target);
  const needsApproval = requiresApproval(config.approval, 'upgrade', { isMajor });
  if (needsApproval && !options.skipApproval) {
    const approved = await approvalGate(config, 'upgrade', {
      pkg, targetVersion: target, isMajor, projectRoot: root,
    });
    if (!approved) return { ok: false, error: 'Approval denied' };
  }
  if (options.dryRun) return { ok: true, dryRun: true, pkg, before: current, after: target };
  const cp = createCheckpoint(root, { reason: 'apply-upgrade', ecosystem: 'npm' });
  if (cp.error) return { ok: false, error: cp.error };
  emit('checkpoint.created', { path: cp.path, files: cp.files }, webhooks);
  emit('apply.started', { action: 'upgrade', pkg, targetVersion: target }, webhooks);
  const prefix = inDev ? 'devDependencies' : 'dependencies';
  const key = inDev ? 'devDependencies' : 'dependencies';
  pkgJson[key] = pkgJson[key] || {};
  pkgJson[key][pkg] = target;
  writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2), 'utf8');
  const install = spawnSync('npm', ['install'], { cwd: root, encoding: 'utf8' });
  if (install.status !== 0) {
    const rb = doRollback(root);
    emit('apply.failed', { action: 'upgrade', pkg, error: install.stderr }, webhooks);
    if (rb.restored) {
      emit('rollback.triggered', { reason: 'install_failed', checkpoint: rb.checkpoint }, webhooks);
      emit('rollback.completed', { restored: rb.restored }, webhooks);
    }
    return { ok: false, error: install.stderr || 'npm install failed' };
  }
  const verify = verifyNpm(root);
  if (!verify.ok) {
    const rb = doRollback(root);
    emit('apply.failed', { action: 'upgrade', pkg, error: verify.stderr }, webhooks);
    if (rb.restored) {
      emit('rollback.triggered', { reason: 'verify_failed', checkpoint: rb.checkpoint }, webhooks);
      emit('rollback.completed', { restored: rb.restored }, webhooks);
    }
    return { ok: false, error: verify.stderr || 'Verify failed' };
  }
  emit('apply.completed', { action: 'upgrade', pkg, before: current, after: target }, webhooks);
  return { ok: true, pkg, before: current, after: target };
}

/**
 * Apply npm replace: remove oldPkg, add newPkg (with optional version), npm install.
 * @param {string} projectRoot
 * @param {string} oldPkg
 * @param {string} newPkg
 * @param {string} [newVersion] - e.g. "latest" or "2.0.0"
 */
export async function applyNpmReplace(projectRoot, oldPkg, newPkg, newVersion, options = {}) {
  const root = resolve(projectRoot);
  const config = options.config ?? loadConfig(root);
  const webhooks = config.webhooks || [];
  const pkgPath = join(root, 'package.json');
  if (!existsSync(pkgPath)) return { ok: false, error: 'No package.json' };
  const pkgJson = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const deps = pkgJson.dependencies || {};
  const devDeps = pkgJson.devDependencies || {};
  const inDev = oldPkg in devDeps;
  if (!(oldPkg in deps) && !(oldPkg in devDeps)) return { ok: false, error: `Package ${oldPkg} not found` };
  const version = newVersion === 'latest' || !newVersion ? await npmLatestVersion(newPkg) : newVersion;
  if (!version) return { ok: false, error: `Could not resolve version for ${newPkg}` };
  if (!options.skipApproval && requiresApproval(config.approval, 'replace')) {
    const approved = await approvalGate(config, 'replace', {
      pkg: oldPkg, targetPackage: newPkg, targetVersion: version, projectRoot: root,
    });
    if (!approved) return { ok: false, error: 'Approval denied' };
  }
  if (options.dryRun) return { ok: true, dryRun: true, oldPkg, newPkg, newVersion: version };
  const cp = createCheckpoint(root, { reason: 'apply-replace', ecosystem: 'npm' });
  if (cp.error) return { ok: false, error: cp.error };
  emit('checkpoint.created', { path: cp.path, files: cp.files }, webhooks);
  emit('apply.started', { action: 'replace', pkg: oldPkg, targetPackage: newPkg, targetVersion: version }, webhooks);
  const key = inDev ? 'devDependencies' : 'dependencies';
  pkgJson[key] = pkgJson[key] || {};
  delete pkgJson[key][oldPkg];
  pkgJson[key][newPkg] = version;
  writeFileSync(pkgPath, JSON.stringify(pkgJson, null, 2), 'utf8');
  const install = spawnSync('npm', ['install'], { cwd: root, encoding: 'utf8' });
  if (install.status !== 0) {
    const rb = doRollback(root);
    emit('apply.failed', { action: 'replace', pkg: oldPkg, error: install.stderr }, webhooks);
    if (rb.restored) {
      emit('rollback.triggered', { reason: 'install_failed', checkpoint: rb.checkpoint }, webhooks);
      emit('rollback.completed', { restored: rb.restored }, webhooks);
    }
    return { ok: false, error: install.stderr || 'npm install failed' };
  }
  const verify = verifyNpm(root);
  if (!verify.ok) {
    const rb = doRollback(root);
    emit('apply.failed', { action: 'replace', pkg: oldPkg, error: verify.stderr }, webhooks);
    if (rb.restored) {
      emit('rollback.triggered', { reason: 'verify_failed', checkpoint: rb.checkpoint }, webhooks);
      emit('rollback.completed', { restored: rb.restored }, webhooks);
    }
    return { ok: false, error: verify.stderr || 'Verify failed' };
  }
  emit('apply.completed', { action: 'replace', pkg: oldPkg, newPkg, newVersion: version }, webhooks);
  return { ok: true, oldPkg, newPkg, newVersion: version };
}
