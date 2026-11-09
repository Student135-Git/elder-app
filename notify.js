'use strict';

/* =========================================================
   Tell the family about a purchase (日用品 → 購物車).
   - 家人聯絡方式: the elder (or a family member) saves names,
     WhatsApp numbers and email addresses once, on this phone.
   - 確認購買: saves the order, empties the cart, and opens a
     page with one big button per family member and channel.
     Each button opens WhatsApp / LINE / email with the message
     already written — the elder only taps Send.
   No payment happens here. Sending without that last tap would
   need business accounts and a server; see README.
   ========================================================= */

const MAX_FAMILY = 4;
let viewOrderId = null; // which order the 通知家人 page shows

const getFamily = () => {
  const f = store.get('family', null);
  return f && Array.isArray(f.people) ? f : { me: '', people: [] };
};
const getOrders = () => { const o = store.get('orders', []); return Array.isArray(o) ? o : []; };
const saveOrders = (o) => store.set('orders', o.slice(0, 20));
const escN = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// 0912345678 / +886 912-345-678 / 886912345678 → 886912345678 (what wa.me needs)
function waNumber(raw) {
  const d = String(raw || '').replace(/[^\d]/g, '');
  if (/^09\d{8}$/.test(d)) return '886' + d.slice(1);
  if (/^8869\d{8}$/.test(d)) return d;
  if (/^\d{8,15}$/.test(d) && !d.startsWith('0')) return d; // other countries, already with country code
  return '';
}
const okEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '').trim());

function fmtWhen(ts) {
  try {
    return new Intl.DateTimeFormat('zh-TW', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(ts));
  } catch { return new Date(ts).toLocaleString(); }
}

function orderText(o) {
  const who = getFamily().me.trim() || '家人';
  return [
    `【生活助手】${who} 剛買了日用品`,
    `${who} just bought some daily supplies`,
    '',
    ...o.items.map((i) => `• ${i.zh} ${i.en} × ${i.qty}　NT$ ${i.price * i.qty}`),
    '',
    `合計 Total: NT$ ${o.total}`,
    `時間 Time: ${fmtWhen(o.at)}`,
  ].join('\n');
}
const orderSubject = (o) => `【生活助手】${getFamily().me.trim() || '家人'} 買了日用品 NT$ ${o.total}`;

/* ---------- confirm purchase ---------- */
let buyTimer;
function confirmPurchase(btn) {
  const items = cartItems();
  if (!items.length) return;
  // Two taps, like 清空購物車: the first asks, the second buys.
  if (!btn.classList.contains('armed')) {
    btn.classList.add('armed');
    btn.querySelector('.action-text').innerHTML = '<span>再按一次，確定購買</span><span class="en" lang="en">Tap again to confirm</span>';
    say('再按一次，確定購買');
    clearTimeout(buyTimer);
    buyTimer = setTimeout(() => { if (currentView() === 'cart') renderCart(); }, 4000);
    return;
  }
  clearTimeout(buyTimer);
  const { total } = cartSummary();
  const order = {
    id: String(Date.now()), at: Date.now(), total, notified: {},
    items: items.map(({ p, qty }) => ({ id: p.id, icon: p.icon, zh: p.zh, en: p.en, price: p.price, qty })),
  };
  saveOrders([order, ...getOrders()]);
  cart = {};
  store.set('cart', cart);
  viewOrderId = order.id;
  say('已購買，請通知家人');
  go('#order');
}

/* ---------- 通知家人 page ---------- */
function notifyLinks(o) {
  const text = orderText(o);
  const enc = encodeURIComponent(text);
  const fam = getFamily();
  const sent = o.notified || {};
  const btn = (key, href, cls, icon, zh, en, newTab = true) => `
    <a class="action notify ${cls}${sent[key] ? ' done' : ''}" href="${href}" data-notified="${escN(key)}"${newTab ? ' target="_blank" rel="noopener"' : ''} data-say="${zh}">
      <span class="action-icon" aria-hidden="true">${icon}</span>
      <span class="action-text"><span>${zh}</span><span class="en" lang="en">${en}</span>${sent[key] ? '<span class="sent-tag">✓ 已開啟 Opened</span>' : ''}</span>
    </a>`;

  const people = fam.people.map((p, i) => {
    const wa = waNumber(p.phone);
    const mail = okEmail(p.email) ? p.email.trim() : '';
    if (!wa && !mail) return '';
    return `
      <li class="fam-card">
        <p class="fam-name">${escN(p.name || `家人 ${i + 1}`)}</p>
        ${wa ? btn(`wa-${i}`, `https://wa.me/${wa}?text=${enc}`, 'wa', '💬', '用 WhatsApp 傳', 'Send on WhatsApp') : ''}
        ${mail ? btn(`mail-${i}`, `mailto:${mail}?subject=${encodeURIComponent(orderSubject(o))}&body=${enc}`, 'mail', '✉️', '寄 Email', 'Send an email', false) : ''}
      </li>`;
  }).join('');

  return `
    ${people ? `<ul class="fam-list">${people}</ul>` : `
      <p class="note-box">還沒有家人的 WhatsApp 或 Email。可以先用 LINE，或去設定。<br><span lang="en">No family WhatsApp or email saved yet — use LINE, or set them up.</span></p>`}
    <div class="cart-actions">
      ${btn('line', `https://line.me/R/share?text=${enc}`, 'line', '🟢', '用 LINE 傳（選擇家人）', 'Send on LINE (choose who)')}
      <button type="button" class="action" data-copyorder>
        <span class="action-icon" aria-hidden="true">📋</span>
        <span class="action-text"><span>複製訊息</span><span class="en" lang="en">Copy the message</span></span>
      </button>
      <a class="action" href="#family" data-say="家人聯絡方式">
        <span class="action-icon" aria-hidden="true">👨‍👩‍👧</span>
        <span class="action-text"><span>家人聯絡方式</span><span class="en" lang="en">Family contacts</span></span>
      </a>
    </div>`;
}

function renderOrder() {
  setHeader('通知家人', true, 'order', 'cart');
  app.className = '';
  const orders = getOrders();
  const o = orders.find((x) => x.id === viewOrderId) || orders[0];
  if (!o) { renderCart(); return; }
  viewOrderId = o.id;
  app.innerHTML = `
    ${pageHead('✓', '已購買', 'Purchase saved')}
    <section class="order-sum">
      <ul class="order-items">
        ${o.items.map((i) => `<li><span aria-hidden="true">${i.icon}</span><span>${i.zh} <span class="en" lang="en">${i.en}</span></span><span>× ${i.qty}</span></li>`).join('')}
      </ul>
      <p class="cart-total"><span>合計 <span class="en" lang="en">Total</span></span><span>NT$ ${o.total}</span></p>
      <p class="note order-when">${fmtWhen(o.at)}</p>
    </section>
    <h2 class="order-h">通知家人 <span class="en" lang="en">Tell your family</span></h2>
    <p class="note">按一下，訊息已經寫好，再按「傳送」就好。<br><span lang="en">Tap one — the message is ready, just press Send.</span></p>
    ${notifyLinks(o)}
    <details class="order-preview"><summary>看訊息內容 <span class="en" lang="en">See the message</span></summary><pre>${escN(orderText(o))}</pre></details>
    <a class="action primary order-back" href="#shop" data-say="繼續購物">
      <span class="action-icon" aria-hidden="true">🛍️</span>
      <span class="action-text"><span>繼續購物</span><span class="en" lang="en">Keep shopping</span></span>
    </a>
    <p class="note">這裡不會付款。<br><span lang="en">Nothing is paid here.</span></p>`;
}

// Recent purchases, shown when the cart is empty, so a forgotten message can still be sent.
function recentOrdersHTML() {
  const orders = getOrders().slice(0, 3);
  if (!orders.length) return '';
  return `
    <h2 class="order-h">最近的購買 <span class="en" lang="en">Recent purchases</span></h2>
    <ul class="recent-orders">
      ${orders.map((o) => `
        <li>
          <button type="button" class="action" data-openorder="${o.id}">
            <span class="action-icon" aria-hidden="true">🧾</span>
            <span class="action-text"><span>${fmtWhen(o.at)} · NT$ ${o.total}</span><span class="en" lang="en">${o.items.length} 項 items · 再通知家人 Notify again</span></span>
          </button>
        </li>`).join('')}
    </ul>`;
}

async function copyOrder() {
  const o = getOrders().find((x) => x.id === viewOrderId);
  if (!o) return;
  try {
    await navigator.clipboard.writeText(orderText(o));
    showToast('訊息已複製，可以貼上傳送\nMessage copied');
  } catch {
    showToast('無法複製\nCould not copy');
  }
}

function markNotified(key) {
  const orders = getOrders();
  const o = orders.find((x) => x.id === viewOrderId);
  if (!o) return;
  o.notified = { ...(o.notified || {}), [key]: Date.now() };
  saveOrders(orders);
  // Redraw after the app/browser has opened, so the ✓ is there when they come back.
  setTimeout(() => { if (currentView() === 'order') renderOrder(); }, 400);
}

/* ---------- 家人聯絡方式 ---------- */
let familyDraft = null;

function personFields(p, i) {
  return `
    <section class="vcard fam-edit" data-i="${i}">
      <div class="vrow"><p class="flabel">家人 ${i + 1} <span class="en" lang="en">Family member ${i + 1}</span></p>
        <button type="button" class="btn-ghost sm danger" data-famremove="${i}">刪除 Remove</button></div>
      <label class="flabel gap" for="fam-name-${i}">名字 <span class="en" lang="en">Name</span></label>
      <input class="in" id="fam-name-${i}" data-f="name" maxlength="20" value="${escN(p.name)}" placeholder="例：女兒 小美 · e.g. Daughter">
      <label class="flabel gap" for="fam-phone-${i}">WhatsApp 手機號碼 <span class="en" lang="en">WhatsApp phone number</span></label>
      <input class="in" id="fam-phone-${i}" data-f="phone" type="tel" inputmode="tel" autocomplete="off" maxlength="20" value="${escN(p.phone)}" placeholder="0912 345 678">
      <label class="flabel gap" for="fam-email-${i}">Email</label>
      <input class="in" id="fam-email-${i}" data-f="email" type="email" inputmode="email" autocomplete="off" maxlength="80" value="${escN(p.email)}" placeholder="name@example.com">
    </section>`;
}

function readFamilyForm() {
  if (!familyDraft) return;
  const me = document.getElementById('fam-me');
  if (me) familyDraft.me = me.value;
  document.querySelectorAll('.fam-edit').forEach((sec) => {
    const p = familyDraft.people[Number(sec.dataset.i)];
    if (!p) return;
    sec.querySelectorAll('[data-f]').forEach((inp) => { p[inp.dataset.f] = inp.value; });
  });
}

function renderFamily() {
  setHeader('家人聯絡方式', true, 'family', 'cart');
  app.className = '';
  if (!familyDraft) {
    const f = getFamily();
    familyDraft = { me: f.me, people: f.people.length ? f.people.map((p) => ({ ...p })) : [{ name: '', phone: '', email: '' }] };
  }
  const d = familyDraft;
  app.innerHTML = `
    ${pageHead('👨‍👩‍👧', '家人聯絡方式', 'Family contacts')}
    <div class="vwrap">
      <p class="note-box">買東西以後，會用這些方式通知家人。只存在這支手機上。<br><span lang="en">Used to tell your family after a purchase. Saved on this phone only.</span></p>
      <section class="vcard">
        <label class="flabel" for="fam-me">你的名字（家人看到的） <span class="en" lang="en">Your name (what family sees)</span></label>
        <input class="in" id="fam-me" maxlength="20" value="${escN(d.me)}" placeholder="例：媽媽 · e.g. Mom">
      </section>
      ${d.people.map(personFields).join('')}
      ${d.people.length < MAX_FAMILY ? `<button type="button" class="btn-ghost" data-famadd>＋ 新增家人 <span class="en" lang="en">Add family member</span></button>` : ''}
      <p class="note">LINE 不用填：通知時會打開 LINE，讓你選要傳給誰。<br><span lang="en">No need to enter LINE — it opens LINE and you choose who to send to.</span></p>
      <p class="ferr" id="fam-err" role="alert" hidden></p>
      <button type="button" class="btn-primary" data-famsave data-say="儲存">${B('儲存', 'Save')}</button>
    </div>`;
}

function saveFamily() {
  readFamilyForm();
  const d = familyDraft;
  const err = document.getElementById('fam-err');
  const people = d.people
    .map((p) => ({ name: p.name.trim(), phone: p.phone.trim(), email: p.email.trim() }))
    .filter((p) => p.name || p.phone || p.email);
  for (const [i, p] of people.entries()) {
    const label = p.name || `家人 ${i + 1}`;
    let msg = '';
    if (p.phone && !waNumber(p.phone)) msg = `${label}：手機號碼看起來不對，例如 0912 345 678。<br><span lang="en">${escN(label)}: that phone number doesn’t look right, e.g. 0912 345 678.</span>`;
    else if (p.email && !okEmail(p.email)) msg = `${label}：Email 看起來不對。<br><span lang="en">${escN(label)}: that email doesn’t look right.</span>`;
    else if (!p.phone && !p.email) msg = `${label}：請填 WhatsApp 號碼或 Email。<br><span lang="en">${escN(label)}: add a WhatsApp number or an email.</span>`;
    if (msg) { err.hidden = false; err.innerHTML = msg; err.scrollIntoView({ block: 'center' }); return; }
  }
  store.set('family', { me: d.me.trim(), people });
  familyDraft = null;
  showToast('已儲存\nSaved');
  say('已儲存');
  // Back to where they came from (the purchase page or the cart).
  backBtn.click();
}

/* ---------- events ---------- */
document.addEventListener('click', (e) => {
  const t = e.target;
  const buy = t.closest('[data-buy]');
  if (buy) { confirmPurchase(buy); return; }
  const n = t.closest('[data-notified]');
  if (n) { markNotified(n.dataset.notified); return; } // the link itself opens the app
  if (t.closest('[data-copyorder]')) { copyOrder(); return; }
  const open = t.closest('[data-openorder]');
  if (open) { viewOrderId = open.dataset.openorder; go('#order'); return; }
  if (t.closest('[data-famadd]')) {
    readFamilyForm();
    if (familyDraft.people.length < MAX_FAMILY) familyDraft.people.push({ name: '', phone: '', email: '' });
    renderFamily();
    const last = document.querySelectorAll('.fam-edit');
    const sec = last[last.length - 1];
    if (sec) { sec.scrollIntoView({ block: 'center' }); sec.querySelector('input').focus({ preventScroll: true }); }
    return;
  }
  const rm = t.closest('[data-famremove]');
  if (rm) {
    readFamilyForm();
    familyDraft.people.splice(Number(rm.dataset.famremove), 1);
    if (!familyDraft.people.length) familyDraft.people.push({ name: '', phone: '', email: '' });
    renderFamily();
    return;
  }
  if (t.closest('[data-famsave]')) saveFamily();
});
