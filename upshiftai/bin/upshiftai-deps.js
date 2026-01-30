#!/usr/bin/env node

/**
 * CLI: upshiftai-deps analyze | report | checkpoint | rollback
 * analyze: JSON (+ optional --markdown, --csv)
 * report: full "deep throat" report (direct + transitive, something-old chains, optional --pdf)
 * checkpoint: save manifest + lockfile for rollback before automations
 * rollback: restore from latest checkpoint
 */

import { resolve, join } from 'path';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { spawnSync } from 'child_process';
import { analyzeWithMarkdown, reportToCsv, analyze } from '../src/index.js';
import { buildFullReport } from '../src/report-full.js';
import { loadPyProjectMeta } from '../src/resolvers/pip.js';
import {
  loadPipdeptreeFromFile,
  enrichTreeWithPyPI,
  buildSomethingOldChains,
  pipTreeToText,
} from '../src/pip-tree.js';
import { createCheckpoint, rollback as doRollback, getLatestCheckpoint } from '../src/checkpoint.js';
import { loadConfig } from '../src/config.js';

const PLATFORM_URL = process.env.UPSHIFTAI_PLATFORM_URL || '';
import { applyNpmUpgrade, applyNpmReplace } from '../src/apply.js';

const args = process.argv.slice(2);
const cmd = args[0];
const subCmd = args[1];
// Path: for apply upgrade/replace it's the last positional; for others it's args[1]
function getProjectRoot() {
  if (cmd === 'apply' && (subCmd === 'upgrade' || subCmd === 'replace')) {
    const forUpgrade = (subCmd === 'upgrade' ? args[3] : args[4]);
    if (forUpgrade && !forUpgrade.startsWith('--')) return resolve(forUpgrade);
    return resolve('.');
  }
  const pathArg = (args[1] && !args[1].startsWith('--')) ? args[1] : '.';
  return resolve(pathArg);
}
const projectRoot = getProjectRoot();

function getOpt(name, defaultValue) {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=')[1] : defaultValue;
}
function hasOpt(name) {
  return args.includes(`--${name}`);
}

async function main() {
  if (cmd === 'analyze') {
    await runAnalyze();
    return;
  }
  if (cmd === 'report') {
    await runReport();
    return;
  }
  if (cmd === 'checkpoint') {
    runCheckpoint();
    return;
  }
  if (cmd === 'rollback') {
    runRollback();
    return;
  }
  if (cmd === 'apply') {
    await runApply();
    return;
  }
  console.error(`Usage:
  upshiftai-deps analyze [path] [--markdown] [--csv] [--no-registry] [--ecosystem=npm|pip|go]
  upshiftai-deps report [path] [--output FILE] [--pdf] [--upload] [--pip-tree FILE.json] [--full-tree] [--no-full-tree] [--project-name NAME] [--project-url URL] [--ecosystem=pip]
  upshiftai-deps checkpoint [path] [--reason "..."]
  upshiftai-deps rollback [path] [--dry-run]
  upshiftai-deps apply upgrade <pkg> [path] [--version VER] [--dry-run] [--yes]
  upshiftai-deps apply replace <old> <new> [path] [--version VER] [--dry-run] [--yes]
  upshiftai-deps apply (uses .upshiftai.json for webhooks & approval; --yes skips HITL)`);
  process.exit(1);
}

async function runApply() {
  const action = subCmd;
  const dryRun = hasOpt('dry-run');
  const skipApproval = hasOpt('yes');
  const configPath = getOpt('config');
  const version = getOpt('version', 'latest');
  const config = loadConfig(projectRoot, configPath);

  if (action === 'upgrade') {
    const pkg = args[2];
    if (!pkg || pkg.startsWith('--')) {
      console.error('Usage: upshiftai-deps apply upgrade <pkg> [path] [--version VER] [--dry-run] [--yes]');
      process.exit(1);
    }
    const result = await applyNpmUpgrade(projectRoot, pkg, version, {
      config, dryRun, skipApproval,
    });
    if (result.error) {
      console.error(result.error);
      process.exit(1);
    }
    if (result.dryRun) {
      console.error(`Dry run: would upgrade ${result.pkg} ${result.before} → ${result.after}`);
      return;
    }
    console.error(`Upgraded ${result.pkg}: ${result.before} → ${result.after}`);
    return;
  }

  if (action === 'replace') {
    const oldPkg = args[2];
    const newPkg = args[3];
    if (!oldPkg || !newPkg || oldPkg.startsWith('--') || newPkg.startsWith('--')) {
      console.error('Usage: upshiftai-deps apply replace <old> <new> [path] [--version VER] [--dry-run] [--yes]');
      process.exit(1);
    }
    const result = await applyNpmReplace(projectRoot, oldPkg, newPkg, version, {
      config, dryRun, skipApproval,
    });
    if (result.error) {
      console.error(result.error);
      process.exit(1);
    }
    if (result.dryRun) {
      console.error(`Dry run: would replace ${result.oldPkg} → ${result.newPkg} @ ${result.newVersion}`);
      return;
    }
    console.error(`Replaced ${result.oldPkg} → ${result.newPkg} @ ${result.newVersion}`);
    return;
  }

  console.error('Usage: upshiftai-deps apply upgrade|replace ...');
  process.exit(1);
}

function runCheckpoint() {
  const reason = getOpt('reason', 'manual');
  const result = createCheckpoint(projectRoot, { reason });
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  console.error(`Checkpoint saved: ${result.path}`);
  console.error(`  Files: ${result.files.join(', ')}`);
}

function runRollback() {
  const dryRun = hasOpt('dry-run');
  const result = doRollback(projectRoot, { dryRun });
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  if (result.dryRun) {
    console.error(`Would restore from: ${result.checkpoint}`);
    console.error(`  Files: ${result.restored.join(', ')}`);
    return;
  }
  console.error(`Rolled back from: ${result.checkpoint}`);
  console.error(`  Restored: ${result.restored.join(', ')}`);
}

async function runAnalyze() {
  const wantMarkdown = hasOpt('markdown');
  const wantCsv = hasOpt('csv');
  const noRegistry = hasOpt('no-registry');
  const ecosystem = getOpt('ecosystem');

  const options = { fetchRegistry: !noRegistry, ancientMonths: 24 };
  if (ecosystem) options.ecosystem = ecosystem;

  const { report, markdown } = await analyzeWithMarkdown(projectRoot, options);

  if (wantCsv) {
    console.log(reportToCsv(report, { includeSuggestions: true }));
    return;
  }
  console.log(JSON.stringify(report, null, 2));
  if (wantMarkdown) {
    console.log('\n---\n');
    console.log(markdown);
  }
}

async function runReport() {
  const outFile = getOpt('output');
  const wantPdf = hasOpt('pdf');
  const pipTreeFile = getOpt('pip-tree');
  const noFullTree = hasOpt('no-full-tree');
  const fullTree = hasOpt('full-tree') || (!noFullTree && !pipTreeFile); // for pip we try full-tree by default below
  const projectName = getOpt('project-name');
  const projectUrl = getOpt('project-url');
  const ecosystem = getOpt('ecosystem', 'auto');

  const analyzeOptions = { fetchRegistry: true, ancientMonths: 24 };
  if (ecosystem && ecosystem !== 'auto') analyzeOptions.ecosystem = ecosystem;

  const directReport = await analyze(projectRoot, analyzeOptions);
  if (!directReport.ok) {
    console.error(directReport.error || 'Analysis failed');
    process.exit(1);
  }

  // For pip projects, default to attempting full transitive tree (full deep-throat report)
  const tryFullTree = directReport.ecosystem === 'pip' && !pipTreeFile && (hasOpt('full-tree') || !noFullTree);

  let somethingOldChains = [];
  let pipTreeText = '';
  let pipTreeJsonPath = pipTreeFile;

  if (tryFullTree) {
    const result = tryRunPipdeptree(projectRoot);
    if (result && result.jsonPath) pipTreeJsonPath = result.jsonPath;
    if (result && result.textPath && existsSync(result.textPath)) {
      pipTreeText = readFileSync(result.textPath, 'utf8');
    }
  }

  if (pipTreeJsonPath && existsSync(resolve(pipTreeJsonPath))) {
    const treePath = resolve(pipTreeJsonPath);
    const { packages, rootPackages } = loadPipdeptreeFromFile(treePath);
    const enriched = await enrichTreeWithPyPI(packages, { ancientMonths: 24 });
    somethingOldChains = buildSomethingOldChains(packages, enriched);
    if (!pipTreeText) pipTreeText = pipTreeToText(packages, rootPackages);
  }

  const pyprojectMeta = directReport.ecosystem === 'pip' ? loadPyProjectMeta(projectRoot) : null;
  const reportOptions = {
    projectName: projectName || pyprojectMeta?.name,
    projectUrl: projectUrl || pyprojectMeta?.url,
    projectDescription: pyprojectMeta?.description,
    somethingOldChains,
    pipTreeText: pipTreeText || undefined,
    ecosystem: directReport.ecosystem,
    hadPipTree: !!pipTreeJsonPath && existsSync(resolve(pipTreeJsonPath)),
  };

  const fullMarkdown = buildFullReport(directReport, reportOptions);

  const mdPath = outFile ? resolve(outFile) : null;
  if (mdPath) {
    writeFileSync(mdPath, fullMarkdown, 'utf8');
    console.error(`Wrote ${mdPath}`);
  } else {
    console.log(fullMarkdown);
  }

  if (hasOpt('upload')) {
    const config = loadConfig(projectRoot, getOpt('config'));
    const baseUrl = (config.platformUrl || PLATFORM_URL).replace(/\/$/, '');
    const apiKey = config.apiKey || process.env.UPSHIFTAI_API_KEY;
    if (!baseUrl || !apiKey) {
      console.error('--upload requires platformUrl and apiKey in .upshiftai.json or UPSHIFTAI_PLATFORM_URL and UPSHIFTAI_API_KEY');
      process.exit(1);
    }
    const payload = {
      projectName: reportOptions.projectName || 'project',
      ecosystem: directReport.ecosystem || 'npm',
      summary: directReport.summary || {},
      markdown: fullMarkdown,
      payload: directReport,
    };
    try {
      const res = await fetch(`${baseUrl}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-UpshiftAI-Key': apiKey },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.text();
        console.error('Upload failed:', res.status, err);
        process.exit(1);
      }
      const data = await res.json();
      console.error('Uploaded report:', data.id);
    } catch (e) {
      console.error('Upload failed:', e.message);
      process.exit(1);
    }
  }

  if (wantPdf) {
    const mdToConvert = mdPath || resolve(projectRoot, 'dependency-report.md');
    if (!mdPath) writeFileSync(mdToConvert, fullMarkdown, 'utf8');
    const r = spawnSync('npx', ['--yes', 'md-to-pdf', mdToConvert], {
      stdio: 'inherit',
      cwd: resolve(projectRoot),
    });
    if (r.status !== 0) {
      console.error('md-to-pdf failed; install with: npx md-to-pdf --version');
      process.exit(1);
    }
    const outPdf = mdToConvert.replace(/\.md$/i, '.pdf');
    console.error(`Wrote ${outPdf}`);
  }
}

function tryRunPipdeptree(projectRoot) {
  const pythons = ['python3.12', 'python3.11', 'python3.10', 'python3'];
  let py = null;
  for (const p of pythons) {
    const r = spawnSync(p, ['-c', 'import sys; sys.exit(0 if (3, 10) <= sys.version_info < (3, 13) else 1)'], { encoding: 'utf8' });
    if (r.status === 0) { py = p; break; }
  }
  if (!py) {
    console.error('No Python 3.10–3.12 found. Generate pipdeptree yourself and pass --pip-tree=tree.json:');
    console.error('  cd <project> && python3 -m venv .venv && .venv/bin/pip install pipdeptree ".[dev]" && .venv/bin/pipdeptree -o json > tree.json');
    return null;
  }
  const tmpDir = join(projectRoot, '.upshiftai-tmp');
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });
  const venvPath = join(tmpDir, 'venv');
  const jsonPath = join(tmpDir, 'pipdeptree.json');
  const textPath = join(tmpDir, 'pipdeptree.txt');
  if (!existsSync(venvPath)) {
    const r1 = spawnSync(py, ['-m', 'venv', venvPath], { cwd: projectRoot, stdio: 'pipe' });
    if (r1.status !== 0) {
      console.error('venv creation failed:', r1.stderr?.toString());
      return null;
    }
  }
  const pip = join(venvPath, 'bin', 'pip');
  const pipdeptree = join(venvPath, 'bin', 'pipdeptree');
  spawnSync(pip, ['install', '-q', 'pipdeptree'], { cwd: projectRoot, stdio: 'pipe' });
  spawnSync(pip, ['install', '-q', '-e', '.[dev]'], { cwd: projectRoot, stdio: 'pipe' });
  if (!existsSync(pipdeptree)) {
    console.error('pipdeptree not installed in venv');
    return null;
  }
  const j = spawnSync(pipdeptree, ['-o', 'json'], { cwd: projectRoot, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  if (j.status === 0 && j.stdout) writeFileSync(jsonPath, j.stdout, 'utf8');
  const t = spawnSync(pipdeptree, [], { cwd: projectRoot, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  if (t.status === 0 && t.stdout) writeFileSync(textPath, t.stdout, 'utf8');
  return { jsonPath: existsSync(jsonPath) ? jsonPath : null, textPath: existsSync(textPath) ? textPath : null };
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
