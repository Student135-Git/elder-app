'use strict';

/* =========================================================
   Account database (account name + password) on Supabase.
   Set DATABASE in config.js after running database/accounts.sql.
   The app only calls two database functions; the password is
   sent over https and scrambled (bcrypt) inside the database —
   it is never stored or readable as text.
   With DATABASE empty, accounts stay on this phone as before.
   ========================================================= */
const accounts = (() => {
  const cfg = (typeof DATABASE !== 'undefined' && DATABASE) || {};
  const on = Boolean(cfg.url && cfg.anonKey);
  const base = on ? cfg.url.replace(/\/+$/, '') + '/rest/v1' : '';

  async function call(path, opts = {}) {
    const r = await fetch(base + path, {
      ...opts,
      headers: { apikey: cfg.anonKey, Authorization: 'Bearer ' + cfg.anonKey, 'Content-Type': 'application/json' },
    });
    if (!r.ok) throw new Error('database ' + r.status);
    return r.json();
  }
  const rpc = (fn, name, password) => call('/rpc/' + fn, { method: 'POST', body: JSON.stringify({ p_name: name, p_password: password }) });

  return {
    on,
    // → { ok: true, name } | { ok: false, error: 'taken' | 'invalid' }
    register: (name, password) => rpc('elder_register', name, password),
    // → { ok: true, name } | { ok: false, error: 'wrong' }
    login: (name, password) => rpc('elder_login', name, password),
    // Names and dates only (no passwords) — for checking who has signed up.
    list: () => call('/elder_accounts_list?select=name,created_at,last_login'),
  };
})();
