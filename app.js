'use strict';

/* =========================================================
   CONTENT — edit these lists to change the app.
   - Items with `href` open a link (tel: for phone, maps, etc.)
   - Items without `href` show "Coming soon" for now.
   ========================================================= */
const maps = (q) => 'https://www.google.com/maps/search/' + encodeURIComponent(q);

const CATEGORIES = [
  {
    id: 'medicine', char: '藥', zh: '醫藥', en: 'Medicine',
    items: [
      { icon: '⏰', zh: '吃藥提醒', en: 'Medication reminder' },
      { icon: '🏥', zh: '看診預約', en: 'Doctor appointment' },
      { icon: '💊', zh: '附近藥局', en: 'Nearby pharmacy', href: maps('藥局') },
      { icon: '🚑', zh: '緊急求救 119', en: 'Emergency call', href: 'tel:119', danger: true },
    ],
  },
  {
    id: 'food', char: '食', zh: '飲食', en: 'Food',
    items: [
      { icon: '🍱', zh: '今日菜單', en: "Today's meals" },
      { icon: '🍜', zh: '附近餐廳', en: 'Nearby restaurants', href: maps('餐廳') },
      { icon: '💧', zh: '喝水提醒', en: 'Drink-water reminder' },
    ],
  },
  {
    id: 'transport', char: '行', zh: '交通', en: 'Transportation',
    items: [
      { icon: '🚕', zh: '叫計程車', en: 'Call a taxi' },
      { icon: '🚌', zh: '附近公車站', en: 'Nearby bus stops', href: maps('公車站') },
      { icon: '🏠', zh: '帶我回家', en: 'Take me home' },
    ],
  },
  {
    id: 'body', char: '育', zh: '健身與學習', en: 'Body / Education',
    items: [
      { icon: '🤸', zh: '每日伸展', en: 'Daily stretching' },
      { icon: '🚶', zh: '散步紀錄', en: 'Walking log' },
      { icon: '📚', zh: '健康知識', en: 'Health tips' },
    ],
  },
  {
    id: 'fun', char: '樂', zh: '娛樂', en: 'Entertainment',
    items: [
      { icon: '🎵', zh: '聽音樂', en: 'Music' },
      { icon: '📺', zh: '看影片', en: 'Videos' },
      { icon: '🧩', zh: '動腦遊戲', en: 'Brain games' },
    ],
  },
  {
    id: 'home', char: '住', zh: '居家', en: 'Live / Reside',
    items: [
      { icon: '🤝', zh: '我需要志工', en: 'I need a volunteer', href: '#give' },
      { icon: '🪷', zh: '我想當志工', en: 'I want to volunteer', href: '#vol' },
    ],
  },
  // The shop has its own screen (no `items`). It shows as a wide tile at the bottom.
  { id: 'shop', char: '用', zh: '日用品', en: 'Daily Supplies' },
];

/* ----- Shop: tabs and products -----
   `essential: true` also puts a product in the 常用 / Essentials tab.
   `keywords` are extra words that search will match.
   ⚠ Prices are SAMPLE numbers for testing — replace with real ones. */
const SHOP_TABS = [
  { id: 'medicine', icon: '💊', zh: '藥品', en: 'Medicine' },
  { id: 'bathroom', icon: '🛁', zh: '衛浴', en: 'Bathroom' },
  { id: 'kitchen', icon: '🍳', zh: '廚房', en: 'Kitchen' },
  { id: 'living', icon: '🛋️', zh: '客廳', en: 'Living Room' },
  { id: 'essentials', icon: '⭐', zh: '常用', en: 'Essentials' },
];

const PRODUCTS = [
  { id: 'mask', tab: 'medicine', icon: '😷', zh: '口罩', en: 'Face masks', price: 120, essential: true },
  { id: 'bandage', tab: 'medicine', icon: '🩹', zh: 'OK繃', en: 'Bandages', price: 60, keywords: '繃帶 bandaid' },
  { id: 'thermometer', tab: 'medicine', icon: '🌡️', zh: '體溫計', en: 'Thermometer', price: 350, keywords: '溫度計 發燒' },
  { id: 'pillbox', tab: 'medicine', icon: '💊', zh: '藥盒', en: 'Pill organizer', price: 80 },

  { id: 'toiletpaper', tab: 'bathroom', icon: '🧻', zh: '衛生紙', en: 'Toilet paper', price: 199, essential: true, keywords: '廁所 tissue toilet' },
  { id: 'shampoo', tab: 'bathroom', icon: '🧴', zh: '洗髮精', en: 'Shampoo', price: 150, keywords: '洗頭' },
  { id: 'toothpaste', tab: 'bathroom', icon: '🪥', zh: '牙膏', en: 'Toothpaste', price: 89, essential: true, keywords: '牙刷 刷牙' },
  { id: 'towel', tab: 'bathroom', icon: '🛁', zh: '毛巾', en: 'Towel', price: 120 },
  { id: 'soap', tab: 'bathroom', icon: '🧼', zh: '沐浴乳', en: 'Body wash', price: 129, keywords: '肥皂 洗澡 soap' },

  { id: 'dishsoap', tab: 'kitchen', icon: '🧽', zh: '洗碗精', en: 'Dish soap', price: 79, keywords: '洗碗' },
  { id: 'trashbags', tab: 'kitchen', icon: '🗑️', zh: '垃圾袋', en: 'Trash bags', price: 99, essential: true, keywords: '垃圾' },
  { id: 'rice', tab: 'kitchen', icon: '🍚', zh: '白米', en: 'Rice', price: 280, essential: true, keywords: '米' },
  { id: 'salt', tab: 'kitchen', icon: '🧂', zh: '鹽', en: 'Salt', price: 25 },

  { id: 'tissues', tab: 'living', icon: '🤧', zh: '面紙', en: 'Facial tissues', price: 159, keywords: '衛生紙 tissue' },
  { id: 'batteries', tab: 'living', icon: '🔋', zh: '電池', en: 'Batteries', price: 120 },
  { id: 'bulb', tab: 'living', icon: '💡', zh: '燈泡', en: 'Light bulb', price: 90, keywords: '電燈' },
  { id: 'repellent', tab: 'living', icon: '🦟', zh: '防蚊液', en: 'Insect repellent', price: 180, keywords: '蚊子 mosquito' },
];

// One colour per section (white text passes contrast on all of them).
const COLORS = {
  medicine: '#0F766E', food: '#C2410C', transport: '#1F5FBF',
  body: '#6B46C1', tc: '#1D6FB8', fun: '#BE185D', home: '#8A5A2B',
  shop: '#1E293B', cart: '#1E293B',
};

const HOME_TITLE = '生活助手';
const SIZES = ['112.5%', '135%', '160%']; // normal, large, extra large

/* ===== Settings and cart (saved on this phone only) ===== */
const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  },
};

const settings = {
  size: Math.min(Number(store.get('size', 0)) || 0, SIZES.length - 1),
  voice: store.get('voice', true),
};

let cart = store.get('cart', {});
if (!cart || typeof cart !== 'object' || Array.isArray(cart)) cart = {};
let shopTab = store.get('shopTab', 'bathroom');
if (!SHOP_TABS.some((t) => t.id === shopTab)) shopTab = 'bathroom';
let shopQuery = '';

/* ===== Elements ===== */
const app = document.getElementById('app');
const titleEl = document.getElementById('title');
const backBtn = document.getElementById('backBtn');
const sizeBtn = document.getElementById('sizeBtn');
const voiceBtn = document.getElementById('voiceBtn');
const toastEl = document.getElementById('toast');
const canSpeak = 'speechSynthesis' in window;
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

/* ===== Text size ===== */
function applySize() {
  document.documentElement.style.fontSize = SIZES[settings.size];
  const atMax = settings.size === SIZES.length - 1;
  sizeBtn.textContent = atMax ? 'A−' : 'A+';
  sizeBtn.setAttribute('aria-label', atMax ? '字體恢復 Reset text size' : '放大字體 Larger text');
}

sizeBtn.addEventListener('click', () => {
  settings.size = (settings.size + 1) % SIZES.length;
  store.set('size', settings.size);
  applySize();
});

/* ===== Read-aloud (Mandarin, Taiwan) ===== */
function applyVoice() {
  voiceBtn.hidden = !canSpeak;
  voiceBtn.textContent = settings.voice ? '🔊' : '🔇';
  voiceBtn.setAttribute('aria-pressed', String(settings.voice));
  voiceBtn.setAttribute('aria-label', settings.voice ? '語音開啟 Voice on' : '語音關閉 Voice off');
}

function say(text) {
  if (!canSpeak || !settings.voice) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-TW';
  u.rate = 0.85; // a little slower than default
  speechSynthesis.speak(u);
}

voiceBtn.addEventListener('click', () => {
  settings.voice = !settings.voice;
  store.set('voice', settings.voice);
  applyVoice();
  if (settings.voice) say('語音開啟');
  else if (canSpeak) speechSynthesis.cancel();
});

/* ===== Toast ===== */
let toastTimer;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

/* ===== Shared helpers ===== */
function setHeader(title, showBack, view, colorId) {
  document.title = title === HOME_TITLE ? HOME_TITLE : `${title} · ${HOME_TITLE}`;
  titleEl.textContent = title;
  backBtn.hidden = !showBack;
  document.body.dataset.view = view;
  delete titleEl.dataset.say;
  document.body.style.setProperty('--c', COLORS[colorId] || COLORS.shop);
}

function pageHead(mark, zh, en) {
  return `<header class="page-head">
    <span class="head-mark" aria-hidden="true">${mark}</span>
    <div aria-hidden="true"><p class="head-zh">${zh}</p><p class="head-en" lang="en">${en}</p></div>
  </header>`;
}

const findProduct = (id) => PRODUCTS.find((p) => p.id === id);

function cartItems() {
  return Object.entries(cart)
    .map(([id, qty]) => ({ p: findProduct(id), qty }))
    .filter((x) => x.p && x.qty > 0);
}

function cartSummary() {
  return cartItems().reduce((s, { p, qty }) => ({
    count: s.count + qty,
    total: s.total + qty * p.price,
  }), { count: 0, total: 0 });
}

/* ===== Home ===== */
let introDone = false;

function greeting() {
  const h = new Date().getHours();
  return h < 5 || h >= 18 ? '晚安' : h < 11 ? '早安' : '午安';
}

const todOf = (hi) => ({ '早安': 'morning', '午安': 'noon' })[hi] || 'evening';

function todayText() {
  try {
    return new Intl.DateTimeFormat('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' }).format(new Date());
  } catch { return ''; }
}

// 24-hour time, e.g. 21:48. Read aloud as 21點48分.
function clockParts(d = new Date()) {
  const h = d.getHours(), m = d.getMinutes();
  const hh = String(h).padStart(2, '0'), mm = String(m).padStart(2, '0');
  return { key: `${hh}:${mm}`, time: `${hh}:${mm}`, spoken: `${h}點${m === 0 ? '整' : m + '分'}` };
}

function tickClock() {
  const el = document.getElementById('clock');
  if (!el) return;
  const c = clockParts();
  if (el.dataset.t === c.key) return;
  el.dataset.t = c.key;
  el.textContent = c.time;
  const hi = greeting();
  const big = titleEl.querySelector('.hello-big');
  if (big && big.textContent !== hi) { big.textContent = hi; document.body.dataset.tod = todOf(hi); }
  titleEl.dataset.say = `${hi}，現在${c.spoken}，今天是${todayText()}`;
}
setInterval(tickClock, 1000);

function renderHome() {
  setHeader(HOME_TITLE, false, 'home', 'shop');
  app.className = 'is-home' + (introDone ? '' : ' intro');
  introDone = true;
  const hi = greeting();
  const date = todayText();
  const c = clockParts();
  titleEl.innerHTML = `<span class="hello-row"><span class="hello-big">${hi}</span><span class="hello-clock" id="clock" data-t="${c.key}">${c.time}</span></span><span class="hello-date">${date}</span>`;
  titleEl.dataset.say = `${hi}，現在${c.spoken}，今天是${date}`;
  app.innerHTML = `
    <nav class="grid" aria-label="主選單 Main menu">
      ${CATEGORIES.map((c, i) => `
        <a class="tile${c.items ? '' : ' wide'}" style="--c:${COLORS[c.id]};--i:${i}"
           href="#${c.id}" data-say="${c.zh}" aria-label="${c.zh} ${c.en}">
          <span class="tile-mark" aria-hidden="true">${c.char}</span>
          <span class="tile-label" aria-hidden="true">
            <span>${c.zh}</span>
            <span class="en" lang="en">${c.en}</span>
          </span>
        </a>`).join('')}
    </nav>
    <a class="sos" href="tel:119" data-say="緊急求救">
      <span class="sos-icon" aria-hidden="true">🚑</span>
      <span class="sos-text"><span>緊急求救 119</span><span class="en" lang="en">Emergency</span></span>
    </a>`;
}

/* ===== Category pages (藥 食 行 育 樂 住) ===== */
function actionHTML(item) {
  const cls = 'action' + (item.danger ? ' danger' : '');
  const inner = `
    <span class="action-icon" aria-hidden="true">${item.icon}</span>
    <span class="action-text">
      <span>${item.zh}</span>
      <span class="en" lang="en">${item.en}</span>
    </span>`;
  if (item.href) {
    const external = item.href.startsWith('http');
    return `<a class="${cls}" href="${item.href}" data-say="${item.zh}"${external ? ' target="_blank" rel="noopener"' : ''}>${inner}</a>`;
  }
  return `<button type="button" class="${cls}" data-say="${item.zh}" data-soon>${inner}</button>`;
}

function renderCategory(cat) {
  setHeader(cat.zh, true, 'cat', cat.id);
  app.className = '';
  app.innerHTML = `
    ${pageHead(cat.char, cat.zh, cat.en)}
    <ul class="actions">
      ${cat.items.map((it) => `<li>${actionHTML(it)}</li>`).join('')}
    </ul>`;
  titleEl.focus({ preventScroll: true });
}

/* ===== Shop (日用品) ===== */
function stepperHTML(p, qty) {
  return `
    <div class="stepper" role="group" aria-label="${p.zh} 數量 quantity">
      <button type="button" data-dec="${p.id}" aria-label="減少 ${p.zh} Less">−</button>
      <span class="qty">${qty}</span>
      <button type="button" data-inc="${p.id}" aria-label="增加 ${p.zh} More">＋</button>
    </div>`;
}

function productCard(p) {
  const qty = cart[p.id] || 0;
  return `
    <li class="product">
      <span class="product-icon" aria-hidden="true">${p.icon}</span>
      <span class="product-name">${p.zh}</span>
      <span class="en" lang="en">${p.en}</span>
      <span class="price">NT$ ${p.price}</span>
      ${qty
        ? stepperHTML(p, qty)
        : `<button type="button" class="add-btn" data-add="${p.id}" aria-label="加入 ${p.zh} Add to cart">＋ 加入 <span lang="en">Add</span></button>`}
    </li>`;
}

function visibleProducts() {
  const q = shopQuery.trim().toLowerCase();
  if (q) {
    return PRODUCTS.filter((p) =>
      `${p.zh} ${p.en} ${p.keywords || ''}`.toLowerCase().includes(q));
  }
  if (shopTab === 'essentials') return PRODUCTS.filter((p) => p.essential);
  return PRODUCTS.filter((p) => p.tab === shopTab);
}

function renderShop() {
  setHeader('日用品', true, 'shop', 'shop');
  app.className = '';
  app.innerHTML = `
    <div class="shop">
      ${pageHead('用', '日用品', 'Daily Supplies')}
      <div class="search" role="search">
        <label for="q" class="sr-only">搜尋商品 Search products</label>
        <input id="q" type="search" placeholder="🔍 搜尋 Search" autocomplete="off" enterkeyhint="search">
        ${Recognition ? '<button id="micBtn" class="chip mic" type="button" aria-label="語音搜尋 Voice search">🎤</button>' : ''}
      </div>
      <div id="tabs" class="tabs" aria-label="分類 Categories"></div>
      <h2 id="resultsTitle" class="results-title" hidden></h2>
      <ul id="products" class="products"></ul>
      <a id="cartBar" class="cart-bar" href="#cart"></a>
    </div>`;

  const input = document.getElementById('q');
  input.value = shopQuery;
  input.addEventListener('input', () => { shopQuery = input.value; renderProducts(); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); }); // closes keyboard

  renderProducts();
  updateCartBar();
  titleEl.focus({ preventScroll: true });
}

function renderProducts() {
  const searching = shopQuery.trim() !== '';
  document.getElementById('tabs').innerHTML = SHOP_TABS.map((t) => `
    <button type="button" class="tab" data-tab="${t.id}" data-say="${t.zh}"
      aria-pressed="${!searching && t.id === shopTab}">
      <span class="tab-icon" aria-hidden="true">${t.icon}</span><span>${t.zh}</span> <span class="en" lang="en">${t.en}</span>
    </button>`).join('');

  const list = visibleProducts();
  const title = document.getElementById('resultsTitle');
  title.hidden = !searching;
  if (searching) title.textContent = `「${shopQuery.trim()}」 ${list.length} 項 results`;

  document.getElementById('products').innerHTML = list.length
    ? list.map(productCard).join('')
    : '<li class="empty-msg">找不到商品<br><span class="en" lang="en">Nothing found</span></li>';
}

function updateCartBar(bump = false) {
  const bar = document.getElementById('cartBar');
  if (!bar) return;
  if (bump) { bar.classList.remove('bump'); void bar.offsetWidth; bar.classList.add('bump'); }
  const { count, total } = cartSummary();
  bar.classList.toggle('empty', count === 0);
  bar.dataset.say = count ? `購物車 ${count} 件` : '購物車是空的';
  bar.innerHTML = count
    ? `<span><span class="nw">🛒 購物車</span> <span class="nw">${count} 件</span><br><span class="en" lang="en">View cart</span></span><span>NT$ ${total} →</span>`
    : '<span><span class="nw">🛒 購物車是空的</span><br><span class="en" lang="en">Cart is empty</span></span>';
}

function selectTab(id) {
  shopTab = id;
  store.set('shopTab', id);
  shopQuery = '';
  const input = document.getElementById('q');
  if (input) input.value = '';
  renderProducts();
  const ul = document.getElementById('products');
  ul.classList.remove('swap'); void ul.offsetWidth; ul.classList.add('swap');
}

let listening = null;
function listen() {
  if (!Recognition) return;
  if (listening) { listening.abort(); return; }
  const micBtn = document.getElementById('micBtn');
  const r = new Recognition();
  r.lang = 'zh-TW';
  r.interimResults = false;
  r.maxAlternatives = 1;
  r.onresult = (e) => {
    const text = e.results[0][0].transcript.replace(/[。，,.!?！？]/g, '').trim();
    const input = document.getElementById('q');
    if (input) input.value = text;
    shopQuery = text;
    if (currentView() === 'shop') renderProducts();
  };
  r.onerror = (e) => {
    if (e.error !== 'aborted') showToast('聽不清楚，請再試一次\nPlease try again');
  };
  r.onend = () => {
    listening = null;
    if (micBtn) micBtn.classList.remove('listening');
  };
  try {
    if (canSpeak) speechSynthesis.cancel();
    r.start();
    listening = r;
    if (micBtn) micBtn.classList.add('listening');
    showToast('請說出商品名稱\nSay a product name');
  } catch {
    showToast('無法使用麥克風\nMicrophone not available');
  }
}

function changeQty(id, delta) {
  const p = findProduct(id);
  if (!p) return;
  const next = Math.max(0, (cart[id] || 0) + delta);
  if (next) cart[id] = next; else delete cart[id];
  store.set('cart', cart);

  if (delta > 0 && next === 1) { showToast(`已加入 ${p.zh}\nAdded to cart`); say(`已加入${p.zh}`); }
  else if (next === 0) { showToast(`已移除 ${p.zh}\nRemoved`); say(`已移除${p.zh}`); }
  else say(`${p.zh} ${next}`);

  // Re-draw only what changed, then keep keyboard focus on the same product.
  const view = currentView();
  if (view === 'cart') renderCart();
  else if (view === 'shop') { renderProducts(); updateCartBar(true); }
  const el = document.querySelector(`[data-inc="${id}"]`) || document.querySelector(`[data-add="${id}"]`);
  if (el) {
    el.focus({ preventScroll: true });
    const st = el.closest('.stepper');
    if (st) {
      if (delta > 0 && next === 1) st.classList.add('appear');
      else { const q = st.querySelector('.qty'); if (q) q.classList.add('pop'); }
    }
  }
}

/* ===== Cart ===== */
function renderCart() {
  setHeader('購物車', true, 'cart', 'cart');
  app.className = '';
  const items = cartItems();

  if (!items.length) {
    app.innerHTML = `
      ${pageHead('🛒', '購物車', 'Your cart')}
      <section class="cart-empty">
        <p class="empty-zh">購物車是空的</p>
        <p class="en" lang="en">Your cart is empty</p>
        <a class="action primary" href="#shop" data-say="去選購">
          <span class="action-icon" aria-hidden="true">🛍️</span>
          <span class="action-text"><span>去選購</span><span class="en" lang="en">Go shopping</span></span>
        </a>
      </section>`;
    return;
  }

  const { total } = cartSummary();
  app.innerHTML = `
    ${pageHead('🛒', '購物車', 'Your cart')}
    <ul class="cart-list">
      ${items.map(({ p, qty }) => `
        <li class="cart-item">
          <span class="product-icon" aria-hidden="true">${p.icon}</span>
          <span class="cart-item-text">
            <span class="product-name">${p.zh}</span>
            <span class="en" lang="en">${p.en}</span>
            <span class="price">NT$ ${p.price * qty}</span>
          </span>
          ${stepperHTML(p, qty)}
        </li>`).join('')}
    </ul>
    <p class="cart-total"><span>合計 <span class="en" lang="en">Total</span></span><span>NT$ ${total}</span></p>
    <div class="cart-actions">
      <button type="button" class="action primary" data-share data-say="傳給家人">
        <span class="action-icon" aria-hidden="true">📤</span>
        <span class="action-text"><span>傳給家人</span><span class="en" lang="en">Send list to family</span></span>
      </button>
      <button type="button" class="action" data-clear>
        <span class="action-icon" aria-hidden="true">🗑️</span>
        <span class="action-text"><span>清空購物車</span><span class="en" lang="en">Clear cart</span></span>
      </button>
    </div>
    <p class="note">這是購物清單，不會真的下單或付款。<br><span lang="en">This is a shopping list only — nothing is ordered or paid.</span></p>`;
}

async function shareCart() {
  const items = cartItems();
  if (!items.length) return;
  const { total } = cartSummary();
  const text = [
    '購物清單 Shopping list',
    ...items.map(({ p, qty }) => `• ${p.zh} ${p.en} × ${qty}`),
    `合計 Total: NT$ ${total}`,
  ].join('\n');

  if (navigator.share) {
    try { await navigator.share({ title: '購物清單 Shopping list', text }); return; }
    catch (err) { if (err && err.name === 'AbortError') return; }
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast('清單已複製，可貼到 LINE\nList copied');
  } catch {
    showToast('無法分享\nCould not share');
  }
}

// Two taps instead of a pop-up: the first tap asks, the second clears.
let clearTimer;
function clearCart(btn) {
  if (btn && !btn.classList.contains('armed')) {
    btn.classList.add('armed', 'danger');
    btn.querySelector('.action-text').innerHTML = '<span>再按一次，確定清空</span><span class="en" lang="en">Tap again to clear</span>';
    clearTimeout(clearTimer);
    clearTimer = setTimeout(() => { if (currentView() === 'cart') renderCart(); }, 4000);
    return;
  }
  clearTimeout(clearTimer);
  cart = {};
  store.set('cart', cart);
  renderCart();
  showToast('購物車已清空\nCart cleared');
}

/* ===== Navigation =====
   Each in-app step is a real history entry, so the phone's Back button
   and the on-screen ← 返回 button behave the same way. */
function currentView() {
  return decodeURIComponent(location.hash.slice(1));
}

function parentOf(view) {
  if (view === 'cart') return '#shop';
  if (view === 'give' || view === 'vol') return '#home';
  if (view === 'give-new' || view === 'give-done') return '#give';
  if (view.startsWith('vol-')) return '#vol'; // my jobs, profile, badges, rewards, leaderboard, certificates
  return '';
}

let booted = false;
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function renderView() {
  const view = currentView();
  if (view === 'shop') renderShop();
  else if (view === 'cart') renderCart();
  else if (view === 'give') renderGive();
  else if (view === 'give-new') renderGiveNew();
  else if (view === 'give-done') renderGiveDone();
  else if (view === 'vol') renderVol();
  else if (view === 'vol-mine') renderMine();
  else if (view === 'vol-me') renderProfile();
  else if (view === 'vol-badges') renderBadges();
  else if (view === 'vol-shop') renderRewards();
  else if (view === 'vol-rank') renderRank();
  else if (view === 'vol-cert') renderCerts();
  else {
    const cat = CATEGORIES.find((c) => c.id === view && c.items);
    if (cat) renderCategory(cat); else renderHome();
  }
  window.scrollTo(0, 0);
}

// dir: 'fwd' slides the new page in from the right, 'back' from the left.
function route(dir = 'fwd') {
  if (listening) listening.abort();
  if (!booted || reduceMotion()) { booted = true; renderView(); return; }
  document.documentElement.dataset.nav = dir;
  if (document.startViewTransition) {
    document.startViewTransition(renderView);
  } else {
    renderView();
    app.classList.add(dir === 'back' ? 'enter-back' : 'enter');
  }
}

function go(hash) {
  const depth = (history.state && history.state.depth) || 0;
  const url = hash && hash !== '#' ? hash : location.pathname + location.search;
  history.pushState({ depth: depth + 1 }, '', url);
  route('fwd');
}

backBtn.addEventListener('click', () => {
  if (history.state && history.state.depth > 0) {
    history.back();
  } else {
    const parent = parentOf(currentView());
    history.replaceState({ depth: 0 }, '', parent || location.pathname + location.search);
    route('back');
  }
});

window.addEventListener('popstate', () => route('back'));

document.addEventListener('click', (e) => {
  const t = e.target;
  const sayEl = t.closest('[data-say]');
  if (sayEl) say(sayEl.dataset.say);

  const link = t.closest('a[href^="#"]');
  if (link) { e.preventDefault(); go(link.getAttribute('href')); return; }

  const el = t.closest('[data-soon],[data-tab],[data-add],[data-inc],[data-dec],[data-share],[data-clear],#micBtn');
  if (!el) return;
  const d = el.dataset;
  if ('soon' in d) showToast('此功能即將推出\nComing soon');
  else if (d.tab) selectTab(d.tab);
  else if (d.add) changeQty(d.add, +1);
  else if (d.inc) changeQty(d.inc, +1);
  else if (d.dec) changeQty(d.dec, -1);
  else if ('share' in d) shareCart();
  else if ('clear' in d) clearCart(el);
  else if (el.id === 'micBtn') listen();
});

/* ===== Start ===== */
document.body.dataset.tod = todOf(greeting());
applySize();
applyVoice();
history.replaceState({ depth: 0 }, '', location.href);
route();
