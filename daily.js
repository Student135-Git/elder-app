'use strict';

/* =========================================================
   Daily-life pages (the buttons that used to say "coming soon"):
     食  今日菜單 · 喝水提醒        行  帶我回家
     育  散步紀錄 · 健康知識        樂  聽音樂 · 動腦遊戲
     藥  吃藥提醒 · 看診預約
   Everything is saved on this phone (localStorage). Reminders
   show while the app is open and as a notice on the home screen;
   they are not phone notifications.
   ========================================================= */

const dToday = () => ymd(Date.now());
const dEsc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bi = (zh, en) => `<span class="bi"><span>${zh}</span><span class="en" lang="en">${en}</span></span>`;

function dailyPage(icon, zh, en, color, body) {
  setHeader(zh, true, 'cat', color);
  app.className = '';
  app.innerHTML = `${pageHead(icon, zh, en)}<div class="dwrap">${body}</div>`;
}
const redraw = () => { const y = window.scrollY; renderView(); window.scrollTo(0, y); };

/* ---------- 食 今日菜單 ---------- */
const MENUS = [ // Sunday first; simple, soft, low-salt home dishes
  [['燕麥粥、水煮蛋、香蕉', 'Oat porridge, boiled egg, banana'], ['清蒸魚、炒高麗菜、糙米飯、豆腐湯', 'Steamed fish, stir-fried cabbage, brown rice, tofu soup'], ['香菇雞湯、燙地瓜葉、五穀飯', 'Mushroom chicken soup, sweet-potato leaves, multigrain rice']],
  [['地瓜粥、荷包蛋、燙青菜', 'Sweet-potato porridge, fried egg, greens'], ['番茄炒蛋、滷豆腐、青菜、白飯', 'Tomato and egg, braised tofu, greens, rice'], ['蒸蛋、清炒絲瓜、鮭魚、白飯', 'Steamed egg, loofah, salmon, rice']],
  [['全麥饅頭、無糖豆漿、蘋果', 'Wholewheat bun, unsweetened soy milk, apple'], ['瘦肉粥、涼拌小黃瓜、燙花椰菜', 'Lean pork porridge, cucumber salad, broccoli'], ['紅燒豆腐、炒菠菜、紫米飯、蛤蜊湯', 'Braised tofu, spinach, purple rice, clam soup']],
  [['吐司、水煮蛋、牛奶', 'Toast, boiled egg, milk'], ['雞肉燉南瓜、炒青江菜、糙米飯', 'Chicken with pumpkin, bok choy, brown rice'], ['鮮魚湯麵、燙青菜', 'Fish noodle soup, greens']],
  [['小米粥、蒸蛋、海苔', 'Millet porridge, steamed egg, seaweed'], ['洋蔥炒肉絲、炒空心菜、白飯、味噌湯', 'Pork with onion, water spinach, rice, miso soup'], ['蔬菜豆腐鍋、五穀飯', 'Vegetable tofu hot pot, multigrain rice']],
  [['蔬菜蛋餅、無糖豆漿', 'Vegetable egg crepe, unsweetened soy milk'], ['清蒸鱈魚、炒木耳、糙米飯、蘿蔔湯', 'Steamed cod, wood-ear mushroom, brown rice, radish soup'], ['雞肉蔬菜粥、燙地瓜葉', 'Chicken vegetable porridge, sweet-potato leaves']],
  [['地瓜、茶葉蛋、牛奶', 'Sweet potato, tea egg, milk'], ['滷雞腿、炒高麗菜、白飯、紫菜蛋花湯', 'Braised chicken leg, cabbage, rice, seaweed egg soup'], ['山藥排骨湯、炒莧菜、五穀飯', 'Yam and pork rib soup, amaranth greens, multigrain rice']],
];

function renderMenu() {
  const d = new Date();
  const m = MENUS[d.getDay()];
  const day = new Intl.DateTimeFormat('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' }).format(d);
  const meal = (icon, zh, en, [dz, de]) => `
    <section class="dcard meal" data-say="${zh}，${dz}">
      <p class="meal-t"><span aria-hidden="true">${icon}</span> ${zh} <span class="en" lang="en">${en}</span></p>
      <p class="dbig">${dz}</p><p class="en" lang="en">${de}</p>
    </section>`;
  dailyPage('🍱', '今日菜單', "Today's meals", 'food', `
    <p class="dlead">${day}</p>
    ${meal('🌅', '早餐', 'Breakfast', m[0])}${meal('☀️', '午餐', 'Lunch', m[1])}${meal('🌙', '晚餐', 'Dinner', m[2])}
    <p class="note-box">建議菜單，僅供參考。少鹽、少油、多蔬菜；有飲食限制請照醫師或營養師的指示。<br><span lang="en">A suggested menu only. Less salt and oil, more vegetables; if you have a diet plan, follow your doctor or dietitian.</span></p>`);
}

/* ---------- 食 喝水提醒 ---------- */
const WATER_GOAL = 8;
function getWater() { const w = store.get('water', null); return w && w.day === dToday() ? w : { day: dToday(), cups: 0, last: 0 }; }

function renderWater() {
  const w = getWater();
  const on = store.get('waterRemind', true);
  const left = Math.max(0, WATER_GOAL - w.cups);
  dailyPage('💧', '喝水提醒', 'Drink water', 'food', `
    <section class="dcard center">
      <p class="dbig">今天喝了 <strong class="dnum">${w.cups}</strong> / ${WATER_GOAL} 杯</p>
      <p class="en" lang="en">${w.cups} of ${WATER_GOAL} cups today</p>
      <div class="cups" aria-hidden="true">${Array.from({ length: WATER_GOAL }, (_, i) => `<span class="cup${i < w.cups ? ' full' : ''}${i === w.cups - 1 ? ' new' : ''}"><i></i></span>`).join('')}</div>
      <p class="dlead">${left ? `再喝 ${left} 杯就達標了` : '今天達標了，真棒！'} <span class="en" lang="en">${left ? `${left} more to go` : 'Goal reached — well done!'}</span></p>
      <button type="button" class="dbtn big" data-d="water+" data-say="喝了一杯">＋ ${bi('喝了一杯', 'I drank a cup')}</button>
      <button type="button" class="dbtn ghost" data-d="water-" ${w.cups ? '' : 'disabled'}>${bi('少算一杯', 'Remove one')}</button>
    </section>
    <section class="dcard">
      <button type="button" class="dtoggle" data-d="waterRemind" aria-pressed="${on}"><span class="dtoggle-box" aria-hidden="true"></span>${bi('每 2 小時提醒我喝水', 'Remind me every 2 hours')}</button>
      <p class="note">App 開著的時候才會提醒（早上 7 點到晚上 8 點）。<br><span lang="en">Reminds only while the app is open, 7 am to 8 pm.</span></p>
    </section>`);
}

/* ---------- 行 帶我回家 ---------- */
// The home address is typed in (no live location). Saved as { town, address } on this phone.
let homeEdit = false;
let homeMap = null;
const getHome = () => { const h = store.get('homeAddr', null); return h && h.town && h.address ? h : null; };
const homeQuery = (h) => `花蓮縣${h.town}${h.address}`;

function renderGoHome() {
  const h = getHome();
  if (h && !homeEdit) {
    const q = encodeURIComponent(homeQuery(h));
    dailyPage('🏠', '帶我回家', 'Take me home', 'transport', `
      <section class="dcard center">
        <p class="dbig">🏠 我的家</p>
        <p class="dlead">花蓮縣${h.town} ${dEsc(h.address)}<br><span class="en" lang="en">${cityLabel(h.town, 'en')}, Hualien</span></p>
        <a class="dbtn big" href="https://www.google.com/maps/dir/?api=1&destination=${q}" target="_blank" rel="noopener" data-say="帶我回家">🧭 ${bi('帶我回家', 'Take me home')}</a>
        <a class="dbtn ghost" href="https://www.google.com/maps/search/?api=1&query=${q}" target="_blank" rel="noopener">${bi('在地圖上看我的家', 'See my home on the map')}</a>
        <button type="button" class="dbtn ghost" data-d="homeEdit">${bi('修改地址', 'Change the address')}</button>
      </section>
      <p class="note">地址只存在這支手機上。<br><span lang="en">The address is saved on this phone only.</span></p>`);
    return;
  }
  const d = h || { town: '', address: '' };
  homeEdit = true;
  dailyPage('🏠', '帶我回家', 'Take me home', 'transport', `
    <p class="dlead">請選鄉鎮，再打您家的地址。下面的地圖會顯示這個地址，請確認位置對不對。<br><span class="en" lang="en">Choose your township and type your home address. Check the map shows the right place.</span></p>
    <section class="dcard">
      <label class="flabel" for="home-town">${bi('鄉鎮（花蓮縣）', 'Township (Hualien)')}</label>
      <button type="button" class="field" id="home-town" data-w="hometown" data-town="${d.town}"><span class="fi" aria-hidden="true">📍</span><span class="fv${d.town ? '' : ' ph'}" id="home-town-v">${d.town ? `${d.town} ${cityLabel(d.town, 'en')}` : '請選擇 Choose'}</span><span class="chev" aria-hidden="true"></span></button>
      <label class="flabel" for="home-addr">${bi('地址（路名、門牌號碼）', 'Address (street and number)')}</label>
      <div class="fwrap"><span class="fi" aria-hidden="true">🏠</span><input class="in" id="home-addr" maxlength="80" autocomplete="street-address" placeholder="例：中山路 123 號 · e.g. 123 Zhongshan Rd"></div>
      <div class="addr-box">
        <div class="addr-map" id="home-map"></div>
        <p class="vnote addr-tip"></p>
        <a class="addr-open" href="#" target="_blank" rel="noopener">${bi('在 Google 地圖打開', 'Open in Google Maps')} ↗</a>
      </div>
      <p class="ferr" id="home-err" role="alert" hidden></p>
      <button type="button" class="dbtn big" data-d="homeSave">${bi('儲存我的家', 'Save my home')}</button>
      ${h ? `<button type="button" class="dbtn ghost" data-d="homeCancel">${bi('取消', 'Cancel')}</button>` : ''}
    </section>`);
  document.getElementById('home-addr').value = d.address;
  homeMap = addrMap.mount(document.getElementById('home-map'), { town: d.town, address: d.address }, {
    onPin(town, address) { // only with a Google Maps key: the pin was moved
      if (town) setHomeTown(town, true);
      if (address) document.getElementById('home-addr').value = address;
    },
    onFound() {},
  });
}

function setHomeTown(town, quiet) {
  const f = document.getElementById('home-town');
  if (!f) return;
  f.dataset.town = town;
  const v = document.getElementById('home-town-v');
  v.textContent = `${town} ${cityLabel(town, 'en')}`;
  v.classList.remove('ph');
  if (homeMap) { if (quiet) homeMap.adoptTown(town); else homeMap.setTown(town); }
}

function saveHome() {
  const town = document.getElementById('home-town').dataset.town;
  const address = document.getElementById('home-addr').value.trim();
  if (!town) { dErr('home-err', '請選擇鄉鎮。', 'Please choose your township.'); return; }
  if (address.length < 3) { dErr('home-err', '請填寫地址（路名和門牌號碼）。', 'Please type your address (street and number).'); return; }
  store.set('homeAddr', { town, address, at: Date.now() });
  store.set('homeLoc', null); // drop the old live-location home
  homeEdit = false;
  showToast('已記下您的家\nHome saved'); say('已記下您的家');
  redraw();
}

document.addEventListener('click', (e) => {
  const f = e.target.closest('[data-w="hometown"]');
  if (f) openTownSheet('鄉鎮 · Township', f.dataset.town, (v) => setHomeTown(v));
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'home-addr' && homeMap) homeMap.setAddress(e.target.value);
});

/* ---------- 育 散步紀錄 ---------- */
const WALK_GOAL = 30; // minutes a day
const getWalks = () => { const w = store.get('walks', {}); return w && typeof w === 'object' ? w : {}; };

function renderWalk() {
  const walks = getWalks();
  const today = walks[dToday()] || 0;
  const days = Array.from({ length: 7 }, (_, i) => { const t = Date.now() - (6 - i) * DAY_MS; return { key: ymd(t), min: walks[ymd(t)] || 0, label: '日一二三四五六'[new Date(t).getDay()] }; });
  const max = Math.max(WALK_GOAL * 1.5, ...days.map((d) => d.min));
  const week = days.reduce((s, d) => s + d.min, 0);
  dailyPage('🚶', '散步紀錄', 'Walking log', 'body', `
    <section class="dcard center">
      <p class="dbig">今天走了 <strong class="dnum">${today}</strong> 分鐘</p>
      <p class="en" lang="en">${today} minutes today · goal ${WALK_GOAL}</p>
      <span class="bar big" aria-hidden="true"><i style="width:${Math.min(100, Math.round((today / WALK_GOAL) * 100))}%"></i></span>
      <p class="dlead">${today >= WALK_GOAL ? '達標了，真棒！' : `目標每天 ${WALK_GOAL} 分鐘`} <span class="en" lang="en">${today >= WALK_GOAL ? 'Goal reached!' : `Goal: ${WALK_GOAL} minutes a day`}</span></p>
      <div class="drow3">
        ${[10, 20, 30].map((n) => `<button type="button" class="dbtn" data-d="walk+" data-n="${n}" data-say="加 ${n} 分鐘">＋${n} ${bi('分鐘', 'min')}</button>`).join('')}
      </div>
      <button type="button" class="dbtn ghost" data-d="walk0" ${today ? '' : 'disabled'}>${bi('清除今天', 'Clear today')}</button>
    </section>
    <section class="dcard">
      <p class="dcard-t">${bi('最近 7 天', 'Last 7 days')}　<span class="en">${week} 分鐘 min</span></p>
      <div class="chart" role="img" aria-label="最近七天散步分鐘：${days.map((d) => d.min).join('、')}">
        <span class="chart-goal" style="bottom:${(WALK_GOAL / max) * 100}%"><em>${WALK_GOAL}</em></span>
        ${days.map((d, i) => `<span class="chart-col${d.key === dToday() ? ' today' : ''}" style="--i:${i}"><b>${d.min || ''}</b><i style="height:${Math.max(d.min ? 4 : 0, (d.min / max) * 100)}%"></i><span>${d.label}</span></span>`).join('')}
      </div>
    </section>`);
}

/* ---------- 育 健康知識 ---------- */
const TIPS = [
  ['💧', '每天喝足夠的水，不要等口渴才喝。', 'Drink enough water every day — don’t wait until you are thirsty.'],
  ['🚶', '每天走路 30 分鐘，可以分成幾次走。', 'Walk 30 minutes a day; several short walks count.'],
  ['🪑', '起身要慢：先坐一下，再慢慢站起來，預防頭暈跌倒。', 'Get up slowly: sit for a moment, then stand, to avoid dizziness and falls.'],
  ['👟', '在家穿防滑的鞋子，浴室放防滑墊。', 'Wear non-slip shoes at home and use a non-slip mat in the bathroom.'],
  ['💡', '晚上走道留一盞小燈，起床比較安全。', 'Keep a small light on in the hallway at night.'],
  ['🥦', '每餐都吃一些蔬菜，少鹽、少油、少糖。', 'Eat vegetables at every meal; go easy on salt, oil and sugar.'],
  ['😴', '每天固定時間睡覺和起床，睡前少看手機。', 'Go to bed and get up at regular times; less phone before sleep.'],
  ['☎️', '常和家人朋友聊天，心情會比較好。', 'Talk with family and friends often — it lifts the mood.'],
  ['💊', '按時吃藥，不要自己停藥或加藥；有問題先問醫師或藥師。', 'Take medicine on time; don’t stop or add any yourself — ask your doctor or pharmacist.'],
  ['🧴', '出門做好防曬、戴帽子，天氣熱時多休息。', 'Use sun protection and a hat outdoors, and rest more in hot weather.'],
  ['🧠', '多動腦：看書、下棋、玩記憶遊戲都很好。', 'Keep your mind active: reading, chess and memory games all help.'],
  ['🦷', '每天刷牙，定期檢查牙齒。', 'Brush your teeth every day and have regular dental check-ups.'],
];

function renderTips() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const pick = Math.floor((Date.now() - start) / DAY_MS) % TIPS.length;
  const [icon, zh, en] = TIPS[pick];
  dailyPage('📚', '健康知識', 'Health tips', 'body', `
    <section class="dcard tip-today" data-say="${zh}">
      <p class="dcard-t">⭐ ${bi('今天的小提醒', 'Tip of the day')}</p>
      <p class="tip-icon" aria-hidden="true">${icon}</p>
      <p class="dbig">${zh}</p><p class="en" lang="en">${en}</p>
    </section>
    <ul class="tips">
      ${TIPS.map(([i, z, e], n) => (n === pick ? '' : `<li class="dcard tip" data-say="${z}" style="--i:${Math.min(n, 8)}"><span class="tip-i" aria-hidden="true">${i}</span><span><span class="tip-zh">${z}</span><span class="en" lang="en">${e}</span></span></li>`)).join('')}
    </ul>
    <p class="note-box">一般保健常識，不能代替醫師的建議。<br><span lang="en">General wellness tips, not a substitute for medical advice.</span></p>`);
}

/* ---------- 樂 聽音樂 ---------- */
const MUSIC = [
  ['🎤', '國語懷念老歌', 'Mandarin golden oldies', '國語懷念老歌'],
  ['🎙️', '台語老歌', 'Taiwanese classics', '台語老歌'],
  ['🪕', '原住民歌謠', 'Indigenous songs', '原住民歌謠 阿美族'],
  ['🎎', '日語演歌', 'Japanese enka', '日本演歌 懷念'],
  ['🏮', '客家老歌', 'Hakka classics', '客家老歌'],
  ['🎹', '輕音樂・放鬆', 'Relaxing music', '輕音樂 放鬆'],
  ['🪷', '靜心音樂', 'Calm and meditation', '靜心音樂'],
  ['🌧️', '助眠・自然聲音', 'Sleep and nature sounds', '助眠 自然聲音 雨聲'],
];

function renderMusic() {
  dailyPage('🎵', '聽音樂', 'Music', 'fun', `
    <p class="dlead">選一種音樂，會打開 YouTube。<br><span class="en" lang="en">Choose a kind of music — it opens YouTube.</span></p>
    <div class="dgrid">
      ${MUSIC.map(([icon, zh, en, q], i) => `
        <a class="dtile" href="https://www.youtube.com/results?search_query=${encodeURIComponent(q)}" target="_blank" rel="noopener" data-say="${zh}" style="--i:${i}">
          <span class="dtile-icon" aria-hidden="true">${icon}</span><span class="dtile-zh">${zh}</span><span class="en" lang="en">${en}</span>
        </a>`).join('')}
    </div>
    <p class="note">需要網路。<span lang="en"> Needs the internet.</span></p>`);
}

/* ---------- 樂 動腦遊戲: 記憶翻牌 ---------- */
const GAME_ICONS = ['🍎', '🍌', '🍇', '🍉', '🐶', '🐱', '🐟', '🦋', '🌻', '🌙', '⭐', '☂️'];
const GAME_LEVELS = { easy: [3, '簡單', 'Easy'], mid: [6, '普通', 'Medium'], hard: [8, '困難', 'Hard'] };
let game = null;

function newGame(level) {
  const pairs = GAME_LEVELS[level][0];
  const icons = GAME_ICONS.slice().sort(() => Math.random() - 0.5).slice(0, pairs);
  const deck = [...icons, ...icons].map((icon, i) => ({ icon, k: i })).sort(() => Math.random() - 0.5);
  game = { level, deck, open: [], found: [], moves: 0, lock: false };
}

function renderGame() {
  if (!game) newGame(store.get('gameLevel', 'easy'));
  const g = game;
  const best = store.get('gameBest', {})[g.level];
  const won = g.found.length === g.deck.length;
  dailyPage('🧩', '動腦遊戲', 'Brain games', 'fun', `
    <p class="dlead">記憶翻牌：找出一樣的兩張。<br><span class="en" lang="en">Memory match: find the two that are the same.</span></p>
    <div class="dseg" role="group" aria-label="難度 Level">
      ${Object.entries(GAME_LEVELS).map(([k, [, zh, en]]) => `<button type="button" data-d="gameLevel" data-k="${k}" aria-pressed="${k === g.level}">${zh} <span class="en" lang="en">${en}</span></button>`).join('')}
    </div>
    <p class="game-score" id="game-score" aria-live="polite">翻了 <strong>${g.moves}</strong> 次 <span class="en" lang="en">moves</span>${best ? `　最佳 ${best} <span class="en" lang="en">best ${best}</span>` : ''}</p>
    <div class="mgrid n${g.deck.length}" id="mgrid">
      ${g.deck.map((c, i) => { const up = g.open.includes(i) || g.found.includes(i); return `<button type="button" class="mcard${up ? ' up' : ''}${g.found.includes(i) ? ' found' : ''}" data-card="${i}" aria-label="${up ? c.icon : `第 ${i + 1} 張牌 Card ${i + 1}`}"><span class="mcard-in"><span class="mcard-back" aria-hidden="true">?</span><span class="mcard-face" aria-hidden="true">${c.icon}</span></span></button>`; }).join('')}
    </div>
    ${won ? `<section class="dcard center game-won"><p class="dbig">🎉 全部找到了！</p><p class="en" lang="en">You found them all in ${g.moves} moves!</p></section>` : ''}
    <button type="button" class="dbtn${won ? ' big' : ' ghost'}" data-d="gameNew">${bi('重新開始', 'New game')}</button>`);
}

function flipCard(i) {
  const g = game;
  if (!g || g.lock || g.open.includes(i) || g.found.includes(i)) return;
  const el = (n) => document.querySelector(`[data-card="${n}"]`);
  g.open.push(i);
  el(i).classList.add('up');
  el(i).setAttribute('aria-label', g.deck[i].icon);
  if (g.open.length < 2) return;
  g.moves += 1;
  const [a, b] = g.open;
  const score = document.querySelector('#game-score strong');
  if (score) score.textContent = g.moves;
  if (g.deck[a].icon === g.deck[b].icon) {
    g.found.push(a, b); g.open = [];
    [a, b].forEach((n) => el(n).classList.add('found'));
    if (g.found.length === g.deck.length) {
      const best = store.get('gameBest', {});
      if (!best[g.level] || g.moves < best[g.level]) { best[g.level] = g.moves; store.set('gameBest', best); }
      say('全部找到了，真棒'); setTimeout(() => { if (currentView() === 'fun-games') redraw(); }, 700);
    } else say('答對了');
  } else {
    g.lock = true;
    setTimeout(() => {
      [a, b].forEach((n) => { const c = el(n); if (c) { c.classList.remove('up'); c.setAttribute('aria-label', `第 ${n + 1} 張牌 Card ${n + 1}`); } });
      g.open = []; g.lock = false;
    }, reduceMotion() ? 1200 : 1000);
  }
}

/* ---------- 藥 吃藥提醒 ---------- */
const MED_SLOTS = [['am', '早上', 'Morning', 8], ['noon', '中午', 'Noon', 12], ['pm', '晚上', 'Evening', 18], ['night', '睡前', 'Bedtime', 21]];
const getMeds = () => { const m = store.get('meds', []); return Array.isArray(m) ? m : []; };
function getTaken() { const t = store.get('medTaken', null); return t && t.day === dToday() ? t : { day: dToday(), done: {} }; }
let medDraft = { name: '', slots: ['am'] };

// Doses whose time has come today and are not ticked yet.
function medsDue() {
  const hour = new Date().getHours(), done = getTaken().done;
  return getMeds().flatMap((m) => m.slots.filter((s) => { const slot = MED_SLOTS.find((x) => x[0] === s); return slot && slot[3] <= hour && !done[m.id + '|' + s]; }).map((s) => ({ m, s })));
}

function renderPills() {
  const meds = getMeds(), done = getTaken().done;
  const hour = new Date().getHours();
  const total = meds.reduce((n, m) => n + m.slots.length, 0);
  const taken = meds.reduce((n, m) => n + m.slots.filter((s) => done[m.id + '|' + s]).length, 0);
  const groups = MED_SLOTS.map(([id, zh, en, h]) => {
    const list = meds.filter((m) => m.slots.includes(id));
    if (!list.length) return '';
    return `<section class="dcard">
      <p class="dcard-t">${zh} <span class="en" lang="en">${en}</span>　<span class="en">${String(h).padStart(2, '0')}:00</span></p>
      ${list.map((m) => { const k = m.id + '|' + id, ok = Boolean(done[k]); return `<button type="button" class="dtoggle med${!ok && h <= hour ? ' due' : ''}" data-d="medTick" data-k="${k}" aria-pressed="${ok}" data-say="${dEsc(m.name)}"><span class="dtoggle-box" aria-hidden="true"></span><span class="bi"><span>${dEsc(m.name)}</span><span class="en" lang="en">${ok ? '已吃 Taken' : h <= hour ? '該吃了 Time to take it' : '還沒到時間 Later today'}</span></span></button>`; }).join('')}
    </section>`;
  }).join('');
  dailyPage('⏰', '吃藥提醒', 'Medication reminder', 'medicine', `
    ${total ? `<p class="dlead">今天吃了 <strong>${taken}</strong> / ${total} 次 <span class="en" lang="en">${taken} of ${total} doses today</span></p>${groups}`
      : `<p class="dempty">${bi('還沒有藥。請在下面新增。', 'No medicine yet. Add one below.')}</p>`}
    <section class="dcard" id="med-form">
      <p class="dcard-t">＋ ${bi('新增藥品', 'Add a medicine')}</p>
      <label class="flabel" for="med-name">藥名 <span class="en" lang="en">Name</span></label>
      <input class="in" id="med-name" maxlength="24" value="${dEsc(medDraft.name)}" placeholder="例：血壓藥 · e.g. blood pressure pill">
      <p class="flabel">什麼時候吃 <span class="en" lang="en">When</span></p>
      <div class="dslots">${MED_SLOTS.map(([id, zh, en]) => `<button type="button" class="opt" data-d="medSlot" data-k="${id}" aria-pressed="${medDraft.slots.includes(id)}">${bi(zh, en)}</button>`).join('')}</div>
      <p class="ferr" id="med-err" role="alert" hidden></p>
      <button type="button" class="dbtn" data-d="medAdd">${bi('新增', 'Add')}</button>
    </section>
    ${meds.length ? `<section class="dcard"><p class="dcard-t">${bi('我的藥', 'My medicines')}</p>
      ${meds.map((m) => `<div class="drow"><span class="drow-t">${dEsc(m.name)}<span class="en">${m.slots.map((s) => MED_SLOTS.find((x) => x[0] === s)[1]).join('、')}</span></span><button type="button" class="btn-ghost sm danger" data-d="medDel" data-id="${m.id}">${bi('刪除', 'Remove')}</button></div>`).join('')}</section>` : ''}
    <p class="note-box">請照醫師和藥師的指示用藥。App 開著時，首頁會提醒還沒吃的藥。<br><span lang="en">Follow your doctor and pharmacist. While the app is open, the home screen shows doses not yet taken.</span></p>`);
}

/* ---------- 藥 看診預約 (my appointments) ---------- */
const getVisits = () => { const v = store.get('visits', []); return (Array.isArray(v) ? v : []).filter((x) => x.date >= dToday()); };
let visitDraft = { place: '', date: '', time: '09:00', note: '' };
const daysUntil = (date) => Math.round((evDay(date) - evToday()) / DAY_MS);
const whenText = (n) => (n === 0 ? ['今天', 'Today'] : n === 1 ? ['明天', 'Tomorrow'] : [`${n} 天後`, `In ${n} days`]);

function renderVisits() {
  const list = getVisits().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const times = []; for (let h = 7; h <= 20; h++) for (const m of ['00', '30']) times.push(`${String(h).padStart(2, '0')}:${m}`);
  dailyPage('🏥', '看診預約', 'My appointments', 'medicine', `
    ${list.length ? list.map((v) => { const n = daysUntil(v.date), [wz, we] = whenText(n); return `
      <section class="dcard visit${n <= 1 ? ' soon' : ''}">
        <p class="dcard-t"><span class="ev-status${n <= 1 ? ' soon' : ''}">${wz} ${we}</span></p>
        <p class="dbig">${dEsc(v.place)}</p>
        <ul class="jfacts"><li><span aria-hidden="true">📅</span><span>${fmtDate(evDay(v.date).getTime(), 'zh')}・${v.time}</span></li>${v.note ? `<li><span aria-hidden="true">📝</span><span>${dEsc(v.note)}</span></li>` : ''}</ul>
        <div class="drow"><a class="dbtn ghost" href="${maps(v.place)}" target="_blank" rel="noopener">🗺️ ${bi('地圖', 'Map')}</a><button type="button" class="btn-ghost sm danger" data-d="visitDel" data-id="${v.id}">${bi('刪除', 'Remove')}</button></div>
      </section>`; }).join('')
      : `<p class="dempty">${bi('還沒有看診紀錄。請在下面新增。', 'No appointments yet. Add one below.')}</p>`}
    <section class="dcard">
      <p class="dcard-t">＋ ${bi('新增看診', 'Add an appointment')}</p>
      <label class="flabel" for="visit-place">醫院或診所 <span class="en" lang="en">Hospital or clinic</span></label>
      <input class="in" id="visit-place" maxlength="40" value="${dEsc(visitDraft.place)}" placeholder="例：花蓮慈濟醫院 心臟內科">
      <label class="flabel" for="visit-date">日期 <span class="en" lang="en">Date</span></label>
      <input class="in" id="visit-date" type="date" min="${dToday()}" value="${visitDraft.date}">
      <label class="flabel" for="visit-time">時間 <span class="en" lang="en">Time</span></label>
      <select class="in" id="visit-time">${times.map((t) => `<option${t === visitDraft.time ? ' selected' : ''}>${t}</option>`).join('')}</select>
      <label class="flabel" for="visit-note">備註 <span class="en" lang="en">Note</span></label>
      <input class="in" id="visit-note" maxlength="60" value="${dEsc(visitDraft.note)}" placeholder="例：帶健保卡、空腹 · e.g. bring NHI card">
      <p class="ferr" id="visit-err" role="alert" hidden></p>
      <button type="button" class="dbtn" data-d="visitAdd">${bi('新增', 'Add')}</button>
    </section>
    <p class="note-box">這是自己的紀錄和提醒，不會向醫院掛號。掛號請聯絡醫院。<br><span lang="en">This is your own record and reminder. It does not book with the hospital — contact the hospital to register.</span></p>`);
}

/* ---------- home-screen notice: the most urgent one ---------- */
function homeNotice() {
  const alert = (href, icon, zh, sub) => `
    <a class="ev-alert" href="${href}" data-say="${zh}">
      <span class="ev-bell" aria-hidden="true">${icon}</span>
      <span class="ev-alert-text"><span>${zh}</span><span class="en">${sub}</span></span>
    </a>`;
  const due = medsDue();
  if (due.length) return alert('#med-pills', '💊', `該吃藥了：${dEsc(due[0].m.name)}${due.length > 1 ? ` 等 ${due.length} 次` : ''}`, 'Time for your medicine');
  const v = getVisits().sort((a, b) => a.date.localeCompare(b.date))[0];
  if (v && daysUntil(v.date) <= 1) return alert('#med-visits', '🏥', `${whenText(daysUntil(v.date))[0]} ${v.time} 看診：${dEsc(v.place)}`, 'Appointment coming up');
  return evHomeNotice();
}

/* ---------- pages, events, timers ---------- */
const DAILY_PAGES = {
  'food-menu': renderMenu, 'food-water': renderWater, 'go-home': () => { if (currentView() !== 'go-home') homeEdit = false; renderGoHome(); },
  'body-walk': renderWalk, 'body-tips': renderTips, 'fun-music': renderMusic, 'fun-games': renderGame,
  'med-pills': renderPills, 'med-visits': renderVisits,
};

function readDrafts() {
  const v = (id) => { const el = document.getElementById(id); return el ? el.value : null; };
  if (v('med-name') !== null) medDraft.name = v('med-name');
  if (v('visit-place') !== null) visitDraft = { place: v('visit-place'), date: v('visit-date'), time: v('visit-time'), note: v('visit-note') };
}
const dErr = (id, zh, en) => { const el = document.getElementById(id); el.hidden = false; el.innerHTML = bi(zh, en); el.scrollIntoView({ block: 'center' }); };

document.addEventListener('click', (e) => {
  const card = e.target.closest('[data-card]');
  if (card) { flipCard(Number(card.dataset.card)); return; }
  const el = e.target.closest('[data-d]');
  if (!el || el.disabled) return;
  const d = el.dataset;
  readDrafts();
  switch (d.d) {
    case 'water+': { const w = getWater(); w.cups = Math.min(20, w.cups + 1); w.last = Date.now(); store.set('water', w); redraw(); break; }
    case 'water-': { const w = getWater(); w.cups = Math.max(0, w.cups - 1); store.set('water', w); redraw(); break; }
    case 'waterRemind': store.set('waterRemind', !store.get('waterRemind', true)); redraw(); break;
    case 'homeEdit': homeEdit = true; redraw(); break;
    case 'homeCancel': homeEdit = false; redraw(); break;
    case 'homeSave': saveHome(); break;
    case 'walk+': { const w = getWalks(); w[dToday()] = Math.min(600, (w[dToday()] || 0) + Number(d.n)); store.set('walks', w); redraw(); break; }
    case 'walk0': { const w = getWalks(); delete w[dToday()]; store.set('walks', w); redraw(); break; }
    case 'gameLevel': store.set('gameLevel', d.k); newGame(d.k); redraw(); break;
    case 'gameNew': newGame(game ? game.level : 'easy'); redraw(); break;
    case 'medSlot': medDraft.slots = medDraft.slots.includes(d.k) ? medDraft.slots.filter((s) => s !== d.k) : [...medDraft.slots, d.k]; redraw(); break;
    case 'medAdd': {
      const name = medDraft.name.trim();
      if (name.length < 1) { dErr('med-err', '請填藥名。', 'Please enter the name.'); break; }
      if (!medDraft.slots.length) { dErr('med-err', '請選至少一個時間。', 'Choose at least one time.'); break; }
      const slots = MED_SLOTS.map((s) => s[0]).filter((s) => medDraft.slots.includes(s));
      store.set('meds', [...getMeds(), { id: 'm' + Date.now().toString(36), name, slots }]);
      medDraft = { name: '', slots: ['am'] };
      showToast(`已新增：${name}\nAdded`); redraw(); break;
    }
    case 'medTick': { const t = getTaken(); if (t.done[d.k]) delete t.done[d.k]; else t.done[d.k] = Date.now(); store.set('medTaken', t); say(t.done[d.k] ? '已吃藥' : '取消'); redraw(); break; }
    case 'medDel': twoTap(el, bi('再按一次，確定刪除', 'Tap again to remove'), () => { store.set('meds', getMeds().filter((m) => m.id !== d.id)); redraw(); }); break;
    case 'visitAdd': {
      const place = visitDraft.place.trim();
      if (place.length < 2) { dErr('visit-err', '請填醫院或診所。', 'Please enter the hospital or clinic.'); break; }
      if (!visitDraft.date || visitDraft.date < dToday()) { dErr('visit-err', '請選今天或以後的日期。', 'Choose today or a later date.'); break; }
      store.set('visits', [...getVisits(), { id: 'v' + Date.now().toString(36), place, date: visitDraft.date, time: visitDraft.time, note: visitDraft.note.trim() }]);
      visitDraft = { place: '', date: '', time: '09:00', note: '' };
      showToast('已新增看診\nAppointment added'); redraw(); break;
    }
    case 'visitDel': twoTap(el, bi('再按一次，確定刪除', 'Tap again to remove'), () => { store.set('visits', getVisits().filter((v) => v.id !== d.id)); redraw(); }); break;
    default: break;
  }
});

// While the app is open: nudge to drink water, and keep the home notice fresh.
let waterNagAt = 0;
setInterval(() => {
  const hour = new Date().getHours(), w = getWater(), now = Date.now();
  if (store.get('waterRemind', true) && hour >= 7 && hour < 20 && w.cups < WATER_GOAL
      && now - Math.max(w.last, waterNagAt) > 2 * 3600e3 && (w.last || waterNagAt)) {
    waterNagAt = now;
    showToast('該喝水了 💧\nTime to drink some water'); say('該喝水了');
  }
  if (!waterNagAt) waterNagAt = now; // start counting from when the app opened
  if (currentView() === '' && !document.querySelector('.sheet-back')) {
    const cur = document.querySelector('.ev-alert');
    const next = homeNotice();
    if (Boolean(cur) !== Boolean(next) || (cur && !next.includes(cur.querySelector('.ev-alert-text span').textContent))) renderView();
  }
}, 60000);
