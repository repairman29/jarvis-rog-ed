#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

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

async function main() {
  loadEnvFile();
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/decrypted_secrets?select=id&limit=1`, {
    method: 'GET',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Accept-Profile': 'vault'
    }
  });

  if (!res.ok) {
    console.error('Vault check failed:', res.status);
    const body = await res.text();
    console.error(body);
    process.exit(1);
  }

  console.log('Vault access OK (decrypted_secrets readable).');
}

main().catch((error) => {
  console.error('Vault check failed:', error.message);
  process.exit(1);
});
