#!/usr/bin/env node
/**
 * Secret scanner (redacted): scans repos/paths for potential secrets
 * and produces a redacted report (hash + last4 only).
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const DEFAULT_ROOT = process.platform === 'win32' ? 'C:\\Users\\jeffa' : os.homedir();
const DEFAULT_MAX_BYTES = 512 * 1024;
const DEFAULT_OUT = path.join(process.cwd(), 'reports', `secret-scan-${new Date().toISOString().slice(0, 10)}.json`);

const IGNORE_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.next',
  'coverage',
  '.venv',
  'venv',
  '__pycache__',
  'target',
  '.cache',
  '.cursor',
  'Library',
  'AppData'
]);

const IGNORE_PATH_SUBSTRINGS = [
  'google-cloud-sdk',
  'third_party',
  'site-packages',
  'vendor',
  'deps',
  'external',
  '.gradle',
  '.idea',
  '.vscode',
  '.pnpm-store',
  'bundledpython'
];

const TEXT_EXTS = new Set([
  '.env',
  '.txt',
  '.md',
  '.js',
  '.ts',
  '.tsx',
  '.jsx',
  '.py',
  '.go',
  '.rs',
  '.java',
  '.cs',
  '.json',
  '.yml',
  '.yaml',
  '.ini',
  '.toml',
  '.cfg',
  '.conf',
  '.sql',
  '.pem',
  '.key'
]);

const SECRET_KEYWORDS = [
  'password',
  'passwd',
  'secret',
  'api_key',
  'apikey',
  'token',
  'access_token',
  'refresh_token',
  'client_secret',
  'private_key',
  'service_role',
  'session_secret'
];

const SECRET_VALUE_PATTERNS = [
  /^sk_live_/,
  /^sk_test_/,
  /^rk_live_/,
  /^rk_test_/,
  /^xox[baprs]-/i,
  /^AIza[0-9A-Za-z\-_]{30,}$/,
  /^ghp_[0-9A-Za-z]{30,}$/,
  /^gho_[0-9A-Za-z]{30,}$/,
  /^glpat-[0-9A-Za-z\-_]{20,}$/,
  /^ASIA[0-9A-Z]{16}$/,
  /^[0-9A-Za-z\-_]{32,}$/
];

const PLACEHOLDER_HINTS = [
  'example',
  'changeme',
  'replace',
  'placeholder',
  'dummy',
  'your_',
  'test',
  'fake'
];

const FILE_NAME_HINTS = [
  '.env',
  '.pem',
  '.key',
  'id_rsa',
  'id_ed25519',
  'credentials.json',
  'service-account',
  'private'
];

function parseArgs(argv) {
  const out = {
    root: DEFAULT_ROOT,
    maxBytes: DEFAULT_MAX_BYTES,
    outPath: DEFAULT_OUT
  };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--root') out.root = argv[++i];
    else if (arg === '--max-bytes') out.maxBytes = Number(argv[++i] || DEFAULT_MAX_BYTES);
    else if (arg === '--out') out.outPath = argv[++i];
  }
  return out;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function redactValue(value) {
  const str = String(value || '');
  const trimmed = str.replace(/^["']|["']$/g, '').trim();
  if (!trimmed) return { hash: null, last4: null, length: 0 };
  return {
    hash: sha256(trimmed).slice(0, 12),
    last4: trimmed.slice(-4),
    length: trimmed.length
  };
}

function isLikelyText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (TEXT_EXTS.has(ext)) return true;
  const base = path.basename(filePath).toLowerCase();
  return FILE_NAME_HINTS.some((hint) => base.includes(hint));
}

function listRepoRoots(rootDir) {
  const roots = [];
  const stack = [rootDir];
  while (stack.length) {
    const current = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    const hasGit = entries.some((entry) => entry.isDirectory() && entry.name === '.git');
    if (hasGit) {
      roots.push(current);
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (IGNORE_DIRS.has(entry.name)) continue;
      const fullPath = path.join(current, entry.name);
      stack.push(fullPath);
    }
  }
  return roots;
}

function isIgnoredPath(fullPath) {
  const normalized = fullPath.replace(/\\/g, '/').toLowerCase();
  return IGNORE_PATH_SUBSTRINGS.some((part) => normalized.includes(part));
}

function walkFiles(dir, maxBytes) {
  const files = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (IGNORE_DIRS.has(entry.name)) continue;
        if (isIgnoredPath(fullPath)) continue;
        stack.push(fullPath);
        continue;
      }
      let stats;
      try {
        stats = fs.statSync(fullPath);
      } catch {
        continue;
      }
      if (stats.size > maxBytes) continue;
      if (!isLikelyText(fullPath)) continue;
      if (isIgnoredPath(fullPath)) continue;
      files.push({ fullPath, size: stats.size });
    }
  }
  return files;
}

function scanEnvFile(filePath) {
  const results = [];
  const text = fs.readFileSync(filePath, 'utf8');
  const normalized = text.replace(/^\uFEFF/, '');
  for (const line of normalized.split(/\r?\n/)) {
    const clean = line.trim();
    if (!clean || clean.startsWith('#')) continue;
    const match = clean.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    const key = match[1];
    const value = match[2];
    if (!SECRET_KEYWORDS.some((keyword) => key.toLowerCase().includes(keyword))) continue;
    results.push({
      type: 'env',
      key,
      ...redactValue(value)
    });
  }
  return results;
}

function scanTextFile(filePath) {
  const results = [];
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const lower = line.toLowerCase();
    if (!SECRET_KEYWORDS.some((keyword) => lower.includes(keyword))) continue;

    const keyMatch = line.match(/["']?([A-Za-z_][A-Za-z0-9_]*?)["']?\s*[:=]\s*["']?([^"'\n]+)["']?/);
    if (!keyMatch) continue;
    const key = keyMatch[1];
    const value = keyMatch[2];
    if (!isLikelySecretValue(value)) continue;
    results.push({
      type: 'inline',
      key,
      line: i + 1,
      ...redactValue(value)
    });
  }
  return results;
}

function isLikelySecretValue(value) {
  const trimmed = String(value || '').replace(/^["']|["']$/g, '').trim();
  if (!trimmed || trimmed.length < 12) return false;
  const lower = trimmed.toLowerCase();
  if (PLACEHOLDER_HINTS.some((hint) => lower.includes(hint))) return false;
  if (SECRET_VALUE_PATTERNS.some((pattern) => pattern.test(trimmed))) return true;
  if (/\s/.test(trimmed)) return false;

  const unique = new Set(trimmed).size;
  const alphaNum = trimmed.replace(/[^0-9A-Za-z]/g, '').length;
  const ratio = alphaNum / trimmed.length;
  return trimmed.length >= 20 && unique >= 10 && ratio >= 0.6;
}

function scanPrivateKeyFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  if (text.includes('-----BEGIN') && text.includes('PRIVATE KEY-----')) {
    return [{
      type: 'private_key',
      key: 'PRIVATE_KEY_FILE',
      hash: sha256(text).slice(0, 12),
      last4: null,
      length: text.length
    }];
  }
  return [];
}

function collectCandidates(root, maxBytes) {
  const files = walkFiles(root, maxBytes);
  const findings = [];
  for (const file of files) {
    const base = path.basename(file.fullPath).toLowerCase();
    let fileFindings = [];
    try {
      if (base.startsWith('.env')) {
        fileFindings = scanEnvFile(file.fullPath);
      } else if (base.includes('pem') || base.includes('key')) {
        fileFindings = scanPrivateKeyFile(file.fullPath);
      } else {
        fileFindings = scanTextFile(file.fullPath);
      }
    } catch {
      continue;
    }
    if (fileFindings.length) {
      findings.push({
        path: file.fullPath,
        findings: fileFindings
      });
    }
  }
  return findings;
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function main() {
  const { root, maxBytes, outPath } = parseArgs(process.argv);
  const repoRoots = listRepoRoots(root);
  const knownEnv = [
    path.join(os.homedir(), '.clawdbot', '.env'),
    path.join(os.homedir(), '.env')
  ].filter((candidate) => fs.existsSync(candidate));

  const report = {
    scannedRoot: root,
    repoCount: repoRoots.length,
    repos: [],
    knownEnv: [],
    generatedAt: new Date().toISOString()
  };

  for (const envPath of knownEnv) {
    const findings = scanEnvFile(envPath);
    report.knownEnv.push({ path: envPath, findings });
  }

  for (const repoRoot of repoRoots) {
    const findings = collectCandidates(repoRoot, maxBytes);
    report.repos.push({
      root: repoRoot,
      findings
    });
  }

  ensureDir(path.dirname(outPath));
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  const totalFindings = report.repos.reduce((sum, repo) => sum + repo.findings.length, 0)
    + report.knownEnv.reduce((sum, env) => sum + (env.findings ? env.findings.length : 0), 0);

  console.log(`Secret scan complete. Repos: ${report.repoCount}. Findings: ${totalFindings}.`);
  console.log(`Report: ${outPath}`);
}

main();
