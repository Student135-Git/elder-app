'use strict';

/* =========================================================
   樂 → 花蓮活動 (Hualien events and reminders).
   Browse events by township and type, and tap 提醒我 to keep the
   ones you care about. Reminders are a saved list on this phone:
   the ones starting or ending within 3 days show at the top of
   this page and as a notice on the home screen.
   Data is in events-data.js.
   ========================================================= */

let evTab = 'all';
let evArea = '';
let evKind = '';

const getEvRem = () => { const r = store.get('evRem', {}); return r && typeof r === 'object' ? r : {}; };
const evDay = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const evToday = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };

// null = regular program with no dates; otherwise ended / on now / coming up.
function evStatus(e) {
  if (!e.start) return null;
  const t = evToday(), a = evDay(e.start), b = evDay(e.end || e.start);
  if (b < t) return { k: 'ended' };
  if (a <= t) { const n = Math.round((b - t) / DAY_MS); return { k: 'on', n, soon: n <= 3 }; }
  const n = Math.round((a - t) / DAY_MS);
  return { k: 'up', n, soon: n <= 3 };
}
const evLive = (e) => { const s = evStatus(e); return !(s && s.k === 'ended'); };

function evStatusText(s) {
  if (s.k === 'on') {
    return s.n === 0 ? ['進行中・今天結束', 'On now · ends today'] : [`進行中・${s.n} 天後結束`, `On now · ends in ${s.n} day${s.n > 1 ? 's' : ''}`];
  }
  if (s.n === 0) return ['今天開始', 'Starts today'];
  if (s.n === 1) return ['明天開始', 'Starts tomorrow'];
  return [`${s.n} 天後開始`, `Starts in ${s.n} days`];
}

// Saved events that start or end within 3 days.
function evSoonReminders() {
  const rem = getEvRem();
  return HL_EVENTS.filter((e) => { const s = evStatus(e); return rem[e.id] && s && s.k !== 'ended' && s.soon; });
}

// Notice for the home screen (empty when nothing is coming up).
function evHomeNotice() {
  const soon = evSoonReminders();
  if (!soon.length) return '';
  const first = soon[0];
  const more = soon.length > 1 ? `，還有 ${soon.length - 1} 個` : '';
  return `
    <a class="ev-alert" href="#fun-events" data-say="活動提醒，${first.zh.title}">
      <span class="ev-bell" aria-hidden="true">🔔</span>
      <span class="ev-alert-text"><span>${first.zh.title}${more}</span><span class="en">${evStatusText(evStatus(first))[0]}</span></span>
    </a>`;
}

function evCard(e, i, rem) {
  const s = evStatus(e);
  const st = s ? evStatusText(s) : null;
  const on = Boolean(rem[e.id]);
  return `
    <article class="ev${on ? ' saved' : ''}" style="--i:${Math.min(i, 8)}">
      <div class="ev-top">
        <span class="ev-kind">${e.zh.kind} <span class="en" lang="en">${e.en.kind}</span></span>
        ${st ? `<span class="ev-status${s.soon ? ' soon' : ''}">${st[0]}</span>` : '<span class="ev-status">定期課程</span>'}
      </div>
      <h3>${e.zh.title}</h3>
      <p class="en" lang="en">${e.en.title}${st ? ` · ${st[1]}` : ' · Regular program'}</p>
      <ul class="jfacts">
        <li><span aria-hidden="true">📅</span><span>${e.zh.when}<span class="en ev-sub" lang="en">${e.en.when}</span></span></li>
        <li><span aria-hidden="true">📍</span><span>${e.area}・${e.zh.place}<span class="en ev-sub" lang="en">${e.en.place}</span></span></li>
      </ul>
      <div class="ev-actions">
        <button type="button" class="ev-btn${on ? ' on' : ''}" data-evrem="${e.id}" aria-pressed="${on}">
          <span class="ev-btn-icon" aria-hidden="true">${on ? '✓' : '⏰'}</span>${on ? B('已設定提醒', 'Reminder on · tap to remove') : B('提醒我', 'Remind me')}
        </button>
        <a class="ev-map" href="${maps('花蓮縣' + e.area + ' ' + e.zh.place)}" target="_blank" rel="noopener" aria-label="在地圖上看 ${e.zh.place} Map">🗺️ ${B('地圖', 'Map')}</a>
      </div>
    </article>`;
}

function evListHTML() {
  const rem = getEvRem();
  const t = evToday();
  const list = HL_EVENTS
    .filter((e) => evLive(e) && (!evArea || e.area === evArea) && (!evKind || e.zh.kind === evKind) && (evTab !== 'rem' || rem[e.id]))
    // dated events first (soonest start, ongoing counted as today), regular programs last
    .sort((x, y) => (x.start ? Math.max(evDay(x.start), t) : Infinity) - (y.start ? Math.max(evDay(y.start), t) : Infinity));
  if (!list.length) {
    return `<p class="ev-empty">${evTab === 'rem'
      ? B('還沒有提醒。在活動上按「提醒我」。', 'No reminders yet. Tap “Remind me” on an event.')
      : B('目前沒有符合的活動。', 'No events match this choice.')}</p>`;
  }
  return list.map((e, i) => evCard(e, i, rem)).join('');
}

function evBannerHTML() {
  const soon = evSoonReminders();
  if (!soon.length) return '';
  return `
    <section class="ev-banner">
      <p class="ev-banner-t"><span class="ev-bell" aria-hidden="true">🔔</span> ${B('提醒清單中快到的活動', 'Coming up in your reminders')}</p>
      ${soon.map((e) => `<p>${e.zh.title} — <strong>${evStatusText(evStatus(e))[0]}</strong></p>`).join('')}
    </section>`;
}

function evTabsHTML() {
  const rem = getEvRem();
  const n = HL_EVENTS.filter((e) => rem[e.id] && evLive(e)).length;
  const tab = (id, zh, en) => `<button type="button" data-evtab="${id}" aria-pressed="${evTab === id}">${zh} <span class="en" lang="en">${en}</span></button>`;
  return tab('all', '全部活動', 'All') + tab('rem', `我的提醒 (${n})`, 'Mine');
}

function renderEvents() {
  setHeader('花蓮活動', true, 'fun', 'fun');
  app.className = '';
  const live = HL_EVENTS.filter(evLive);
  const areas = HL_TOWNS.map(([zh]) => zh).filter((a) => live.some((e) => e.area === a)); // north → south
  const kinds = [...new Map(live.map((e) => [e.zh.kind, e.en.kind]))];
  if (evArea && !areas.includes(evArea)) evArea = '';
  if (evKind && !kinds.some(([k]) => k === evKind)) evKind = '';
  app.innerHTML = `
    ${pageHead('🎪', '花蓮活動', 'Hualien events')}
    <div class="evwrap">
      <div id="ev-banner">${evBannerHTML()}</div>
      <div class="ev-tabs" id="ev-tabs" role="group" aria-label="顯示 Show">${evTabsHTML()}</div>
      <div class="ev-filters">
        <div><label class="flabel" for="ev-area">地區 <span class="en" lang="en">Area</span></label>
          <select class="in" id="ev-area">
            <option value="">所有地區 All areas</option>
            ${areas.map((a) => `<option value="${a}"${a === evArea ? ' selected' : ''}>${a} ${cityLabel(a, 'en')}</option>`).join('')}
          </select></div>
        <div><label class="flabel" for="ev-kind">類型 <span class="en" lang="en">Type</span></label>
          <select class="in" id="ev-kind">
            <option value="">所有類型 All types</option>
            ${kinds.map(([zh, en]) => `<option value="${zh}"${zh === evKind ? ' selected' : ''}>${zh} ${en}</option>`).join('')}
          </select></div>
      </div>
      <div class="evs" id="ev-list">${evListHTML()}</div>
      <p class="note ev-note">出發前請先向主辦單位確認活動資訊。更新日期：${EVENTS_UPDATED}<br><span lang="en">Please confirm details with the organizer before you go. Updated ${EVENTS_UPDATED}.</span></p>
    </div>`;
  titleEl.focus({ preventScroll: true });
}

// Redraw the parts that change, without jumping the page.
function evRefresh(animate) {
  const list = document.getElementById('ev-list');
  if (!list) return;
  document.getElementById('ev-banner').innerHTML = evBannerHTML();
  document.getElementById('ev-tabs').innerHTML = evTabsHTML();
  list.innerHTML = evListHTML();
  list.classList.toggle('still', !animate);
}

document.addEventListener('click', (e) => {
  const t = e.target;
  const tab = t.closest('[data-evtab]');
  if (tab) { evTab = tab.dataset.evtab; evRefresh(true); return; }
  const btn = t.closest('[data-evrem]');
  if (!btn) return;
  const id = btn.dataset.evrem;
  const ev = HL_EVENTS.find((x) => x.id === id);
  const rem = getEvRem();
  if (rem[id]) delete rem[id]; else rem[id] = 1;
  store.set('evRem', rem);
  evRefresh(false);
  showToast(rem[id] ? `已設定提醒：${ev.zh.title}\nReminder saved` : '已取消提醒\nReminder removed');
  say(rem[id] ? '已設定提醒' : '已取消提醒');
  const again = document.querySelector(`[data-evrem="${id}"]`);
  if (again) { again.focus({ preventScroll: true }); if (rem[id]) again.classList.add('ring'); }
});

document.addEventListener('change', (e) => {
  if (e.target.id === 'ev-area') { evArea = e.target.value; evRefresh(true); }
  if (e.target.id === 'ev-kind') { evKind = e.target.value; evRefresh(true); }
});
