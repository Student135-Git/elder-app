'use strict';

/* =========================================================
   KindWorld features for volunteers (住 → 我想當志工)
   Profile & history, badges, voucher store, leaderboard and
   certificates — the same ideas as KindWorld, in this app's
   large-button style. Uses helpers from volunteer.js.
   ⚠ Prototype: vouchers and certificates are examples only.
   ========================================================= */

// Badges are worked out from what a volunteer has done; nothing extra is stored.
const BADGES = [
  { id: 'first', icon: '🌱', zh: '第一步', en: 'First step', dzh: '完成第 1 個工作', den: 'Finish your first job', of: (s) => [s.done, 1] },
  { id: 'cook', icon: '🍳', zh: '小廚師', en: 'Kitchen helper', dzh: '完成 3 次煮飯', den: 'Help cook 3 times', of: (s) => [s.byType.cook, 3] },
  { id: 'clean', icon: '🧹', zh: '整潔天使', en: 'Tidy angel', dzh: '完成 3 次打掃', den: 'Help clean 3 times', of: (s) => [s.byType.clean, 3] },
  { id: 'walk', icon: '🚶', zh: '散步夥伴', en: 'Walking buddy', dzh: '完成 3 次陪伴散步', den: 'Go on 3 walks', of: (s) => [s.byType.walk, 3] },
  { id: 'h10', icon: '⏱️', zh: '十小時', en: '10 hours', dzh: '累計服務 10 小時', den: 'Volunteer for 10 hours', of: (s) => [s.hours, 10] },
  { id: 'h50', icon: '🏅', zh: '五十小時', en: '50 hours', dzh: '累計服務 50 小時', den: 'Volunteer for 50 hours', of: (s) => [s.hours, 50] },
  { id: 'towns', icon: '🗺️', zh: '走遍花蓮', en: 'Across Hualien', dzh: '在 3 個鄉鎮幫忙', den: 'Help in 3 townships', of: (s) => [s.towns, 3] },
  { id: 'p300', icon: '🪷', zh: '愛心 300', en: 'Kindness 300', dzh: '累計獲得 300 點', den: 'Earn 300 points in total', of: (s) => [s.earned, 300] },
];

// ⚠ Sample rewards for the prototype — codes are not real coupons.
const VOUCHERS = [
  { id: 'coffee', icon: '☕', zh: '便利商店咖啡', en: 'Convenience-store coffee', cost: 60 },
  { id: 'meal', icon: '🍱', zh: '便當折價券 NT$50', en: 'Lunch box coupon NT$50', cost: 120 },
  { id: 'donate', icon: '🤲', zh: '捐一份長者餐', en: 'Donate a meal to an elder', cost: 90 },
  { id: 'bus', icon: '🚌', zh: '公車儲值 NT$100', en: 'Bus card top-up NT$100', cost: 200 },
  { id: 'train', icon: '🚆', zh: '花東火車票折價', en: 'Hualien–Taitung train discount', cost: 260 },
  { id: 'movie', icon: '🎬', zh: '電影票', en: 'Movie ticket', cost: 300 },
];

// Certificates unlock with service hours, like KindWorld's hour-based certificates.
const CERTS = [
  { id: 'bronze', zh: '銅級', en: 'Bronze', hours: 10, color: '#B26B3A' },
  { id: 'silver', zh: '銀級', en: 'Silver', hours: 30, color: '#7C8794' },
  { id: 'gold', zh: '金級', en: 'Gold', hours: 50, color: '#B8891B' },
  { id: 'lotus', zh: '蓮花', en: 'Lotus', hours: 100, color: '#1D6FB8' },
];

let rankScope = 'town';
let remoteVols = [];

/* ---------- numbers ---------- */
const spentOf = (u) => (u.vouchers || []).reduce((s, v) => s + v.cost, 0);
const earnedOf = (u) => (u.earned != null ? u.earned : (u.points || 0) + spentOf(u));

function statsOf(u) {
  const done = (u.jobs || []).filter((e) => e.status === 'done');
  const byType = { cook: 0, clean: 0, walk: 0 };
  done.forEach((e) => e.snap.types.forEach((k) => { byType[k] = (byType[k] || 0) + 1; }));
  return {
    done: done.length, byType, hours: u.hours || 0, earned: earnedOf(u),
    towns: new Set(done.map((e) => e.snap.city)).size,
  };
}

function badgeState(u) {
  const s = statsOf(u);
  return BADGES.map((b) => {
    const [have, need] = b.of(s);
    return { ...b, have: Math.min(have, need), need, got: have >= need };
  });
}
const badgeIds = (u) => badgeState(u).filter((b) => b.got).map((b) => b.id);

function ensureUid() {
  const u = me();
  if (u && !u.uid) updateMe((x) => { x.uid = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); });
  return (me() || {}).uid;
}

/* ---------- shared leaderboard (KindWorld) ---------- */
function shareStats() {
  const u = me();
  if (!kw.on || !u) return;
  const uid = ensureUid();
  kw.saveVolunteer(uid, {
    name: u.name, city: u.city, hours: u.hours || 0, earned: earnedOf(u),
    badges: badgeIds(u).length, updated: Date.now(),
  }).catch(() => {});
}

async function loadRemoteVols() {
  if (!kw.on) return;
  try { remoteVols = await kw.listVolunteers(); } catch { /* keep the last list */ }
}

function leaderboard() {
  const rows = new Map();
  remoteVols.forEach((v) => rows.set(v.uid, v));
  Object.entries(getUsers()).forEach(([name, u]) => {
    rows.set(u.uid || 'local:' + name, { uid: u.uid || 'local:' + name, name, city: u.city, hours: u.hours || 0, earned: earnedOf(u), badges: badgeIds({ ...u, name }).length });
  });
  return [...rows.values()]
    .filter((v) => v.hours > 0 || v.earned > 0)
    .sort((a, b) => b.hours - a.hours || b.earned - a.earned);
}

/* ---------- small pieces ---------- */
function bar(have, need) {
  const pct = Math.round((Math.min(have, need) / need) * 100);
  return `<span class="bar" aria-hidden="true"><i style="width:${pct}%"></i></span>`;
}

function statTiles(u) {
  const s = statsOf(u);
  const t = (n, zh, en) => `<div class="stat"><b>${n}</b><span>${L(zh, en)}</span></div>`;
  return `<div class="stats">
    ${t(s.hours, '服務小時', 'Hours')}${t(u.points || 0, '可用點數', 'Points to spend')}
    ${t(s.done, '完成工作', 'Jobs done')}${t(`${badgeIds(u).length}/${BADGES.length}`, '徽章', 'Badges')}
  </div>`;
}

function featureNav() {
  const a = (href, icon, zh, en) => `<a class="fnav" href="${href}"><span class="fi-big" aria-hidden="true">${icon}</span><span>${L(zh, en)}</span></a>`;
  return `<nav class="fnavs" aria-label="${L('志工功能', 'Volunteer features')}">
    ${a('#vol-me', '👤', '我的檔案', 'My profile')}
    ${a('#vol-badges', '🏅', '徽章', 'Badges')}
    ${a('#vol-shop', '🎁', '兌換禮物', 'Rewards')}
    ${a('#vol-rank', '🏆', '排行榜', 'Leaderboard')}
    ${a('#vol-cert', '📜', '證書', 'Certificates')}
  </nav>`;
}

// Every feature page needs a signed-in volunteer with a township.
function featurePage(zhTitle, enTitle, body) {
  vinit();
  setHeader(L(zhTitle, enTitle), true, 'vol', 'tc');
  app.className = '';
  const u = me();
  if (!u) { renderSignIn(); return; }
  if (!isTown(u.city)) { renderCityPick(u); return; }
  app.innerHTML = `${vHead(L(zhTitle, enTitle))}<div class="vwrap">${langRow()}${body(u)}</div>`;
}

/* ---------- 我的檔案 Profile & history ---------- */
function renderProfile() {
  featurePage('我的檔案', 'My profile', (u) => {
    const done = (u.jobs || []).filter((e) => e.status === 'done').sort((a, b) => b.doneAt - a.doneAt);
    const got = badgeState(u).filter((b) => b.got);
    const vouchers = (u.vouchers || []).slice().reverse();
    return `
      <section class="vcard profile">
        <span class="avatar" aria-hidden="true">${esc(u.name.slice(0, 1))}</span>
        <div><p class="vhi">${esc(u.name)}</p><p class="vsub">📍 ${L(`花蓮縣${u.city}`, `${cityLabel(u.city, 'en')}, Hualien`)}${u.created ? ` · ${L('加入於', 'Joined')} ${fmtDate(u.created, vlang)}` : ''}</p></div>
      </section>
      ${statTiles(u)}
      <h2 class="vh">${L('我的徽章', 'My badges')}</h2>
      ${got.length
        ? `<div class="chips">${got.map((b) => `<span class="tag">${b.icon} ${L(b.zh, b.en)}</span>`).join('')}</div>`
        : `<p class="vempty">${L('完成第一個工作就能拿到第一個徽章。', 'Finish your first job to get your first badge.')}</p>`}
      <h2 class="vh">${L('服務紀錄', 'Volunteer history')}</h2>
      ${done.length ? `<ol class="history">${done.map((e) => `
        <li>
          <span class="h-date">${fmtDate(e.doneAt, vlang)}</span>
          <span class="h-what">${e.snap.types.map((k) => `${JOB_TYPES[k].icon} ${L(JOB_TYPES[k].zh, JOB_TYPES[k].en)}`).join('、')}<span class="vsub">${cityLabel(e.snap.city)} · ${hoursText(e.snap.hours)}</span></span>
          <span class="tag gold">+${e.points}</span>
        </li>`).join('')}</ol>`
        : `<p class="vempty">${L('還沒有完成的工作。', 'No finished jobs yet.')}</p>`}
      ${vouchers.length ? `<h2 class="vh">${L('我兌換的禮物', 'My rewards')}</h2>${vouchers.map(voucherCode).join('')}` : ''}`;
  });
}

/* ---------- 徽章 Badges ---------- */
function renderBadges() {
  featurePage('徽章', 'Badges', (u) => `
    <p class="vnote big">${L('做志工就會慢慢收集徽章。', 'Collect badges as you volunteer.')}</p>
    <div class="bgrid">
      ${badgeState(u).map((b, i) => `
        <article class="bdg${b.got ? ' got' : ''}" style="--i:${i}">
          <span class="bdg-icon" aria-hidden="true">${b.icon}</span>
          <p class="bdg-name">${L(b.zh, b.en)}</p>
          <p class="vsub">${L(b.dzh, b.den)}</p>
          ${b.got ? `<span class="tag gold">✓ ${L('已獲得', 'Earned')}</span>` : `${bar(b.have, b.need)}<span class="vsub">${b.have} / ${b.need}</span>`}
        </article>`).join('')}
    </div>`);
}

/* ---------- 兌換禮物 Voucher store ---------- */
function voucherCode(v) {
  const item = VOUCHERS.find((x) => x.id === v.id) || { icon: '🎁', zh: v.id, en: v.id };
  return `
    <article class="vcard voucher-own">
      <span class="v-icon" aria-hidden="true">${item.icon}</span>
      <div><p class="v-name">${L(item.zh, item.en)}</p><p class="vsub">${fmtDate(v.at, vlang)} · −${v.cost} ${L('點', 'pts')}</p></div>
      <code class="v-code">${v.code}</code>
    </article>`;
}

function renderRewards() {
  featurePage('兌換禮物', 'Rewards', (u) => `
    <div class="vtop"><p class="vnote big">${L('用志工點數換禮物。', 'Spend your volunteer points on rewards.')}</p>${ptsChip(u)}</div>
    <div class="vlist">
      ${VOUCHERS.map((v) => {
        const can = (u.points || 0) >= v.cost;
        return `
        <article class="vcard voucher">
          <span class="v-icon" aria-hidden="true">${v.icon}</span>
          <div class="v-text"><p class="v-name">${L(v.zh, v.en)}</p><p class="v-cost">${v.cost} ${L('點', 'points')}</p>
            ${can ? '' : `${bar(u.points || 0, v.cost)}<span class="vsub">${L(`還差 ${v.cost - (u.points || 0)} 點`, `${v.cost - (u.points || 0)} more points`)}</span>`}</div>
          <button type="button" class="btn-primary sm" data-v="redeem" data-id="${v.id}" ${can ? '' : 'disabled'}>${L('兌換', 'Redeem')}</button>
        </article>`;
      }).join('')}
    </div>
    <p class="vnote">${L('示範版：兌換碼不是真的優惠券。', 'Prototype: these codes are not real coupons.')}</p>`);
}

function redeem(id) {
  const v = VOUCHERS.find((x) => x.id === id);
  const u = me();
  if (!v || !u || (u.points || 0) < v.cost) return;
  const code = 'HL-' + Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + String(Date.now()).slice(-4);
  updateMe((x) => {
    x.earned = earnedOf(x); // remember lifetime points before spending
    x.points -= v.cost;
    x.vouchers = [...(x.vouchers || []), { id: v.id, cost: v.cost, code, at: Date.now() }];
  });
  showToast(L(`兌換成功！\n兌換碼 ${code}`, `Redeemed!\nCode ${code}`));
  say(L('兌換成功', 'Redeemed'));
  rerender();
}

/* ---------- 排行榜 Leaderboard ---------- */
// refresh: also share my numbers and fetch everyone's from KindWorld.
function renderRank(refresh = true) {
  featurePage('排行榜', 'Leaderboard', (u) => {
    const all = leaderboard();
    const list = rankScope === 'town' ? all.filter((v) => v.city === u.city) : all;
    const myId = u.uid || 'local:' + u.name;
    const medal = (i) => ['🥇', '🥈', '🥉'][i] || `<span class="rank-n">${i + 1}</span>`;
    return `
      <div class="seg wide" role="group" aria-label="${L('範圍', 'Scope')}">
        <button type="button" data-v="rankscope" data-s="town" aria-pressed="${rankScope === 'town'}">${cityLabel(u.city)}</button>
        <button type="button" data-v="rankscope" data-s="all" aria-pressed="${rankScope === 'all'}">${L('全花蓮', 'All Hualien')}</button>
      </div>
      <p class="vnote">${L('依服務小時排名。', 'Ranked by hours volunteered. ')}${kw.on ? '' : L('目前只顯示這支手機上的志工。', 'Only volunteers on this phone are shown for now.')}</p>
      ${list.length ? `<ol class="ranks">${list.slice(0, 50).map((v, i) => `
        <li class="rank${v.uid === myId ? ' me' : ''}" style="--i:${i}">
          <span class="rank-m" aria-hidden="true">${medal(i)}</span>
          <span class="rank-who"><b>${esc(v.name)}${v.uid === myId ? ` <span class="tag">${L('我', 'You')}</span>` : ''}</b><span class="vsub">${cityLabel(v.city)} · ${v.badges || 0} ${L('個徽章', 'badges')}</span></span>
          <span class="rank-h"><b>${v.hours}</b><span class="vsub">${L('小時', 'hrs')}</span></span>
        </li>`).join('')}</ol>`
        : `<p class="vempty">${L('還沒有人完成工作。成為第一名吧！', 'Nobody has finished a job yet. Be the first!')}</p>`}`;
  });
  if (kw.on && refresh) {
    shareStats();
    loadRemoteVols().then(() => {
      if (currentView() !== 'vol-rank') return;
      const y = window.scrollY;
      renderRank(false);
      window.scrollTo(0, y);
    });
  }
}

/* ---------- 證書 Certificates ---------- */
function certCard(c, u, issued) {
  return `
    <article class="cert" style="--cc:${c.color}">
      <div class="cert-top"><span class="cert-lotus" aria-hidden="true">${LOTUS}</span><span class="cert-level">${c.zh} · ${c.en}</span></div>
      <p class="cert-title">花蓮志工服務證書</p>
      <p class="cert-title-en" lang="en">Volunteer Service Certificate</p>
      <p class="cert-body">茲證明 <b>${esc(u.name)}</b> 在花蓮縣累計志願服務 <b>${c.hours}</b> 小時以上，特頒此證。</p>
      <p class="cert-body en" lang="en">This certifies that <b>${esc(u.name)}</b> has given at least <b>${c.hours}</b> hours of volunteer service in Hualien County.</p>
      <p class="cert-foot"><span>${issued.no}</span><span>${fmtDate(issued.at, 'zh')} · 生活助手</span></p>
    </article>`;
}

function renderCerts() {
  featurePage('證書', 'Certificates', (u) => {
    const mine = u.certs || {};
    return `
      <p class="vnote big">${L(`你已服務 ${u.hours || 0} 小時。服務時數到了，就可以申請證書。`, `You have volunteered ${u.hours || 0} hours. Reach the hours to claim each certificate.`)}</p>
      ${CERTS.map((c) => {
        if (mine[c.id]) return certCard(c, u, mine[c.id]);
        const ready = (u.hours || 0) >= c.hours;
        return `
          <article class="vcard cert-locked" style="--cc:${c.color}">
            <div class="vtop"><p class="v-name">${L(`${c.zh}志工證書`, `${c.en} certificate`)}</p><span class="tag">${c.hours} ${L('小時', 'hrs')}</span></div>
            ${ready
              ? `<button type="button" class="btn-primary" data-v="claimcert" data-id="${c.id}">${L('申請證書', 'Claim certificate')}</button>`
              : `${bar(u.hours || 0, c.hours)}<span class="vsub">${L(`還差 ${c.hours - (u.hours || 0)} 小時`, `${c.hours - (u.hours || 0)} more hours`)}</span>`}
          </article>`;
      }).join('')}
      <p class="vnote">${L('示範版：證書由生活助手示範產生，不是官方文件。', 'Prototype: certificates are examples from this app, not official documents.')}</p>`;
  });
}

function claimCert(id) {
  const c = CERTS.find((x) => x.id === id);
  const u = me();
  if (!c || !u || (u.hours || 0) < c.hours || (u.certs || {})[id]) return;
  const no = `HL-${new Date().getFullYear()}-${c.id.slice(0, 2).toUpperCase()}${String(Date.now()).slice(-5)}`;
  updateMe((x) => { x.certs = { ...(x.certs || {}), [id]: { no, at: Date.now() } }; });
  showToast(L('恭喜！證書已核發', 'Congratulations!\nCertificate issued'));
  say(L('恭喜，證書已核發', 'Certificate issued'));
  rerender();
}

/* ---------- events ---------- */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-v]');
  if (!el) return;
  const d = el.dataset;
  if (d.v === 'redeem') twoTap(el, L('再按一次，確定兌換', 'Tap again to redeem'), () => redeem(d.id));
  else if (d.v === 'claimcert') claimCert(d.id);
  else if (d.v === 'rankscope') { rankScope = d.s === 'all' ? 'all' : 'town'; renderRank(false); }
});
