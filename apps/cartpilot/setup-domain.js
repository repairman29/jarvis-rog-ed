#!/usr/bin/env node
/**
 * Setup shopolive.xyz DNS for Vercel
 * 
 * Usage:
 *   PORKBUN_API_KEY=xxx PORKBUN_SECRET=xxx node setup-domain.js
 * 
 * Get your API keys from: https://porkbun.com/account/api
 * Then enable API access for shopolive.xyz in Domain Management
 */

const DOMAIN = 'shopolive.xyz';
const VERCEL_IP = '76.76.21.21';
const VERCEL_CNAME = 'cname.vercel-dns.com';

const apiKey = process.env.PORKBUN_API_KEY;
const secretKey = process.env.PORKBUN_SECRET;

if (!apiKey || !secretKey) {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  Porkbun DNS Setup for shopolive.xyz                           ║
╚════════════════════════════════════════════════════════════════╝

To run this script, you need Porkbun API credentials.

1. Go to: https://porkbun.com/account/api
2. Create an API key (or use existing)
3. Go to Domain Management → shopolive.xyz → Details
4. Enable "API ACCESS" toggle

Then run:

  PORKBUN_API_KEY=pk1_xxx PORKBUN_SECRET=sk1_xxx node setup-domain.js

Or manually add these DNS records at Porkbun:

  Type  │ Host  │ Answer
  ──────┼───────┼────────────────────────
  A     │ @     │ 76.76.21.21
  CNAME │ www   │ cname.vercel-dns.com
`);
  process.exit(0);
}

async function porkbunAPI(endpoint, body = {}) {
  const res = await fetch(`https://api.porkbun.com/api/json/v3/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey: apiKey,
      secretapikey: secretKey,
      ...body,
    }),
  });
  return res.json();
}

async function main() {
  console.log(`\n🫒 Setting up DNS for ${DOMAIN}...\n`);

  // Delete existing A records for root
  console.log('Checking existing records...');
  const existing = await porkbunAPI(`dns/retrieve/${DOMAIN}`);
  
  if (existing.status === 'SUCCESS' && existing.records) {
    for (const record of existing.records) {
      if ((record.type === 'A' && record.name === DOMAIN) ||
          (record.type === 'CNAME' && record.name === `www.${DOMAIN}`)) {
        console.log(`  Removing old ${record.type} record: ${record.content}`);
        await porkbunAPI(`dns/delete/${DOMAIN}/${record.id}`);
      }
    }
  }

  // Create A record for root domain
  console.log(`\nCreating A record: @ → ${VERCEL_IP}`);
  const aResult = await porkbunAPI(`dns/create/${DOMAIN}`, {
    type: 'A',
    name: '',
    content: VERCEL_IP,
    ttl: 600,
  });
  
  if (aResult.status === 'SUCCESS') {
    console.log('  ✓ A record created');
  } else {
    console.log('  ✗ Failed:', aResult.message);
  }

  // Create CNAME for www
  console.log(`Creating CNAME: www → ${VERCEL_CNAME}`);
  const cnameResult = await porkbunAPI(`dns/create/${DOMAIN}`, {
    type: 'CNAME',
    name: 'www',
    content: VERCEL_CNAME,
    ttl: 600,
  });
  
  if (cnameResult.status === 'SUCCESS') {
    console.log('  ✓ CNAME record created');
  } else {
    console.log('  ✗ Failed:', cnameResult.message);
  }

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  DNS configured! 🎉                                            ║
╠════════════════════════════════════════════════════════════════╣
║  It may take a few minutes for DNS to propagate.               ║
║                                                                ║
║  Your site will be live at:                                    ║
║    • https://shopolive.xyz                                     ║
║    • https://www.shopolive.xyz                                 ║
╚════════════════════════════════════════════════════════════════╝
`);
}

main().catch(console.error);
