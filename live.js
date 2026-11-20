'use strict';

/* =========================================================
   住 Live / Reside
     打掃 · 陪伴散步  — the elder signs in first (account database
                       when connected, otherwise this phone)
     租輔具          — pick one of five devices, no sign-in
   Every booking: address (3D township picker + typed address,
   checked on a Google map; optional "use my location" helper
   when location was allowed) → day and time, grouped as
   早上 / 中午 / 下午 / 晚上 → 同意 unlocks 確認.
   A confirmed booking is saved as a normal volunteer request.
   Volunteers sign up and take requests on the KindWorld website,
   not in this app.
   ========================================================= */

const GUEST_NAME = '長輩'; // owner of device rentals made without signing in

// Times of day, used to group the booking times.
const PERIODS = [
  { id: 'morning', icon: '🌅', zh: '早上', en: 'Morning', from: 5, to: 11 },
  { id: 'noon', icon: '☀️', zh: '中午', en: 'Noon', from: 11, to: 13 },
  { id: 'afternoon', icon: '🌤️', zh: '下午', en: 'Afternoon', from: 13, to: 18 },
  { id: 'night', icon: '🌙', zh: '晚上', en: 'Night', from: 18, to: 24 },
];
const periodOf = (start) => PERIODS.find((p) => { const h = Number(start.slice(0, 2)); return h >= p.from && h < p.to; });

// One entry per bookable service. `type` is the volunteer job type.
const SERVICES = {
  clean: { icon: '🧹', zh: '打掃', en: 'Cleaning', type: 'clean', login: true, slots: [['14:30', '16:30']] },
  walk: { icon: '🚶', zh: '陪伴散步', en: 'A walk together', type: 'walk', login: true, slots: [['06:00', '07:00'], ['15:00', '16:00']] },
  rent: { icon: '🦯', zh: '租輔具', en: 'Device rental', type: 'aid', login: false, slots: [['10:00', '11:00']] },
};
const BOOK_DAYS = 7; // how far ahead the elder can book (from tomorrow)

// Simple line drawings (no emoji exists for these).
const aidSvg = (body) => `<svg viewBox="0 0 48 48" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
const AID_ITEMS = [
  { id: 'walker', zh: '助行器', en: 'Walker',
    svg: aidSvg('<path d="M10 43 14 12h12l4 31"/><path d="M12 28h16"/><path d="M26 12l8-3 6 30" opacity=".55"/><path d="M30 26l7-1" opacity=".55"/><path d="M12 12h16" stroke-width="4"/>') },
  { id: 'rollator', zh: '帶輪助行器', en: 'Wheeled walker',
    svg: aidSvg('<path d="M14 9h9"/><path d="M18 9l3 17h14"/><path d="M21 26l-5 12"/><path d="M35 26l2 12"/><path d="M23 19h13v7"/><circle cx="15" cy="41" r="3.5"/><circle cx="37" cy="41" r="3.5"/>') },
  { id: 'chair', zh: '高腳折疊椅', en: 'Tall folding chair',
    svg: aidSvg('<path d="M14 44 31 20"/><path d="M34 44 17 20"/><path d="M12 20h24" stroke-width="4"/><path d="M34 20V5"/><path d="M29 6h10"/><path d="M19 36h10"/>') },
  { id: 'cane', zh: '單腳拐杖', en: 'Single-point cane',
    svg: aidSvg('<path d="M17 14a7 7 0 0 1 14 0v28"/><path d="M28 43h6" stroke-width="4"/>') },
  { id: 'quad', zh: '四腳拐杖', en: 'Four-point cane',
    svg: aidSvg('<path d="M15 8h14" stroke-width="4"/><path d="M26 8v26"/><path d="M14 34h24"/><path d="M14 34l-2 9"/><path d="M22 34l-1 9"/><path d="M30 34l1 9"/><path d="M38 34l2 9"/>') },
];

const timeText = ([a, b]) => `${a}–${b}`;
const hoursOf = ([a, b]) => (Number(b.slice(0, 2)) * 60 + Number(b.slice(3)) - Number(a.slice(0, 2)) * 60 - Number(a.slice(3))) / 60;

/* ---------- 住 page ---------- */
const getBookings = () => { const b = store.get('bookings', []); return Array.isArray(b) ? b : []; };

function renderLive() {
  vinit(); purgeExpired();
  setHeader('居家', true, 'cat', 'home');
  app.className = '';
  const u = me();
  const row = (icon, zh, en, sub, href, extra = '') => `
    <li><a class="action" href="${href}" data-say="${zh}" ${extra}>
      <span class="action-icon" aria-hidden="true">${icon}</span>
      <span class="action-text"><span>${zh}</span><span class="en" lang="en">${en}</span>${sub ? `<span class="live-sub">${sub}</span>` : ''}</span>
    </a></li>`;
  const slots = (k) => SERVICES[k].slots.map((s) => `${periodOf(s[0]).zh} ${timeText(s)}`).join('、');
  const ids = getBookings();
  const booked = getJobs().filter((j) => ids.includes(j.id)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  app.innerHTML = `
    ${pageHead('住', '居家', 'Live / Reside')}
    <div class="vwrap live-account">
      ${u
        ? `<div class="vrow"><p class="vhi">👤 ${esc(u.name)}</p><button type="button" class="btn-ghost sm" data-v="signout">${B('登出', 'Sign out')}</button></div>`
        : `<p class="vnote big">${B('預約打掃和陪伴散步要先登入。', 'Sign in to book cleaning or a walk.')}</p>`}
    </div>
    <h2 class="live-group">${B('打掃和陪伴散步', 'Cleaning and a walk together')}</h2>
    <ul class="actions live-main">
      ${row(SERVICES.clean.icon, '打掃', 'Cleaning', slots('clean'), '#home-clean', 'data-live="start"')}
      ${row(SERVICES.walk.icon, '陪伴散步', 'A walk together', slots('walk'), '#home-walk', 'data-live="start"')}
    </ul>
    <h2 class="live-group">${B('租輔具', 'Rent assistive devices')}</h2>
    <ul class="actions live-main">
      ${row(AID_ITEMS[0].svg, '租輔具', 'Rent assistive devices', '助行器、拐杖、高腳椅…', '#home-aids')}
    </ul>
    <div class="vwrap">${rulesNote(false)}</div>
    ${booked.length ? `<div class="vwrap live-booked"><h2 class="vh">${B('我的預約', 'My bookings')}</h2>${booked.map(giveCard).join('')}</div>` : ''}
    <div class="vwrap"><button type="button" class="btn-ghost sm live-privacy" data-live="privacy">${B('資料和位置設定', 'Data and location settings')}</button></div>`;
  titleEl.focus({ preventScroll: true });
}

/* ---------- booking: (sign in) → address → day and time → 同意 → 確認 ---------- */
let booking = { step: 'idle', svc: null };
let bookMap = null; // Google map under the address box

function nextDays() {
  return Array.from({ length: BOOK_DAYS }, (_, i) => {
    const t = Date.now() + (i + 1) * DAY_MS;
    const d = new Date(t);
    return {
      ymd: ymd(t),
      top: i === 0 ? '明天' : i === 1 ? '後天' : '週' + '日一二三四五六'[d.getDay()],
      topEn: i === 0 ? 'Tomorrow' : new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d),
      md: `${d.getMonth() + 1}/${d.getDate()}`,
      zh: new Intl.DateTimeFormat('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' }).format(d),
      en: new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', weekday: 'long' }).format(d),
    };
  });
}

// The last address typed is offered again next time.
const getMyAddr = () => { const a = store.get('myAddr', null); return a && typeof a === 'object' ? a : { town: '', address: '' }; };

const headFor = (s, item) => (item ? pageHead(item.svg, item.zh, item.en) : pageHead(s.icon, s.zh, s.en));

function addressForm(head) {
  const loc = getConsent().location;
  app.innerHTML = `${head}
    <div class="vwrap">
      <p class="vnote big">${B('請選鄉鎮，再打您家的地址。下面的地圖會顯示這個地址，請確認位置對不對。', 'Choose your township, then type your home address. The map below shows it — please check it is right.')}</p>
      <section class="vcard">
        ${loc ? `<button type="button" class="btn-ghost live-locate" data-live="locate">📍 ${B('用我現在的位置找鄉鎮', 'Use my location to find my township')}</button><p class="vnote" id="bk-loc" hidden></p>` : ''}
        <label class="flabel" for="bk-town">${B('鄉鎮（花蓮縣）', 'Township (Hualien)')}</label>
        <button type="button" class="field" id="bk-town" data-w="bktown"><span class="fi" aria-hidden="true">📍</span><span class="fv${booking.town ? '' : ' ph'}" id="bk-town-v">${booking.town ? `${booking.town} ${cityLabel(booking.town, 'en')}` : '請選擇 Choose'}</span><span class="chev" aria-hidden="true"></span></button>
        <label class="flabel gap" for="bk-addr">${B('地址（路名、門牌號碼）', 'Address (street and number)')}</label>
        <div class="fwrap"><span class="fi" aria-hidden="true">🏠</span><input class="in" id="bk-addr" maxlength="80" autocomplete="street-address" placeholder="例：中山路 123 號 · e.g. 123 Zhongshan Rd"></div>
        <div class="addr-box">
          <div class="addr-map" id="bk-map"></div>
          <p class="vnote addr-tip"></p>
          <a class="addr-open" href="#" target="_blank" rel="noopener">${B('在 Google 地圖打開', 'Open in Google Maps')} ↗</a>
        </div>
      </section>
      <p class="ferr" id="bk-err" role="alert" hidden></p>
      <button type="button" class="btn-primary" data-live="addrNext" data-say="下一步">${B('下一步', 'Next')}</button>
    </div>`;
  document.getElementById('bk-addr').value = booking.address || '';
  bookMap = addrMap.mount(document.getElementById('bk-map'), { town: booking.town, address: booking.address || '' }, {
    onPin(town, address, ll) { // only with a Google Maps key: the elder moved the pin
      booking.lat = ll.lat; booking.lng = ll.lng;
      if (town && town !== booking.town) { booking.town = town; bookMap.adoptTown(town); showTown(); }
      if (address) { booking.address = address; document.getElementById('bk-addr').value = address; }
    },
    onFound(ll) { booking.lat = ll.lat; booking.lng = ll.lng; },
  });
}

function showTown() {
  const v = document.getElementById('bk-town-v');
  if (!v) return;
  v.textContent = booking.town ? `${booking.town} ${cityLabel(booking.town, 'en')}` : '請選擇 Choose';
  v.classList.toggle('ph', !booking.town);
}

// Our booking rules, shown on the 住 page and before choosing a day.
function rulesNote(full) {
  const times = Object.values(SERVICES).map((x) => `${x.type === 'aid' ? '送輔具' : x.zh} ${x.slots.map((t) => `${periodOf(t[0]).zh} ${timeText(t)}`).join('、')}`).join('；');
  const timesEn = Object.values(SERVICES).map((x) => `${x.type === 'aid' ? 'device delivery' : x.en.toLowerCase()} ${x.slots.map(timeText).join(' or ')}`).join('; ');
  return `
    <section class="rules">
      <p class="rules-t">📋 ${B('預約規則', 'Booking rules')}</p>
      <ul>
        <li>${B(`請至少提前一天預約：最早明天，最晚 ${BOOK_DAYS} 天內。當天不能預約。`, `Book at least one day ahead: from tomorrow up to ${BOOK_DAYS} days ahead. Same-day bookings are not possible.`)}</li>
        <li>${B(`服務時間是固定的：${times}。`, `Service times are fixed: ${timesEn}.`)}</li>
        ${full ? `<li>${B('同一天的同一個時段只能預約一次。', 'Each time can be booked once per day.')}</li>
        <li>${B('要取消，請到「居家」→「我的預約」刪除那筆預約。', 'To cancel, go to Live / Reside → My bookings and delete it.')}</li>` : ''}
      </ul>
    </section>`;
}

function scheduleView(head, s, item) {
  const days = nextDays();
  if (!days.some((d) => d.ymd === booking.date)) booking.date = null; // no day is chosen for the elder
  const day = days.find((d) => d.ymd === booking.date);
  const taken = getJobs().filter((j) => getBookings().includes(j.id) && j.types[0] === s.type && j.date === booking.date).map((j) => j.start);
  const chosen = day && s.slots.find((x) => x[0] === booking.slot && !taken.includes(x[0]));
  const ready = Boolean(chosen);
  const periods = PERIODS.map((p) => {
    const list = s.slots.filter((x) => periodOf(x[0]) === p);
    return `
      <div class="per${list.length ? '' : ' none'}">
        <p class="per-t"><span aria-hidden="true">${p.icon}</span> ${p.zh} <span class="en" lang="en">${p.en}</span></p>
        ${list.length ? list.map((x) => {
          const isTaken = taken.includes(x[0]);
          return `<button type="button" class="slot" data-live="slot" data-k="${x[0]}" aria-pressed="${Boolean(day) && !isTaken && x[0] === booking.slot}" ${isTaken || !day ? 'disabled' : ''}>
            <span class="slot-time">${timeText(x)}</span>${isTaken ? '<span class="slot-note">已預約 Booked</span>' : ''}</button>`;
        }).join('') : '<p class="per-none">沒有時段 <span class="en" lang="en">No times</span></p>'}
      </div>`;
  }).join('');
  const what = item ? `把「${item.zh}」送到您家` : s.zh;
  app.innerHTML = `${head}
    <div class="vwrap">
      ${rulesNote(true)}
      <section class="vcard">
        <p class="flabel">${B('哪一天', 'Which day')}</p>
        <div class="days" role="group" aria-label="日期 Day">
          ${days.map((d) => `<button type="button" class="day" data-live="day" data-k="${d.ymd}" aria-pressed="${d.ymd === booking.date}"><span class="day-top">${d.top}</span><span class="day-md">${d.md}</span><span class="en" lang="en">${d.topEn}</span></button>`).join('')}
        </div>
        <p class="flabel gap">${B('什麼時間', 'What time')}</p>
        ${day ? '' : `<p class="vnote">${B('請先選日期，再選時間。', 'Choose a day first, then a time.')}</p>`}
        <div class="pers">${periods}</div>
      </section>
      <section class="vcard live-card"${ready ? '' : ' hidden'}>
        <p class="live-big">${ready ? `${item ? '志工會在' : `${s.zh}將安排在`} <strong>${day.zh}</strong>，<strong>${periodOf(chosen[0]).zh} ${timeText(chosen)}</strong>${item ? `，${what}` : ''}。<br>請在這個時間準備好迎接我們的志工。` : ''}</p>
        <p class="live-en" lang="en">${ready ? `${item ? `A volunteer will bring the ${item.en.toLowerCase()}` : s.en} on <strong>${day.en}</strong>, <strong>${timeText(chosen)}</strong> (${periodOf(chosen[0]).en.toLowerCase()}). Please be ready to welcome our volunteer at that time.` : ''}</p>
        <p class="vnote big">📍 花蓮縣${booking.town} ${dEsc(booking.address)} <span lang="en">${cityLabel(booking.town, 'en')}</span></p>
        <button type="button" class="btn-ghost sm" data-live="editAddr">${B('修改地址', 'Change the address')}</button>
      </section>
      <p class="vnote" id="slot-hint"${ready ? ' hidden' : ''}>${day ? B('請選一個時間。', 'Please choose a time.') : B('請選日期和時間。', 'Please choose a day and a time.')}</p>
      <button type="button" class="opt live-agree" data-live="agree" aria-pressed="false" ${ready ? '' : 'disabled'}><span class="live-box" aria-hidden="true"></span>${B('同意', 'I agree')}</button>
      <button type="button" class="btn-primary live-confirm" data-live="confirm" disabled>${B('確認', 'Confirm')}</button>
      <p class="vnote" id="live-hint"${ready ? '' : ' hidden'}>${B('先按「同意」，才能按「確認」。', 'Tap “I agree” first, then Confirm.')}</p>
    </div>`;
}

function renderBook(kind) {
  vinit();
  const s = SERVICES[kind];
  if (!s) { renderLive(); return; }
  if (booking.svc !== kind) booking = { step: 'idle', svc: kind };
  const item = kind === 'rent' ? AID_ITEMS.find((a) => a.id === booking.item) : null;
  if (kind === 'rent' && !item) { // opened without choosing a device
    history.replaceState(history.state, '', '#home-aids');
    renderAids();
    return;
  }
  setHeader(s.zh, true, 'give', 'tc');
  app.className = '';
  const head = headFor(s, item);

  // 打掃 and 陪伴散步 need a signed-in elder.
  if (s.login && !me()) {
    renderSignIn('give');
    const wrap = app.querySelector('.vwrap');
    if (wrap) wrap.insertAdjacentHTML('afterbegin', `<p class="note-box">${B(`預約${s.zh}要先登入。沒有帳號？按「建立帳號」。`, `Sign in to book ${s.en.toLowerCase()}. No account? Tap “Create account”.`)}</p>`);
    return;
  }

  if (booking.step === 'idle') {
    const a = getMyAddr();
    booking = { ...booking, step: 'address', town: a.town, address: a.address, lat: null, lng: null, date: null, slot: null };
  }
  if (booking.step === 'address') { addressForm(head); return; }

  if (booking.step === 'done') {
    const d = nextDays().find((x) => x.ymd === booking.date);
    const slot = s.slots.find((x) => x[0] === booking.slot);
    app.innerHTML = `
      <div class="vwrap done">
        <div class="bloom" aria-hidden="true">${LOTUS}</div>
        <h2 class="done-title">${item ? B(`已預約租借${item.zh}！`, `${item.en} rental booked!`) : B(`已預約${s.zh}！`, `${s.en} booked!`)}</h2>
        <section class="vcard live-card">
          <p class="live-big">${d ? d.zh : booking.date}<br>${periodOf(slot[0]).zh} ${timeText(slot)}</p>
          <p class="live-en" lang="en">${d ? d.en : booking.date}, ${timeText(slot)}</p>
          <p class="vnote big">📍 花蓮縣${booking.town} ${dEsc(booking.address)} <span lang="en">${cityLabel(booking.town, 'en')}</span></p>
        </section>
        ${shareNote()}
        <a class="btn-primary" href="#home">${B('回到居家', 'Back to Live / Reside')}</a>
      </div>`;
    return;
  }

  scheduleView(head, s, item);
}

let bookSaving = false;
async function confirmBooking(btn) {
  if (bookSaving || btn.disabled || booking.step !== 'schedule') return;
  const kind = booking.svc;
  const s = SERVICES[kind];
  const slot = s.slots.find((x) => x[0] === booking.slot);
  if (!slot || !booking.date) return;
  bookSaving = true;
  const item = AID_ITEMS.find((a) => a.id === booking.item);
  const now = Date.now();
  const job = {
    id: String(now), types: [s.type], desc: item ? `租借：${item.zh} Rental: ${item.en}` : '', city: booking.town,
    address: booking.address, lat: booking.lat ?? null, lng: booking.lng ?? null,
    hours: hoursOf(slot), start: slot[0], people: 1, date: booking.date,
    posted: now, expires: dateEnd(booking.date), taken: [], owner: sessionName() || GUEST_NAME,
  };
  const ok = await pushJob(job); // shares it through KindWorld when connected
  bookSaving = false;
  if (!ok) return;
  saveJobs([job, ...getJobs()]);
  store.set('bookings', [job.id, ...getBookings()].slice(0, 30));
  booking = { ...booking, step: 'done' };
  renderBook(kind);
  window.scrollTo(0, 0);
  say('已預約');
}

/* ---------- 租輔具: choose a device, then book it ---------- */
function renderAids() {
  setHeader('租輔具', true, 'give', 'tc');
  app.className = '';
  app.innerHTML = `
    ${pageHead(AID_ITEMS[0].svg, '租輔具', 'Rent assistive devices')}
    <div class="vwrap">
      <p class="vnote big">${B('請選擇需要的輔具。', 'Choose the device you need.')}</p>
      <div class="aids">
        ${AID_ITEMS.map((a, i) => `
          <a class="aid" href="#home-rent" data-aid="${a.id}" data-say="${a.zh}" style="--i:${i}">
            <span class="aid-icon">${a.svg}</span>
            <span class="aid-name">${a.zh}</span>
            <span class="en" lang="en">${a.en}</span>
          </a>`).join('')}
      </div>
    </div>`;
  titleEl.focus({ preventScroll: true });
}

/* ---------- first visit: permission to save data and use location ---------- */
const getConsent = () => { const c = store.get('consent', null); return c && typeof c === 'object' ? c : { asked: false, location: false }; };

function showConsent() {
  if (document.querySelector('.consent-back')) return;
  const el = document.createElement('div');
  el.className = 'consent-back';
  el.innerHTML = `
    <section class="consent" role="dialog" aria-modal="true" aria-labelledby="consent-t">
      <p class="consent-icon" aria-hidden="true">🍪📍</p>
      <h2 id="consent-t">${B('允許儲存資料和位置？', 'Allow saving data and location?')}</h2>
      <ul class="consent-list">
        <li>💾 ${B('這個 App 會把您的帳號、預約和設定存在這支手機上（類似 cookies）。', 'This app keeps your account, bookings and settings on this phone (like cookies).')}</li>
        <li>📍 ${B('允許位置後，可以按一下就找到您的鄉鎮。地址還是請您自己確認。', 'With location on, one tap finds your township. You still check the address yourself.')}</li>
      </ul>
      <button type="button" class="btn-primary" data-consent="all">${B('允許（包含位置）', 'Allow, including location')}</button>
      <button type="button" class="btn-ghost" data-consent="data">${B('只儲存資料，不用位置', 'Save data only, no location')}</button>
      <p class="vnote">${B('不會分享給其他網站。可以在「居家」裡的「資料和位置設定」改。', 'Nothing is shared with other sites. Change it later in Live / Reside → Data and location settings.')}</p>
    </section>`;
  document.body.appendChild(el);
  document.body.classList.add('sheet-open');
  requestAnimationFrame(() => el.classList.add('open'));
  el.querySelector('[data-consent="all"]').focus({ preventScroll: true });
}

function answerConsent(withLocation) {
  store.set('consent', { asked: true, location: withLocation, at: Date.now() });
  const el = document.querySelector('.consent-back');
  if (el) { el.classList.remove('open'); setTimeout(() => el.remove(), 250); }
  document.body.classList.remove('sheet-open');
  if (withLocation && navigator.geolocation) {
    // Ask the phone now, so the permission question comes up once, right after "Allow".
    navigator.geolocation.getCurrentPosition(() => {}, () => {}, { timeout: 10000, maximumAge: 600000 });
  }
  say(withLocation ? '已允許' : '已儲存設定');
  if (/^home/.test(currentView())) renderView();
}

/* ---------- "use my location": find the township, then the elder checks the address ---------- */
const kmOrigin = HL_TO_LATLNG([0, 0]);
const kmUnit = HL_TO_LATLNG([1, 1]);
const latLngToKm = (lat, lng) => [(lng - kmOrigin.lng) / (kmUnit.lng - kmOrigin.lng), (lat - kmOrigin.lat) / (kmUnit.lat - kmOrigin.lat)];
function inRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
// The Hualien township that contains this point, or null outside the county.
function townAt(lat, lng) {
  const p = latLngToKm(lat, lng);
  return HL_TOWNS.map(([zh]) => zh).find((t) => inRing(p, HL_SHAPES[t][0])) || null;
}

const ROUGH_M = 300; // worse than this, the location is only a hint for the township

function locate() {
  const out = document.getElementById('bk-loc');
  const msg = (zh, en) => { if (out) { out.hidden = false; out.innerHTML = B(zh, en); } };
  if (!navigator.geolocation) { msg('這支手機無法取得位置，請自己選鄉鎮。', 'This phone cannot get a location — please choose the township.'); return; }
  msg('📍 正在找您的位置…', 'Finding your location…');
  navigator.geolocation.getCurrentPosition((pos) => {
    if (currentView() !== 'home-' + booking.svc || booking.step !== 'address') return;
    const { latitude: lat, longitude: lng, accuracy } = pos.coords;
    const m = Math.round(accuracy || 99999);
    const town = townAt(lat, lng);
    if (!town) { msg(`找到的位置不在花蓮縣（誤差約 ${m} 公尺）。請自己選鄉鎮、打地址。`, `The location found is outside Hualien (about ${m} m off). Please choose the township and type the address.`); return; }
    if (m > 3000) { msg(`位置太不準（誤差約 ${m} 公尺），沒有使用。請自己選鄉鎮。`, `The location is too rough (about ${m} m off), so it was not used. Please choose the township.`); return; }
    booking.town = town;
    showTown();
    if (bookMap) bookMap.setTown(town);
    if (m <= ROUGH_M) {
      booking.lat = lat; booking.lng = lng;
      if (bookMap) bookMap.setPoint(lat, lng);
      msg(`找到了：${town}（誤差約 ${m} 公尺）。請看地圖確認，再打門牌號碼。`, `Found: ${cityLabel(town, 'en')} (about ${m} m). Check the map, then type the house number.`);
    } else {
      msg(`大概在 ${town}（誤差約 ${m} 公尺，不夠準）。請打地址，看地圖確認。`, `Probably ${cityLabel(town, 'en')} (about ${m} m — not exact). Type the address and check the map.`);
    }
    say(`找到了，${town}`);
  }, (err) => {
    msg(err.code === 1 ? '沒有位置的許可。請在手機設定允許，或自己選鄉鎮。' : '現在找不到位置，請自己選鄉鎮。',
      err.code === 1 ? 'Location is not allowed. Allow it in phone settings, or choose the township.' : 'Location not available now — please choose the township.');
  }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
}

/* ---------- events (run before app.js follows the link) ---------- */
document.addEventListener('click', (e) => {
  const t = e.target;
  const c = t.closest('[data-consent]');
  if (c) { answerConsent(c.dataset.consent === 'all'); return; }
  const aid = t.closest('[data-aid]');
  if (aid) booking = { step: 'idle', svc: 'rent', item: aid.dataset.aid };

  const el = t.closest('[data-live]');
  if (!el || el.disabled) return;
  const act = el.dataset.live;
  const again = () => renderBook(booking.svc);
  if (act === 'start') booking = { step: 'idle', svc: null }; // start fresh each time
  else if (act === 'privacy') showConsent();
  else if (act === 'locate') locate();
  else if (act === 'addrNext') {
    booking.address = document.getElementById('bk-addr').value.trim();
    const err = document.getElementById('bk-err');
    const fail = (zh, en) => { err.hidden = false; err.innerHTML = B(zh, en); err.scrollIntoView({ block: 'center' }); };
    if (!booking.town) return fail('請選擇鄉鎮。', 'Please choose your township.');
    if (booking.address.length < 3) return fail('請填寫地址（路名和門牌號碼）。', 'Please type your address (street and number).');
    store.set('myAddr', { town: booking.town, address: booking.address });
    booking.step = 'schedule';
    again(); window.scrollTo(0, 0);
  } else if (act === 'editAddr') { booking.step = 'address'; again(); window.scrollTo(0, 0); }
  else if (act === 'day') { booking.date = el.dataset.k; booking.slot = null; const y = window.scrollY; again(); window.scrollTo(0, y); }
  else if (act === 'slot') {
    booking.slot = el.dataset.k;
    const y = window.scrollY; again(); window.scrollTo(0, y);
    const card = document.querySelector('.live-card');
    if (card) card.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'nearest' });
    const s = SERVICES[booking.svc], slot = s.slots.find((x) => x[0] === booking.slot);
    say(`${periodOf(slot[0]).zh} ${slot[0]} 到 ${slot[1]}`);
  } else if (act === 'agree') {
    const on = el.getAttribute('aria-pressed') !== 'true';
    el.setAttribute('aria-pressed', String(on));
    document.querySelector('[data-live="confirm"]').disabled = !on;
    document.getElementById('live-hint').hidden = on;
    say(on ? '已同意' : '已取消同意');
  } else if (act === 'confirm') confirmBooking(el);
});

// Township field on the address step opens the 3D township picker.
document.addEventListener('click', (e) => {
  if (!e.target.closest('[data-w="bktown"]')) return;
  openTownSheet('鄉鎮 · Township', booking.town, (v) => {
    if (v === booking.town) return;
    booking.town = v; booking.lat = booking.lng = null;
    showTown();
    document.getElementById('bk-err').hidden = true;
    if (bookMap) bookMap.setTown(v);
  });
});
document.addEventListener('input', (e) => {
  if (e.target.id !== 'bk-addr') return;
  booking.address = e.target.value;
  // The typed address is what volunteers navigate to; drop any located point.
  booking.lat = booking.lng = null;
  if (bookMap) bookMap.setAddress(booking.address);
});

// First visit: ask once (after the rest of the app has loaded).
window.addEventListener('load', () => setTimeout(() => { if (!getConsent().asked) showConsent(); }, 600));
