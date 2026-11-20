#!/usr/bin/env node
/* =========================================================
   Create and list elder accounts in the account database.
   Uses the same two values as the app (DATABASE in config.js),
   so run database/accounts.sql in Supabase first.

   Create one:    node tools/elder-accounts.js add 王奶奶 1234
   Create many:   node tools/elder-accounts.js add-file elders.csv
                  (one "name,password" per line)
   List all:      node tools/elder-accounts.js list

   Passwords are scrambled inside the database and can never be
   read back. Needs Node 18 or newer.
   ========================================================= */
'use strict';
const fs = require('fs');
const path = require('path');

const config = fs.readFileSync(path.join(__dirname, '..', 'config.js'), 'utf8');
const block = (config.match(/const DATABASE = \{([\s\S]*?)\};/) || [])[1] || '';
const value = (key) => ((block.match(new RegExp(`${key}:\\s*'([^']*)'`)) || [])[1] || '');
const url = value('url').replace(/\/+$/, '');
const key = value('anonKey');
if (!url || !key) {
  console.error('DATABASE is empty in config.js. Fill in the Supabase URL and anon key first.');
  process.exit(1);
}

async function call(p, body) {
  const r = await fetch(`${url}/rest/v1${p}`, {
    method: body ? 'POST' : 'GET',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`database ${r.status}: ${await r.text()}`);
  return r.json();
}

async function add(name, password) {
  const res = await call('/rpc/elder_register', { p_name: name, p_password: password });
  const why = { taken: 'name already used', invalid: 'name 2–20 characters, password at least 4' };
  console.log(res.ok ? `created  ${res.name}` : `skipped  ${name} (${why[res.error] || res.error})`);
}

(async () => {
  const [cmd, a, b] = process.argv.slice(2);
  if (cmd === 'add' && a && b) await add(a, b);
  else if (cmd === 'add-file' && a) {
    const lines = fs.readFileSync(a, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const [name, password] = line.split(',').map((x) => (x || '').trim());
      if (name && password) await add(name, password);
    }
  } else if (cmd === 'list') {
    const rows = await call('/elder_accounts_list?select=name,created_at,last_login');
    console.log(`${rows.length} account(s)`);
    for (const r of rows) console.log(`${r.name}\tcreated ${r.created_at.slice(0, 10)}\tlast sign-in ${r.last_login ? r.last_login.slice(0, 16).replace('T', ' ') : '-'}`);
  } else {
    console.log('Usage:\n  node tools/elder-accounts.js add <name> <password>\n  node tools/elder-accounts.js add-file <file.csv>\n  node tools/elder-accounts.js list');
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
