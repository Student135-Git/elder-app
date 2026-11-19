'use strict';

/* =========================================================
   住 Live / Reside — the elder's four buttons:
     1 打掃      2 租輔具 (pick one of five devices)
     3 陪伴散步  4 煮菜
   All four book the same way: the elder picks the township and
   types the address (a Google map shows it), then gets a visit
   tomorrow at that service's time; 同意 unlocks 確認.
   No live location (GPS): it often pointed to the wrong place.
   A confirmed booking is saved as a normal volunteer request, so volunteers in that township see it.
   Uses helpers from volunteer.js and the map data.
   ========================================================= */

const GUEST_NAME = '長輩'; // owner of bookings made without signing in

// One entry per bookable service. `type` is the volunteer job type; times are for tomorrow.
const SERVICES = {
  clean: { icon: '🧹', zh: '打掃', en: 'Cleaning', type: 'clean', start: '14:00', hours: 2, timeZh: '下午 2 點到 4 點', timeEn: '2 pm to 4 pm', timeSay: '下午兩點到四點' },
  walk: { icon: '🚶', zh: '陪伴散步', en: 'A walk together', type: 'walk', start: '09:00', hours: 1, timeZh: '上午 9 點到 10 點', timeEn: '9 am to 10 am', timeSay: '上午九點到十點' },
  cook: { icon: '🍳', zh: '煮菜', en: 'Cooking', type: 'cook', start: '10:00', hours: 2, timeZh: '上午 10 點到中午 12 點', timeEn: '10 am to 12 noon', timeSay: '上午十點到中午十二點' },
  rent: { icon: '🦯', zh: '租輔具', en: 'Device rental', type: 'aid', start: '10:00', hours: 1, timeZh: '上午 10 點到 11 點', timeEn: '10 am to 11 am', timeSay: '上午十點到十一點' },
};

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

/* ---------- 住 page ---------- */
const getBookings = () => { const b = store.get('bookings', []); return Array.isArray(b) ? b : []; };

function renderLive() {
  vinit(); purgeExpired();
  setHeader('居家', true, 'cat', 'home');
  app.className = '';
  const row = (icon, zh, en, href, extra = '') => `
    <li><a class="action" href="${href}" data-say="${zh}" ${extra}>
      <span class="action-icon" aria-hidden="true">${icon}</span>
      <span class="action-text"><span>${zh}</span><span class="en" lang="en">${en}</span></span>
    </a></li>`;
  const book = (k) => row(SERVICES[k].icon, SERVICES[k].zh, SERVICES[k].en, `#home-${k}`, 'data-live="start"');
  const ids = getBookings();
  const booked = getJobs().filter((j) => ids.includes(j.id)).sort((a, b) => b.posted - a.posted);
  app.innerHTML = `
    ${pageHead('住', '居家', 'Live / Reside')}
    <ul class="actions live-main">
      ${book('clean')}
      ${row(AID_ITEMS[0].svg, '租輔具', 'Rent assistive devices', '#home-aids')}
      ${book('walk')}
      ${book('cook')}
    </ul>
    ${booked.length ? `<div class="vwrap live-booked"><h2 class="vh">${B('我的預約', 'My bookings')}</h2>${booked.map(giveCard).join('')}</div>` : ''}
    <ul class="actions live-more">
      ${row('📋', '我的志工需求', 'My volunteer requests', '#give')}
      ${row('🪷', '我想當志工', 'I want to volunteer', '#vol')}
    </ul>`;
  titleEl.focus({ preventScroll: true });
}

/* ---------- booking: address → schedule → 同意 → 確認 ---------- */
let booking = { step: 'idle', svc: null };
let bookMap = null; // Google map under the address box

function bookDay() {
  const t = Date.now() + DAY_MS; // the day after today
  const f = (loc) => new Intl.DateTimeFormat(loc, { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date(t));
  return { ymd: ymd(t), zh: f('zh-TW'), en: f('en-US') };
}

// The last address typed is offered again next time.
const getMyAddr = () => { const a = store.get('myAddr', null); return a && typeof a === 'object' ? a : { town: '', address: '' }; };

function addressForm(head) {
  app.innerHTML = `${head}
    <div class="vwrap">
      <p class="vnote big">${B('請選鄉鎮，再打您家的地址。下面的地圖會顯示這個地址，請確認位置對不對。', 'Choose your township, then type your home address. The map below shows it — please check it is right.')}</p>
      <section class="vcard">
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

function renderBook(kind) {
  vinit();
  const s = SERVICES[kind];
  if (booking.svc !== kind) booking = { step: 'idle', svc: kind };
  const item = kind === 'rent' ? AID_ITEMS.find((a) => a.id === booking.item) : null;
  if (kind === 'rent' && !item) { // opened without choosing a device
    history.replaceState(history.state, '', '#home-aids');
    renderAids();
    return;
  }
  setHeader(s.zh, true, 'give', 'tc');
  app.className = '';
  const day0 = bookDay();
  // Already booked this for tomorrow? Show that instead of booking it twice.
  const dup = booking.step === 'idle' && getJobs().find((j) => getBookings().includes(j.id) && j.types[0] === s.type && j.date === day0.ymd && (!item || j.desc.includes(item.zh)));
  if (dup) {
    app.innerHTML = `${item ? pageHead(item.svg, item.zh, item.en) : pageHead(s.icon, s.zh, s.en)}
      <div class="vwrap">
        <section class="vcard live-card">
          <p class="live-big">您已經預約了：<br>${day0.zh}，${s.timeZh}</p>
          <p class="live-en" lang="en">You have already booked this: ${day0.en}, ${s.timeEn}.</p>
          <p class="vnote big">要取消，請到「居家」的「我的預約」。<br><span lang="en">To cancel, go to My bookings under Live / Reside.</span></p>
        </section>
        <a class="btn-primary" href="#home">${B('回到居家', 'Back to Live / Reside')}</a>
      </div>`;
    return;
  }
  if (booking.step === 'idle') { const a = getMyAddr(); booking = { ...booking, step: 'address', town: a.town, address: a.address, lat: null, lng: null }; }
  const head = item ? pageHead(item.svg, item.zh, item.en) : pageHead(s.icon, s.zh, s.en);
  const day = bookDay();
  if (booking.step === 'address') { addressForm(head); return; }

  if (booking.step === 'done') {
    app.innerHTML = `
      <div class="vwrap done">
        <div class="bloom" aria-hidden="true">${LOTUS}</div>
        <h2 class="done-title">${item ? B(`已預約租借${item.zh}！`, `${item.en} rental booked!`) : B(`已預約${s.zh}！`, `${s.en} booked!`)}</h2>
        <section class="vcard live-card">
          <p class="live-big">${day.zh}<br>${s.timeZh}</p>
          <p class="live-en" lang="en">${day.en}, ${s.timeEn}</p>
          <p class="vnote big">📍 花蓮縣${booking.town} ${dEsc(booking.address)} <span lang="en">${cityLabel(booking.town, 'en')}</span></p>
        </section>
        ${shareNote()}
        <a class="btn-primary" href="#home">${B('回到居家', 'Back to Live / Reside')}</a>
      </div>`;
    return;
  }

  // schedule
  const zh = item
    ? `志工會在 <strong>${day.zh}</strong>，<strong>${s.timeZh}</strong>，把「${item.zh}」送到您家。`
    : `${s.zh}將安排在 <strong>${day.zh}</strong>，<strong>${s.timeZh}</strong>。`;
  const en = item
    ? `A volunteer will bring the ${item.en.toLowerCase()} to your home on <strong>${day.en}</strong>, from <strong>${s.timeEn}</strong>.`
    : `${s.en} will be scheduled for <strong>${day.en}</strong>, from <strong>${s.timeEn}</strong>.`;
  app.innerHTML = `${head}
    <div class="vwrap">
      <section class="vcard live-card">
        <p class="live-big">${zh}<br>請在這個時間準備好迎接我們的志工。</p>
        <p class="live-en" lang="en">${en} Please be ready to welcome our volunteer at that time.</p>
        <p class="vnote big">📍 花蓮縣${booking.town} ${dEsc(booking.address)} <span lang="en">${cityLabel(booking.town, 'en')}</span></p>
        <button type="button" class="btn-ghost sm" data-live="editAddr">${B('修改地址', 'Change the address')}</button>
      </section>
      <button type="button" class="opt live-agree" data-live="agree" aria-pressed="false"><span class="live-box" aria-hidden="true"></span>${B('同意', 'I agree')}</button>
      <button type="button" class="btn-primary live-confirm" data-live="confirm" disabled>${B('確認', 'Confirm')}</button>
      <p class="vnote" id="live-hint">${B('先按「同意」，才能按「確認」。', 'Tap “I agree” first, then Confirm.')}</p>
    </div>`;
  say(item
    ? `志工會在${day.zh}，${s.timeSay}，把${item.zh}送到您家。請在這個時間準備好迎接我們的志工。`
    : `${s.zh}將安排在${day.zh}，${s.timeSay}。請在這個時間準備好迎接我們的志工。`);
}

let bookSaving = false;
async function confirmBooking(btn) {
  if (bookSaving || btn.disabled || booking.step !== 'schedule') return;
  bookSaving = true;
  const kind = booking.svc;
  const s = SERVICES[kind];
  const item = AID_ITEMS.find((a) => a.id === booking.item);
  const now = Date.now();
  const day = bookDay();
  const job = {
    id: String(now), types: [s.type], desc: item ? `租借：${item.zh} Rental: ${item.en}` : '', city: booking.town,
    address: booking.address, lat: booking.lat ?? null, lng: booking.lng ?? null,
    hours: s.hours, start: s.start, people: 1, date: day.ymd,
    posted: now, expires: dateEnd(day.ymd), taken: [], owner: sessionName() || GUEST_NAME,
  };
  const ok = await pushJob(job); // shares it through KindWorld when connected
  bookSaving = false;
  if (!ok) return;
  saveJobs([job, ...getJobs()]);
  store.set('bookings', [job.id, ...getBookings()].slice(0, 20));
  booking = { ...booking, step: 'done' };
  renderBook(kind);
  window.scrollTo(0, 0);
  say('已預約');
}

/* ---------- 2 租輔具: choose a device, then book it ---------- */
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

/* ---------- events (run before app.js follows the link) ---------- */
document.addEventListener('click', (e) => {
  const t = e.target;
  // Open the request form with that help already chosen.
  const preset = t.closest('[data-preset]');
  if (preset) draft.types = [preset.dataset.preset];
  // A device was chosen: start a fresh rental booking for it.
  const aid = t.closest('[data-aid]');
  if (aid) booking = { step: 'idle', svc: 'rent', item: aid.dataset.aid };

  const el = t.closest('[data-live]');
  if (!el) return;
  const act = el.dataset.live;
  if (act === 'start') booking = { step: 'idle', svc: null }; // start fresh each time
  else if (act === 'addrNext') {
    booking.address = document.getElementById('bk-addr').value.trim();
    const err = document.getElementById('bk-err');
    const fail = (zh, en) => { err.hidden = false; err.innerHTML = B(zh, en); err.scrollIntoView({ block: 'center' }); };
    if (!booking.town) return fail('請選擇鄉鎮。', 'Please choose your township.');
    if (booking.address.length < 3) return fail('請填寫地址（路名和門牌號碼）。', 'Please type your address (street and number).');
    store.set('myAddr', { town: booking.town, address: booking.address });
    booking.step = 'schedule';
    renderBook(booking.svc); window.scrollTo(0, 0);
  } else if (act === 'editAddr') { booking.step = 'address'; renderBook(booking.svc); window.scrollTo(0, 0); }
  else if (act === 'agree') {
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
  booking.address = e.target.value; booking.lat = booking.lng = null;
  if (bookMap) bookMap.setAddress(booking.address);
});
