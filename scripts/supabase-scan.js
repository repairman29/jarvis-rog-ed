#!/usr/bin/env node
/**
 * Supabase table scanner (redacted).
 * - Lists tables via PostgREST OpenAPI
 * - Flags tables with credential-like columns
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const KEYWORDS = ['secret', 'token', 'password', 'key', 'credential', 'env'];

function loadEnvFile() {
  const candidates = [
    process.env.USERPROFILE ? path.join(process.env.USERPROFILE, '.clawdbot', '.env') : null,
    process.env.HOME ? path.join(process.env.HOME, '.clawdbot', '.env') : null,
    path.join(os.homedir(), '.clawdbot', '.env')
  ].filter(Boolean);

  const envPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!envPath) return {};
  const text = fs.readFileSync(envPath, 'utf8');
  const out = {};
  const normalized = text.replace(/^\uFEFF/, '');
  for (const line of normalized.split(/\r?\n/)) {
    const cleanLine = line.trimEnd();
    const match = cleanLine.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (match) out[match[1]] = match[2].replace(/^["']|["']$/g, '').trim();
  }
  for (const [key, value] of Object.entries(out)) {
    if (typeof process.env[key] === 'undefined') {
      process.env[key] = value;
    }
  }
  return out;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data, headers: res.headers };
}

function extractTables(openapi) {
  const paths = openapi.paths || {};
  const tables = new Set();
  for (const key of Object.keys(paths)) {
    const normalized = key.replace(/^\//, '');
    if (!normalized || normalized.includes('/')) continue;
    tables.add(normalized);
  }
  return Array.from(tables).sort();
}

function extractSchemaColumns(openapi, table) {
  const schemas = (openapi.components && openapi.components.schemas) || openapi.definitions || {};
  const schema = schemas[table];
  if (!schema || !schema.properties) return [];
  return Object.keys(schema.properties);
}

async function getApproxCount(baseUrl, headers, table) {
  const url = `${baseUrl}/rest/v1/${table}?select=*&limit=1`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      ...headers,
      Prefer: 'count=exact'
    }
  });
  const range = res.headers.get('content-range');
  if (!range) return null;
  const match = range.match(/\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

async function main() {
  loadEnvFile();
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json'
  };

  const openapiRes = await fetchJson(`${supabaseUrl}/rest/v1/`, {
    method: 'GET',
    headers
  });

  if (!openapiRes.ok || typeof openapiRes.data !== 'object') {
    console.error('Failed to load PostgREST OpenAPI spec.');
    console.error('Status:', openapiRes.status);
    process.exit(1);
  }

  const tables = extractTables(openapiRes.data);
  const flagged = [];

  for (const table of tables) {
    const columns = extractSchemaColumns(openapiRes.data, table);
    const matched = columns.filter((col) => KEYWORDS.some((k) => col.toLowerCase().includes(k)));
    if (matched.length) {
      const count = await getApproxCount(supabaseUrl, headers, table);
      flagged.push({ table, columns: matched, count });
    }
  }

  console.log(JSON.stringify({ tableCount: tables.length, flagged }, null, 2));
}

main().catch((error) => {
  console.error('Scan failed:', error.message);
  process.exit(1);
});
