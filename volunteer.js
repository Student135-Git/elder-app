'use strict';

/* =========================================================
   Volunteer matching (Tzu Chi–inspired prototype)
   住 → 我需要志工 (elders post requests)
      → 我想當志工 (volunteers sign in, pick a township, take jobs, earn points)
   Data lives in this browser, or in KindWorld when config.js is filled in.
   ========================================================= */

// The 13 townships of 花蓮縣 (Hualien County), north to south.
const HL_TOWNS = [
  ['秀林鄉', 'Xiulin'], ['新城鄉', 'Xincheng'], ['花蓮市', 'Hualien City'], ['吉安鄉', "Ji'an"],
  ['壽豐鄉', 'Shoufeng'], ['鳳林鎮', 'Fenglin'], ['萬榮鄉', 'Wanrong'], ['光復鄉', 'Guangfu'],
  ['豐濱鄉', 'Fengbin'], ['瑞穗鄉', 'Ruisui'], ['玉里鎮', 'Yuli'], ['卓溪鄉', 'Zhuoxi'], ['富里鄉', 'Fuli'],
];

const JOB_TYPES = {
  cook: { icon: '🍳', zh: '煮飯', en: 'Cooking' },
  clean: { icon: '🧹', zh: '打掃', en: 'Cleaning' },
  walk: { icon: '🚶', zh: '陪伴散步', en: 'Walk' },
};

const EXPIRY_CHOICES = [
  { d: 3, zh: '3 天', en: '3 days' },
  { d: 7, zh: '1 週', en: '1 week' },
  { d: 14, zh: '2 週', en: '2 weeks' },
  { d: 30, zh: '1 個月', en: '1 month' },
];

const POINTS_PER_HOUR = 30;
const DAY_MS = 86400000;
const ymd = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const dateEnd = (str) => { const [y, m, d] = str.split('-').map(Number); return new Date(y, m - 1, d, 23, 59, 59, 999).getTime(); };

// A simple lotus drawn for this app (not any organisation's logo).
const LOTUS = `<svg viewBox="0 0 64 64" width="1em" height="1em" aria-hidden="true" focusable="false"><g fill="currentColor"><ellipse cx="32" cy="29" rx="7" ry="17"/><ellipse cx="32" cy="29" rx="7" ry="17" transform="rotate(-36 32 50)" opacity=".85"/><ellipse cx="32" cy="29" rx="7" ry="17" transform="rotate(36 32 50)" opacity=".85"/><ellipse cx="32" cy="29" rx="6.5" ry="16" transform="rotate(-68 32 50)" opacity=".6"/><ellipse cx="32" cy="29" rx="6.5" ry="16" transform="rotate(68 32 50)" opacity=".6"/></g><path d="M12 56q10-6 20 0t20 0" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".7"/></svg>`;

/* ---------- small helpers ---------- */
let vInited = false;
let vlang = 'zh';
let vMode = 'signin';
let draft = newDraft();
let lastPosted = null;
const vmem = {};

function newDraft() {
  return { types: [], desc: '', city: '', address: '', date: '', hours: 2, start: '09:00', people: 1, days: 7 };
}
const qs = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const B = (zh, en) => `<span class="bi"><span>${zh}</span><span class="en" lang="en">${en}</span></span>`;
const L = (zh, en) => (vlang === 'en' ? en : zh);

// Storage with an in-memory fallback, so the page still works if the browser blocks storage.
const vget = (k, f) => (k in vmem ? vmem[k] : store.get(k, f));
const vset = (k, v) => { vmem[k] = v; store.set(k, v); };

function vinit() {
  if (vInited) return;
  vInited = true;
  vlang = vget('tc_lang', 'zh') === 'en' ? 'en' : 'zh';
  if (kw.on) {
    syncJobs();
    setInterval(syncJobs, 20000);
  } else {
    seedJobs();
  }
}

/* ---------- KindWorld sync (only when config.js is filled in) ---------- */
let syncing = null;

// Fetch the shared list and keep a copy here, so screens can still draw offline.
function syncJobs() {
  if (!kw.on) return Promise.resolve(true);
  if (syncing) return syncing;
  syncing = kw.list()
    .then((list) => {
      const changed = JSON.stringify(list) !== JSON.stringify(getJobs());
      saveJobs(list);
      // Redraw lists, but never a form someone is typing in.
      if (changed && me() && ['give', 'vol', 'vol-mine'].includes(currentView())) rerender();
      return true;
    })
    .catch(() => false)
    .finally(() => { syncing = null; });
  return syncing;
}

function netFail() {
  showToast(L('無法連線，請稍後再試\nCould not connect', 'Could not connect.\nPlease try again.'));
}

async function pushJob(j) {
  if (!kw.on) return true;
  try { await kw.save(j); return true; } catch { netFail(); return false; }
}

async function dropJob(id) {
  if (!kw.on) return true;
  try { await kw.remove(id); return true; } catch { netFail(); return false; }
}

// Sign-ups from this app plus any made in the KindWorld app.
const signedUp = (j) => j.taken.length + (j.extra || 0);

const getJobs = () => vget('tc_jobs', []);
const saveJobs = (j) => vset('tc_jobs', j);
const getUsers = () => vget('tc_users', {});
const saveUsers = (u) => vset('tc_users', u);
const sessionName = () => vget('tc_session', null);

function me() {
  const n = sessionName();
  const u = n ? getUsers()[n] : null;
  return u ? { name: n, ...u } : null;
}
function updateMe(fn) {
  const n = sessionName();
  const us = getUsers();
  if (!n || !us[n]) return;
  fn(us[n]);
  saveUsers(us);
}

function endOfDay(ts) { const d = new Date(ts); d.setHours(23, 59, 59, 999); return d.getTime(); }
function fmtDate(ts, lang) {
  try { return new Intl.DateTimeFormat(lang === 'en' ? 'en' : 'zh-TW', { month: 'short', day: 'numeric' }).format(new Date(ts)); }
  catch { return new Date(ts).toLocaleDateString(); }
}
const cityLabel = (zh, lang = vlang) => { const c = HL_TOWNS.find((x) => x[0] === zh); return c ? (lang === 'en' ? c[1] : c[0]) : zh; };
const isTown = (zh) => HL_TOWNS.some((x) => x[0] === zh);
const hoursText = (h) => L(`${h} 小時`, `${h} hr${h > 1 ? 's' : ''}`);

function seedJobs() {
  if (vget('tc_seeded_hl', false)) return;
  const now = Date.now();
  const mk = (id, types, desc, city, address, hours, start, people, days) => ({
    id, types, desc, city, address, hours, start, people, posted: now,
    date: ymd(now + Math.ceil(days / 2) * DAY_MS), expires: endOfDay(now + Math.ceil(days / 2) * DAY_MS), taken: [], owner: 'demo', demo: true,
  });
  // Replace the old all-Taiwan examples with Hualien ones.
  saveJobs([
    mk('demo1', ['cook', 'clean'], '請幫忙煮午餐，順便整理廚房。 Help cook lunch and tidy the kitchen.', '花蓮市', '中山路 123 號', 3, '10:00', 2, 14),
    mk('demo2', ['walk'], '陪爺爺在公園慢慢走一圈，他走得比較慢。 A slow walk in the park with Grandpa.', '吉安鄉', '中央路 45 號', 1, '16:00', 1, 10),
    mk('demo3', ['clean'], '打掃客廳和浴室。 Clean the living room and bathroom.', '玉里鎮', '中正路 88 號', 2, '09:30', 3, 20),
    mk('demo4', ['cook'], '想吃熱的晚餐，請幫忙煮簡單的菜。 A simple hot dinner, please.', '新城鄉', '博愛路 7 號', 2, '17:00', 2, 12),
    mk('demo5', ['clean', 'walk'], '整理房間，然後在社區走走。 Tidy the room, then a walk around the neighbourhood.', '花蓮市', '林森路 210 號', 3, '14:00', 4, 25),
    ...getJobs().filter((j) => !j.demo),
  ]);
  vset('tc_seeded_hl', true);
}

// Posts disappear automatically after their "valid until" day.
function purgeExpired() {
  const js = getJobs();
  const keep = js.filter((j) => j.expires > Date.now());
  if (keep.length !== js.length) saveJobs(keep);
  return keep;
}
setInterval(() => {
  const before = getJobs().length;
  if (purgeExpired().length !== before && /^(give|vol)/.test(currentView())) rerender();
}, 60000);

function rerender() {
  const y = window.scrollY;
  renderView();
  window.scrollTo(0, y);
}

function twoTap(btn, confirmHTML, action) {
  if (btn.dataset.armed) { clearTimeout(btn._t); action(); return; }
  btn.dataset.armed = '1';
  btn.dataset.orig = btn.innerHTML;
  btn.innerHTML = confirmHTML;
  btn.classList.add('armed');
  btn._t = setTimeout(() => {
    btn.innerHTML = btn.dataset.orig;
    delete btn.dataset.armed;
    btn.classList.remove('armed');
  }, 4000);
}

function typeNames(types, lang) {
  return types.map((k) => `${JOB_TYPES[k].icon} ${lang === 'en' ? JOB_TYPES[k].en : JOB_TYPES[k].zh}`).join('、');
}

/* =========================================================
   Elder side: 我需要志工
   ========================================================= */
function renderGive() {
  vinit(); purgeExpired();
  setHeader('我需要志工', true, 'give', 'tc');
  app.className = '';
  if (!me()) { renderSignIn('give'); return; }
  const mine = getJobs().filter((j) => j.owner === sessionName()).sort((a, b) => b.posted - a.posted);
  app.innerHTML = `
    ${pageHead(LOTUS, '我需要志工', 'I need a volunteer')}
    <div class="vwrap">
      <div class="vrow"><p class="vhi">${esc(sessionName())}</p><button type="button" class="btn-ghost sm" data-v="signout">${B('登出', 'Sign out')}</button></div>
      <a class="btn-primary" href="#give-new" data-say="發佈新的需求"><span class="plus" aria-hidden="true">＋</span>${B('發佈新的志工需求', 'Post a new request')}</a>
      <h2 class="vh">${B(`${esc(sessionName())} 的貼文`, `Posts by ${esc(sessionName())}`)}</h2>
      <p class="vnote">${B('這裡只列出這個帳號發佈的需求。志工會在「我想當志工」看到所有需求。', 'Only this account’s requests are listed here. Volunteers see every request under “I want to volunteer”.')}</p>
      ${shareNote()}
      ${mine.length ? mine.map(giveCard).join('') : `<p class="vempty">${B('這個帳號還沒有貼文', 'This account has no posts yet')}</p>`}
    </div>`;
}

// Without KindWorld, posts never leave this phone — say so plainly.
function shareNote() {
  if (kw.on) return '';
  return `<p class="ferr local-note">${B('目前只存在這支手機：還沒連上 KindWorld，所以其他手機看不到這些需求。', 'Saved on this phone only: not connected to KindWorld yet, so other phones can’t see these requests.')}</p>`;
}

function giveCard(j) {
  const types = j.types.map((k) => B(`${JOB_TYPES[k].icon} ${JOB_TYPES[k].zh}`, JOB_TYPES[k].en)).join('');
  return `
    <article class="vcard">
      <div class="jtypes">${types}</div>
      <ul class="jfacts">
        <li><span aria-hidden="true">📍</span>${B(`${j.city} ${esc(j.address)}`, `${cityLabel(j.city, 'en')}`)}</li>
        <li><span aria-hidden="true">📅</span>${B(fmtDate(dateEnd(j.date), 'zh'), fmtDate(dateEnd(j.date), 'en'))}</li>
        <li><span aria-hidden="true">🕘</span>${B(`${j.start}・${j.hours} 小時`, `${j.start} · ${j.hours} hr`)}</li>
        <li><span aria-hidden="true">👥</span>${B(`已報名 ${signedUp(j)} / ${j.people} 人`, `${signedUp(j)} of ${j.people} signed up`)}</li>
        <li><span aria-hidden="true">⏳</span>${B(`保留到 ${fmtDate(j.expires, 'zh')}，之後自動刪除`, `Kept until ${fmtDate(j.expires, 'en')}, then deleted automatically`)}</li>
      </ul>
      <button type="button" class="btn-ghost danger" data-v="del" data-id="${j.id}">${B('刪除這篇貼文', 'Delete this post')}</button>
    </article>`;
}

function nstep(field) {
  const unit = field === 'hours' ? B('小時', 'hours') : B('位', 'people');
  return `
    <div class="nstep" role="group" aria-label="${field}">
      <button type="button" data-v="step" data-f="${field}" data-d="-1" aria-label="減少 Less">−</button>
      <output id="n-${field}"><b class="nv">0</b>${unit}</output>
      <button type="button" data-v="step" data-f="${field}" data-d="1" aria-label="增加 More">＋</button>
    </div>`;
}

function timeOptions() {
  const out = [];
  for (let h = 6; h <= 20; h++) for (const m of ['00', '30']) out.push(`${String(h).padStart(2, '0')}:${m}`);
  return out.map((t) => `<option value="${t}">${t}</option>`).join('');
}

function renderGiveNew() {
  vinit();
  if (!me()) { setHeader('我需要志工', true, 'give', 'tc'); renderSignIn('give'); return; }
  setHeader('發佈志工需求', true, 'give', 'tc');
  app.className = '';
  app.innerHTML = `
    ${pageHead(LOTUS, '發佈志工需求', 'Post a request')}
    <div class="vwrap" id="gform">
      <section class="vcard">
        <p class="flabel">${B('需要什麼幫忙？（選一個）', 'What help do you need? (choose one)')}</p>
        <div class="choices">
          ${Object.entries(JOB_TYPES).map(([k, t]) => `
            <button type="button" class="choice" data-v="type" data-k="${k}" data-say="${t.zh}" aria-pressed="false">
              <span class="ci" aria-hidden="true">${t.icon}</span>${B(t.zh, t.en)}
            </button>`).join('')}
        </div>
      </section>

      <section class="vcard">
        <label class="flabel" for="f-desc">${B('說明', 'Description')}</label>
        <textarea class="in" id="f-desc" rows="4" maxlength="300" placeholder="例：幫忙煮午餐 · e.g. help cook lunch"></textarea>
      </section>

      <section class="vcard">
        <label class="flabel" for="f-city">${B('鄉鎮（花蓮縣）', 'Township (Hualien)')}</label>
        <button type="button" class="field" id="f-city" data-v="sheet" data-w="gcity"><span class="fi" aria-hidden="true">📍</span><span class="fv" id="f-city-v"></span><span class="chev" aria-hidden="true"></span></button>
        <label class="flabel gap" for="f-addr">${B('地址', 'Address')}</label>
        <div class="fwrap"><span class="fi" aria-hidden="true">🏠</span><input class="in" id="f-addr" maxlength="80" autocomplete="street-address" placeholder="路名、門牌號碼 · Street and number"></div>
      </section>

      <section class="vcard">
        <label class="flabel" for="f-date">${B('哪一天需要', 'Which day')}</label>
        <input class="in" id="f-date" type="date" min="${ymd(Date.now())}">
        <label class="flabel gap" for="f-start">${B('開始時間', 'Start time')}</label>
        <select class="in" id="f-start">${timeOptions()}</select>
        <p class="flabel gap">${B('需要幾小時', 'Hours needed')}</p>
        ${nstep('hours')}
      </section>

      <section class="vcard">
        <p class="flabel">${B('需要幾位志工', 'How many volunteers')}</p>
        ${nstep('people')}
      </section>

      <section class="vcard">
        <p class="flabel">${B('貼文要保留多久', 'How long to keep this post')}</p>
        <div class="opts">
          ${EXPIRY_CHOICES.map((c) => `<button type="button" class="opt" data-v="days" data-n="${c.d}" aria-pressed="false">${B(c.zh, c.en)}</button>`).join('')}
        </div>
        <p class="vnote" id="f-exp"></p>
      </section>

      <p class="ferr" id="f-err" role="alert" hidden></p>
      <button type="button" class="btn-primary" data-v="post" data-say="發佈">${B('發佈', 'Post')}</button>
    </div>`;

  qs('#f-desc').value = draft.desc;
  qs('#f-addr').value = draft.address;
  qs('#f-start').value = draft.start;
  qs('#f-date').value = draft.date;
  syncDraft();
}

function syncDraft() {
  const fe = qs('#f-err'); if (fe) fe.hidden = true;
  document.querySelectorAll('[data-v="type"]').forEach((b) => b.setAttribute('aria-pressed', String(draft.types.includes(b.dataset.k))));
  document.querySelectorAll('[data-v="days"]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.n) === draft.days)));
  const limits = { hours: [1, 8], people: [1, 6] };
  for (const f of ['hours', 'people']) {
    const out = qs(`#n-${f} .nv`);
    if (out) out.textContent = draft[f];
    document.querySelectorAll(`[data-f="${f}"]`).forEach((b) => {
      const next = draft[f] + Number(b.dataset.d);
      b.disabled = next < limits[f][0] || next > limits[f][1];
    });
  }
  const cv = qs('#f-city-v');
  if (cv) { cv.textContent = draft.city ? `${draft.city} ${cityLabel(draft.city, 'en')}` : '請選擇 Choose'; cv.classList.toggle('ph', !draft.city); }
  const exp = qs('#f-exp');
  if (exp) {
    const t = keepUntil(draft);
    exp.innerHTML = B(`保留到 ${fmtDate(t, 'zh')}，之後自動刪除`, `Kept until ${fmtDate(t, 'en')}, then deleted automatically`);
  }
}

function keepUntil(d) {
  const keep = endOfDay(Date.now() + d.days * DAY_MS);
  return d.date ? Math.min(keep, dateEnd(d.date)) : keep;
}

function giveError(zh, en) {
  const el = qs('#f-err');
  el.hidden = false;
  el.innerHTML = B(zh, en);
  el.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center' });
}

let posting = false;
async function postJob() {
  if (posting) return;
  if (!draft.types.length) return giveError('請選擇需要的幫忙。', 'Please choose the help you need.');
  if (!draft.city) return giveError('請選擇鄉鎮。', 'Please choose your township.');
  if (!draft.date) return giveError('請選擇日期。', 'Please choose the day.');
  if (draft.address.trim().length < 3) return giveError('請填寫地址。', 'Please write your address.');
  const now = Date.now();
  const job = {
    id: String(now), // numeric, like KindWorld mission ids
    types: [...draft.types], desc: draft.desc.trim(), city: draft.city, address: draft.address.trim(),
    hours: draft.hours, start: draft.start, people: draft.people, date: draft.date,
    posted: now, expires: keepUntil(draft), taken: [], owner: sessionName(),
  };
  posting = true;
  const ok = await pushJob(job);
  posting = false;
  if (!ok) return giveError('無法連線，請稍後再試。', 'Could not connect. Please try again.');
  saveJobs([job, ...getJobs()]);
  lastPosted = job;
  draft = newDraft();
  const depth = (history.state && history.state.depth) || 0;
  history.replaceState({ depth }, '', '#give-done');
  route('fwd');
}

function renderGiveDone() {
  vinit();
  if (!lastPosted) { renderGive(); return; }
  const j = lastPosted;
  setHeader('已發佈', true, 'give', 'tc');
  app.className = '';
  app.innerHTML = `
    <div class="vwrap done">
      <div class="bloom" aria-hidden="true">${LOTUS}</div>
      <h2 class="done-title">${B('已發佈！', 'Posted!')}</h2>
      <section class="vcard">
        <div class="jtypes">${j.types.map((k) => B(`${JOB_TYPES[k].icon} ${JOB_TYPES[k].zh}`, JOB_TYPES[k].en)).join('')}</div>
        <ul class="jfacts">
          <li><span aria-hidden="true">📍</span>${B(`${j.city} ${esc(j.address)}`, cityLabel(j.city, 'en'))}</li>
          <li><span aria-hidden="true">📅</span>${B(fmtDate(dateEnd(j.date), 'zh'), fmtDate(dateEnd(j.date), 'en'))}</li>
          <li><span aria-hidden="true">🕘</span>${B(`${j.start}・${j.hours} 小時`, `${j.start} · ${j.hours} hr`)}</li>
          <li><span aria-hidden="true">👥</span>${B(`需要 ${j.people} 位志工`, `${j.people} volunteer${j.people > 1 ? 's' : ''} needed`)}</li>
          <li><span aria-hidden="true">⏳</span>${B(`保留到 ${fmtDate(j.expires, 'zh')}`, `Kept until ${fmtDate(j.expires, 'en')}`)}</li>
        </ul>
      </section>
      ${shareNote()}
      <a class="btn-primary" href="#give" data-say="看我的貼文">${B('看我的貼文', 'See my posts')}</a>
    </div>`;
  say('已發佈');
}

/* =========================================================
   Volunteer side: 我想當志工
   ========================================================= */
function vHead(title) {
  return `
    <header class="page-head">
      <span class="head-mark" aria-hidden="true">${LOTUS}</span>
      <div><p class="head-zh">${title}</p><p class="head-en" lang="${vlang === 'en' ? 'en' : 'zh-TW'}">${L('用愛付出', 'Give with love')}</p></div>
    </header>`;
}

function langRow(extra = '') {
  return `
    <div class="vrow">
      <div class="seg" role="group" aria-label="Language 語言">
        <button type="button" data-v="lang" data-l="zh" aria-pressed="${vlang === 'zh'}">中文</button>
        <button type="button" data-v="lang" data-l="en" aria-pressed="${vlang === 'en'}">EN</button>
      </div>
      ${extra}
    </div>`;
}

function renderVol() {
  vinit(); purgeExpired();
  setHeader(L('我想當志工', 'I want to volunteer'), true, 'vol', 'tc');
  app.className = '';
  const u = me();
  if (!u) return renderSignIn();
  if (!isTown(u.city)) return renderCityPick(u); // also catches old all-Taiwan choices
  renderBoard(u);
}

function renderSignIn(role = 'vol') {
  const g = role === 'give';
  const T = (zh, en) => (g ? B(zh, en) : L(zh, en));
  app.innerHTML = `
    ${g ? pageHead(LOTUS, '登入', 'Sign in') : vHead(L('志工登入', 'Volunteer sign in'))}
    <div class="vwrap">
      ${g ? '' : langRow()}
      <section class="vcard">
        <div class="seg wide" role="group">
          <button type="button" data-v="mode" data-m="signin" aria-pressed="${vMode === 'signin'}">${T('登入', 'Sign in')}</button>
          <button type="button" data-v="mode" data-m="signup" aria-pressed="${vMode === 'signup'}">${T('建立帳號', 'Create account')}</button>
        </div>
        <label class="flabel gap" for="v-name">${T('名稱', 'Name')}</label>
        <input class="in" id="v-name" autocomplete="username" maxlength="20">
        <label class="flabel gap" for="v-pw">${T('密碼（至少 4 個字）', 'Password (at least 4 characters)')}</label>
        <input class="in" id="v-pw" type="password" autocomplete="${vMode === 'signin' ? 'current-password' : 'new-password'}" maxlength="40">
        <p class="ferr" id="v-err" role="alert" hidden></p>
        <button type="button" class="btn-primary gap" data-v="auth">${vMode === 'signin' ? T('登入', 'Sign in') : T('建立帳號', 'Create account')}</button>
        <p class="vnote">${T('示範版：帳號只存在這個瀏覽器。請不要使用其他網站的密碼。', 'Prototype: accounts stay in this browser. Do not reuse a password from another site.')}</p>
      </section>
    </div>`;
}

async function hashPw(name, pw) {
  const text = name.toLowerCase() + '|' + pw;
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch { return 'x' + btoa(unescape(encodeURIComponent(text))); }
}

async function doAuth() {
  const name = qs('#v-name').value.trim();
  const pw = qs('#v-pw').value;
  const err = qs('#v-err');
  const giveSide = /^give/.test(currentView());
  const fail = (zh, en) => { err.hidden = false; err.innerHTML = giveSide ? B(zh, en) : L(zh, en); };
  if (name.length < 2) return fail('名稱至少 2 個字。', 'Name needs at least 2 characters.');
  if (pw.length < 4) return fail('密碼至少 4 個字。', 'Password needs at least 4 characters.');
  const key = Object.keys(getUsers()).find((k) => k.toLowerCase() === name.toLowerCase());
  const h = await hashPw(name, pw);
  if (vMode === 'signup') {
    if (key) return fail('這個名稱已經有人用了。', 'That name is already taken.');
    const us = getUsers();
    us[name] = { h, points: 0, earned: 0, hours: 0, city: '', jobs: [], created: Date.now() };
    saveUsers(us);
    vset('tc_session', name);
  } else {
    const u = key ? getUsers()[key] : null;
    if (!u || u.h !== h) return fail('名稱或密碼不正確。', 'Name or password is not correct.');
    vset('tc_session', key);
  }
  rerender();
}

function renderCityPick(u) {
  app.innerHTML = `
    ${vHead(L('你住在花蓮哪裡？', 'Where in Hualien are you?'))}
    <div class="vwrap">
      ${langRow()}
      <p class="vnote big">${L('我們只會顯示你所在鄉鎮的需求。', 'We only show requests in your township.')}</p>
      ${townGrid(u.city, 'setcity')}
    </div>`;
}

/* ---------- 3D township picker (花蓮縣, north to south) ---------- */
function townGrid(current, act) {
  const last = HL_TOWNS.length - 1;
  return `<div class="picker">
    <div class="hl-map" data-current="${current || ''}">
      <span class="hl-hint" aria-hidden="true">${L('點地圖或下面的按鈕', 'Tap the map or a button below')}</span>
      <span class="hl-sea" aria-hidden="true">${L('太平洋', 'Pacific')}</span>
      <span class="hl-legend" aria-hidden="true">
        <span><i style="--k:#93C29A"></i>${L('山地', 'Mountains')}</span>
        <span><i style="--k:#E9D8A9"></i>${L('縱谷', 'Rift valley')}</span>
        <span><i style="--k:#8CCBD8"></i>${L('海岸', 'Coast')}</span>
      </span>
    </div>
    <p class="towns-axis" aria-hidden="true"><span>⬆ ${L('北', 'North')}</span><span>${L('花蓮縣', 'Hualien County')}</span><span>${L('南', 'South')} ⬇</span></p>
    <div class="towns" role="group" aria-label="${L('選擇鄉鎮', 'Choose township')}">
      ${HL_TOWNS.map(([zh, en], i) => `
        <button type="button" class="town" data-v="${act}" data-c="${zh}" aria-pressed="${zh === current}" style="--i:${i}">
          <span class="town-face">
            <span class="town-loc" aria-hidden="true"><i style="--y:${Math.round((i / last) * 100)}%"></i></span>
            <span class="town-name"><span>${zh}</span><span class="en" lang="en">${en}</span></span>
            <span class="town-ok" aria-hidden="true">✓</span>
          </span>
        </button>`).join('')}
    </div>
  </div>`;
}

const pickerMap = (el) => { const m = el.closest('.picker')?.querySelector('.hl-map'); return m && m._map; };

// Pointing at a township button lights it up on the map too.
document.addEventListener('pointerover', (e) => {
  const t = e.target.closest('.town');
  if (t) pickerMap(t)?.preview(t.dataset.c);
});
document.addEventListener('pointerout', (e) => {
  const t = e.target.closest('.town');
  if (t && !t.contains(e.relatedTarget)) pickerMap(t)?.preview(null);
});
document.addEventListener('focusin', (e) => {
  const t = e.target.closest('.town');
  if (t) pickerMap(t)?.preview(t.dataset.c);
});

// The chosen tile lifts and spins toward you, the rest sink back; then `done` runs.
function pickTown(btn, done) {
  const grid = btn.closest('.towns');
  if (grid.classList.contains('picking')) return;
  grid.querySelectorAll('.town').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
  say(btn.dataset.c);
  const map = pickerMap(btn);
  if (map) map.pick(btn.dataset.c);
  if (reduceMotion()) { done(); return; }
  grid.classList.add('picking');
  btn.classList.add('picked');
  setTimeout(done, map ? 1000 : 650); // a little longer so the map can lift the township
}

function ptsChip(u) {
  return `<div class="pts" id="pts"><span class="pl" aria-hidden="true">${LOTUS}</span><b>${u.points || 0}</b><span>${L('點', 'pts')}</span></div>`;
}

function renderBoard(u) {
  const open = (u.jobs || []).filter((e) => e.status === 'open').length;
  const list = getJobs()
    .filter((j) => j.city === u.city)
    .sort((a, b) => b.posted - a.posted);
  app.innerHTML = `
    ${vHead(L('志工需求', 'Volunteer requests'))}
    <div class="vwrap">
      <div class="vtop">
        <div><p class="vhi">${L('你好，', 'Hello, ')}${esc(u.name)}</p><p class="vsub">${L(`每做 1 小時得 ${POINTS_PER_HOUR} 點`, `${POINTS_PER_HOUR} points for every hour`)}</p></div>
        ${ptsChip(u)}
      </div>
      ${langRow(`<button type="button" class="btn-ghost sm" data-v="signout">${L('登出', 'Sign out')}</button>`)}
      <section class="vcard">
        <label class="flabel" for="v-city">${L('你的鄉鎮（花蓮縣）', 'Your township (Hualien)')}</label>
        <button type="button" class="field" id="v-city" data-v="sheet" data-w="vcity"><span class="fi" aria-hidden="true">📍</span><span class="fv">${cityLabel(u.city)}</span><span class="chev" aria-hidden="true"></span></button>
        <a class="btn-ghost gap" href="#vol-mine">${L('我的志工紀錄', 'My volunteering')}${open ? `<span class="badge">${open}</span>` : ''}</a>
      </section>
      ${featureNav()}
      <h2 class="vh">${L('這個鄉鎮的需求', 'Requests in this township')}</h2>
      ${shareNote()}
      ${list.length ? list.map((j) => jobCard(j, u)).join('') : `<p class="vempty">${L('目前沒有需求。可以換一個鄉鎮看看。', 'No requests right now. Try another township.')}</p>`}
    </div>`;
}

function jobCard(j, u) {
  const mineTaken = j.taken.includes(u.name);
  const full = signedUp(j) >= j.people;
  const dots = Array.from({ length: j.people }, (_, i) => `<i class="${i < signedUp(j) ? 'on' : ''}"></i>`).join('');
  const action = mineTaken
    ? `<button type="button" class="btn-primary" disabled>✓ ${L('已報名', 'Signed up')}</button>`
    : full
      ? `<button type="button" class="btn-primary" disabled>${L('名額已滿', 'Full')}</button>`
      : `<button type="button" class="btn-primary" data-v="take" data-id="${j.id}">${L('我要做這個', "I'll do this")}</button>`;
  return `
    <article class="vcard job">
      <div class="jhead">
        <div class="tags">${j.types.map((k) => `<span class="tag">${JOB_TYPES[k].icon} ${vlang === 'en' ? JOB_TYPES[k].en : JOB_TYPES[k].zh}</span>`).join('')}</div>
        ${j.demo ? `<span class="tag demo">${L('示範', 'Example')}</span>` : ''}
      </div>
      ${j.desc ? `<p class="jdesc">${esc(j.desc)}</p>` : ''}
      <ul class="jfacts">
        <li><span aria-hidden="true">📅</span>${j.date ? fmtDate(dateEnd(j.date), vlang) : ''} · ${j.start} · ${hoursText(j.hours)}</li>
        <li><span aria-hidden="true">⭐</span>+${j.hours * POINTS_PER_HOUR} ${L('點', 'points')}</li>
        <li><span aria-hidden="true">👥</span>${L(`已報名 ${signedUp(j)} / ${j.people}`, `${signedUp(j)} of ${j.people} signed up`)} <span class="dots" aria-hidden="true">${dots}</span></li>
        <li><span aria-hidden="true">⏳</span>${L('到', 'Until')} ${fmtDate(j.expires, vlang)}</li>
        <li><span aria-hidden="true">🔒</span>${L('報名後才會顯示地址', 'Address is shown after you sign up')}</li>
      </ul>
      ${action}
    </article>`;
}

let taking = false;
async function takeJob(id) {
  const u = me();
  if (!u || taking) return;
  taking = true;
  try {
    // Get the latest list first, so two volunteers don't take the last place.
    if (kw.on && !(await syncJobs())) { netFail(); return; }
    const js = getJobs();
    const j = js.find((x) => x.id === id);
    if (!j || j.expires <= Date.now()) { showToast(L('這個需求已經結束。', 'This request has ended.')); rerender(); return; }
    if (j.taken.includes(u.name) || signedUp(j) >= j.people) { rerender(); return; }
    j.taken.push(u.name);
    if (!(await pushJob(j))) return;
    saveJobs(js);
    addMyJob(j);
  } finally {
    taking = false;
  }
}

function addMyJob(j) {
  updateMe((us) => {
    us.jobs = us.jobs || [];
    us.jobs.push({
      jobId: j.id, status: 'open', takenAt: Date.now(),
      snap: { date: j.date, types: j.types, desc: j.desc, city: j.city, address: j.address, hours: j.hours, start: j.start, expires: j.expires },
    });
  });
  showToast(L('報名成功！\n地址在「我的志工紀錄」', 'Signed up!\nSee the address in My volunteering'));
  rerender();
}

function renderMine() {
  vinit();
  setHeader(L('我的志工紀錄', 'My volunteering'), true, 'vol', 'tc');
  app.className = '';
  const u = me();
  if (!u) { renderSignIn(); return; }
  const jobs = u.jobs || [];
  const open = jobs.filter((e) => e.status === 'open');
  const done = jobs.filter((e) => e.status === 'done').sort((a, b) => b.doneAt - a.doneAt);
  app.innerHTML = `
    ${vHead(L('我的志工紀錄', 'My volunteering'))}
    <div class="vwrap">
      <div class="vtop">
        <div><p class="vhi">${L(`累計 ${u.hours || 0} 小時`, `${u.hours || 0} hours so far`)}</p><p class="vsub">${L('完成後按「完成」領點數', 'Tap Finish when you are done to get points')}</p></div>
        ${ptsChip(u)}
      </div>
      ${langRow()}
      <h2 class="vh">${L('要去做的', 'To do')}</h2>
      ${open.length ? open.map((e) => mineCard(e)).join('') : `<p class="vempty">${L('還沒有報名。回到列表看看。', 'Nothing yet. Go back to the list.')}</p>`}
      ${done.length ? `<h2 class="vh">${L('已完成', 'Done')}</h2>${done.map((e) => `
        <article class="vcard done-row">
          <div class="jhead"><div class="tags">${e.snap.types.map((k) => `<span class="tag">${JOB_TYPES[k].icon} ${vlang === 'en' ? JOB_TYPES[k].en : JOB_TYPES[k].zh}</span>`).join('')}</div><span class="tag gold">+${e.points}</span></div>
          <p class="vnote">${cityLabel(e.snap.city)} · ${hoursText(e.snap.hours)} · ${fmtDate(e.doneAt, vlang)}</p>
        </article>`).join('')}` : ''}
    </div>`;
}

function mineCard(e) {
  const s = e.snap;
  return `
    <article class="vcard job">
      <div class="jhead"><div class="tags">${s.types.map((k) => `<span class="tag">${JOB_TYPES[k].icon} ${vlang === 'en' ? JOB_TYPES[k].en : JOB_TYPES[k].zh}</span>`).join('')}</div></div>
      ${s.desc ? `<p class="jdesc">${esc(s.desc)}</p>` : ''}
      <ul class="jfacts">
        <li><span aria-hidden="true">📍</span>${cityLabel(s.city)} ${esc(s.address)}</li>
        <li><span aria-hidden="true">📅</span>${s.date ? fmtDate(dateEnd(s.date), vlang) : ''} · ${s.start} · ${hoursText(s.hours)}</li>
        <li><span aria-hidden="true">⭐</span>+${s.hours * POINTS_PER_HOUR} ${L('點', 'points')}</li>
      </ul>
      <button type="button" class="btn-primary" data-v="finish" data-id="${e.jobId}">${L('完成', 'Finish')} +${s.hours * POINTS_PER_HOUR}</button>
      <button type="button" class="btn-ghost danger" data-v="cancel" data-id="${e.jobId}">${L('取消報名', 'Cancel sign-up')}</button>
    </article>`;
}

function finishJob(id) {
  const before = (me() || {}).points || 0;
  const hadBadges = me() ? badgeIds(me()) : [];
  let gained = 0;
  updateMe((u) => {
    const e = (u.jobs || []).find((x) => x.jobId === id && x.status === 'open');
    if (!e) return;
    e.status = 'done';
    e.doneAt = Date.now();
    e.points = e.snap.hours * POINTS_PER_HOUR;
    gained = e.points;
    u.earned = earnedOf(u) + gained; // lifetime total, not reduced by rewards
    u.points = (u.points || 0) + gained;
    u.hours = (u.hours || 0) + e.snap.hours;
  });
  if (!gained) return;
  rerender();
  const chip = qs('#pts');
  if (chip) {
    chip.classList.add('bump');
    countUp(chip.querySelector('b'), before, before + gained);
  }
  const fresh = BADGES.filter((b) => badgeIds(me()).includes(b.id) && !hadBadges.includes(b.id));
  showToast(fresh.length
    ? L(`謝謝你！+${gained} 點\n新徽章：${fresh.map((b) => b.icon + b.zh).join('、')}`, `Thank you! +${gained} points\nNew badge: ${fresh.map((b) => b.icon + ' ' + b.en).join(', ')}`)
    : L(`謝謝你！+${gained} 點`, `Thank you! +${gained} points`));
  shareStats();
}

async function cancelJob(id) {
  const u = me();
  if (!u) return;
  if (kw.on && !(await syncJobs())) { netFail(); return; }
  const js = getJobs();
  const j = js.find((x) => x.id === id);
  if (j) {
    j.taken = j.taken.filter((n) => n !== u.name);
    if (!(await pushJob(j))) return;
    saveJobs(js);
  }
  updateMe((us) => { us.jobs = (us.jobs || []).filter((x) => !(x.jobId === id && x.status === 'open')); });
  rerender();
}

function countUp(el, from, to) {
  if (!el) return;
  if (reduceMotion()) { el.textContent = to; return; }
  const t0 = performance.now();
  el.textContent = from;
  (function step(t) {
    const p = Math.min(1, (t - t0) / 800);
    el.textContent = Math.round(from + (to - from) * p);
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}

/* =========================================================
   Events
   ========================================================= */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-v]');
  if (!el) return;
  const d = el.dataset;
  switch (d.v) {
    case 'type': {
      draft.types = [d.k];
      syncDraft(); break;
    }
    case 'step': {
      const lim = { hours: [1, 8], people: [1, 6] }[d.f];
      draft[d.f] = Math.min(lim[1], Math.max(lim[0], draft[d.f] + Number(d.d)));
      syncDraft(); break;
    }
    case 'days': draft.days = Number(d.n); syncDraft(); break;
    case 'post': postJob(); break;
    case 'del': twoTap(el, B('再按一次，確定刪除', 'Tap again to delete'), async () => {
      if (!(await dropJob(d.id))) return;
      saveJobs(getJobs().filter((j) => j.id !== d.id));
      rerender();
    }); break;
    case 'lang': vlang = d.l === 'en' ? 'en' : 'zh'; vset('tc_lang', vlang); rerender(); break;
    case 'mode': vMode = d.m; rerender(); break;
    case 'auth': doAuth(); break;
    case 'signout': vset('tc_session', null); rerender(); break;
    case 'setcity': pickTown(el, () => { updateMe((u) => { u.city = d.c; }); shareStats(); rerender(); }); break;
    case 'take': takeJob(d.id); break;
    case 'finish': twoTap(el, L('再按一次，確定完成', 'Tap again to confirm'), () => finishJob(d.id)); break;
    case 'cancel': twoTap(el, L('再按一次，確定取消', 'Tap again to cancel'), () => cancelJob(d.id)); break;
    default: break;
  }
});

document.addEventListener('input', (e) => {
  if (e.target.id === 'f-desc') draft.desc = e.target.value;
  if (e.target.id === 'f-addr') draft.address = e.target.value;
});
document.addEventListener('change', (e) => {
  if (e.target.id === 'f-start') draft.start = e.target.value;
  if (e.target.id === 'f-date') { draft.date = e.target.value; syncDraft(); }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.target.id === 'v-name' || e.target.id === 'v-pw')) doAuth();
});

/* ---------- bottom sheet picker ---------- */
let sheetEl = null;
function closeSheet() {
  if (!sheetEl) return;
  const el = sheetEl; sheetEl = null;
  el.classList.remove('open');
  document.body.classList.remove('sheet-open');
  setTimeout(() => el.remove(), 260);
}
function openTownSheet(title, current, onPick) {
  closeSheet();
  const el = document.createElement('div');
  el.className = 'sheet-back';
  el.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="grab" aria-hidden="true"></div>
    <div class="sheet-head"><h2>${title}</h2><button type="button" class="sheet-x" data-v="sheetclose" aria-label="關閉 Close">✕</button></div>
    <div class="sheet-body">${townGrid(current, 'sheetpick')}</div>
  </div>`;
  el._pick = onPick;
  document.body.appendChild(el);
  document.body.classList.add('sheet-open');
  sheetEl = el;
  requestAnimationFrame(() => el.classList.add('open'));
  // Open at the top so the map is in view; it already shows the current township.
}
window.addEventListener('hashchange', closeSheet);
window.addEventListener('popstate', closeSheet);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });
document.addEventListener('click', (e) => {
  if (!sheetEl) return;
  if (e.target === sheetEl) { closeSheet(); return; }
  const el = e.target.closest('[data-v]');
  if (!el) return;
  if (el.dataset.v === 'sheetclose') closeSheet();
  else if (el.dataset.v === 'sheetpick') {
    const f = sheetEl._pick;
    pickTown(el, () => { closeSheet(); f(el.dataset.c); });
  }
});
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-v="sheet"]');
  if (!el) return;
  if (el.dataset.w === 'gcity') {
    openTownSheet('鄉鎮 · Township', draft.city, (v) => { draft.city = v; syncDraft(); });
  } else if (el.dataset.w === 'vcity') {
    const u = me();
    openTownSheet(L('選擇鄉鎮', 'Choose township'), u && u.city, (v) => { updateMe((x) => { x.city = v; }); rerender(); });
  }
});
