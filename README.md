# 生活助手 · Daily Life Helper

A simple, large-button web app for older adults, based on the 藥 食 行 育 樂 住 home screen.
Plain HTML/CSS/JavaScript — no build step, no dependencies.

## Look

Clean and flat, inspired by curated.supply: white cards on a soft grey background, round arrow buttons, a date pill with a green dot, outlined pill tabs, one tinted mark per section (colour only helps you recognise it), and a single strong colour, the red 119 emergency button, which stays on the home screen. Greeting with today's date (tap it to hear it). Dark mode follows the phone setting. Section colours live in `COLORS` at the top of `app.js`.

Motion: pages slide and fade between screens (direction follows forward / back), cards rise in once when the app opens, buttons ease down when pressed, the text size changes smoothly, product lists fade when you switch tabs, and the cart bar and quantity numbers pop when you add something. Everything is switched off automatically for people who turn on "reduce motion" on their phone.

## Features

- Six big categories on the home screen; each opens a page of large action buttons
- Chinese + English labels **inside** each button (the whole box is tappable)
- **A+** button: three text sizes, remembered on the phone
- **🔊** button: reads each button aloud in Mandarin (zh-TW) when tapped
- Working links: 119 emergency call, nearby pharmacy / restaurants / bus stops (Google Maps)
- Other buttons are placeholders that show "Coming soon"
- Phone Back button works; supports dark mode; can be added to the home screen

### 樂 Entertainment — 健康運動 & 有氧舞蹈 (`fun.js`)

From a friend's project 「樂・花蓮銀髮健康生活」, rebuilt in this app's style:

- **健康運動 Healthy exercise:** two playlists (銀髮族核心運動・老歌帶動跳, 高齡者居家自主運動) and three videos (全身伸展操, 下肢肌力訓練, 拍打經絡操).
- **有氧舞蹈 Aerobic dance:** five YouTube Shorts, including 長輩太極舞. YouTube titles were mostly hashtags, so each has a short name; the channel is shown on every card.
- Each video is a picture with a big ▶; the player loads only when tapped (lighter on phones), plays right in the page, and only one plays at a time. "在 YouTube 開啟" opens it in YouTube.
- A safety reminder sits at the top of both pages. Edit the lists in `EXERCISE_VIDEOS` / `DANCE_VIDEOS`.

### 日用品 Daily Supplies shop (wide tile at the bottom of the home screen)

- Search box plus 🎤 voice search in Mandarin (Chrome on Android; needs the https GitHub Pages link)
- Five category tabs that wrap instead of scrolling, so none are hidden
- 常用 / Essentials shows items marked `essential: true` in any category
- Big **＋ 加入 Add** button that turns into a − 2 ＋ quantity stepper
- Cart bar always visible at the bottom with item count and total
- Cart page: change amounts, clear cart, and **確認購買並通知家人 Buy and tell my family** (two taps)
- **Tell the family** (`notify.js`): after a purchase, a page lists the order and one big button per family
  member and channel — **WhatsApp** (`wa.me` link to their number), **Email** (`mailto:`) and **LINE**
  (LINE's share screen, where you pick who). Each opens the app with the message already written; the
  elder taps Send. Buttons are marked "✓ 已開啟" once opened. Recent purchases stay under the empty cart
  so a message can be sent later.
- **家人聯絡方式 Family contacts:** your name plus up to 4 family members (WhatsApp number such as
  0912 345 678, and/or email), checked before saving. Stored on this phone only.
- Sending with no tap at all would need the WhatsApp Business API and a LINE Official Account (both through
  a small server holding secret keys) and an email-sending service — not possible from the page alone.
- **No real ordering or payment.** Prices in `app.js` are sample numbers.
- Products live in the `PRODUCTS` list in `app.js`:

```js
{ id: 'towel', tab: 'bathroom', icon: '🛁', zh: '毛巾', en: 'Towel', price: 120, essential: false, keywords: '浴巾' }
```

### 住 Live / Reside — volunteer matching (Tzu Chi–inspired theme)

- **我需要志工 (elder side):** big-text form: job type (cooking / cleaning / neighbourhood walk), description, Hualien township + address, start time, hours, 1–6 people (− left, ＋ right), how long to keep the post. Expired posts are deleted automatically.
- **我想當志工 (volunteer side):** sign in, choose your township, see only that township's requests, take a job, tap Finish to earn **30 points per hour**. 中文 / EN toggle.
- **KindWorld features for volunteers** (`kindness.js`, menu on the 我想當志工 page):
  - **我的檔案 Profile & history:** hours, points, jobs done, badges, every finished job and redeemed reward.
  - **徽章 Badges:** 8 badges worked out from what you've done (first job, 3 cooking / cleaning / walks, 10 and 50 hours, 3 townships, 300 points), with progress bars. New ones are announced when you tap Finish.
  - **兌換禮物 Rewards:** spend points on sample rewards (`VOUCHERS`); two taps to confirm, and you get a code. Spending doesn't lower your lifetime points or rank.
  - **排行榜 Leaderboard:** ranked by hours, for your township or all of Hualien. With `config.js` filled in, each volunteer's public totals (name, township, hours, points, badge count — never the password) are shared through KindWorld's `legacy_blob` table, so every phone sees everyone.
  - **證書 Certificates:** Bronze 10 h, Silver 30 h, Gold 50 h, Lotus 100 h (`CERTS`); claim one when you reach the hours.
  - ⚠ Vouchers and certificates are prototype examples, not real coupons or official documents.
- **3D map of Hualien:** above the township buttons, a 3D map (`hualien-map.js`, three.js 0.160 from jsDelivr) shows all 13 townships as raised blocks with their real borders (`hualien-map-data.js`, generated from the Ministry of the Interior's 鄉鎮市區界線 via `taiwan-atlas`, MIT). Colours follow the landform: green for the Central Mountain Range, sand for the East Rift Valley, aqua for the coast. Tap a township on the map or its button — pointing at a button lifts it on the map with a name tag; picking one turns it blue, raises it and zooms in. Drag sideways to turn the map. Phones without 3D get the same map flat and tilted.
- **Google map for the address** (`address-map.js`): under the address box. Picking a township jumps the map straight to it; typing the address moves it to that spot (after a short pause). "在 Google 地圖打開" opens the same place in Google Maps.
  - **No key (default):** Google's embeddable map — works right away.
  - **With `GOOGLE_MAPS.key` in `config.js`:** the Maps JavaScript API — the township is outlined, and **double-clicking (double-tapping) the map fills in the street and house number** (and switches the township if needed). A single click does nothing, so moving the map never changes the address. If Google knows the street but not the number, the street is filled in and the cursor waits for the number. You can also drag the pin. Enable "Maps JavaScript API" and "Geocoding API" in Google Cloud, and restrict the key to `https://student135-git.github.io/*`. If Google rejects the key, the app falls back to the no-key map.
  - The exact spot (when known) is saved with the request, so volunteers get a **🧭 用 Google 地圖導航** button that opens directions, and elders get **在 Google 地圖看位置**.
- **我需要志工 lists only the signed-in account's posts.** Volunteers see every request under 我想當志工. Until `config.js` is filled in, the app says on these pages that posts stay on this phone.
- **Hualien only:** the place picker lists the 13 townships of 花蓮縣 north to south (`HL_TOWNS` in `volunteer.js`), each with a small north–south marker. Picking one is animated in 3D: tiles rise in like ridges, tilt toward you on hover, and the chosen one lifts and spins forward while the others sink back (switched off with "reduce motion").
- **Sharing through KindWorld:** fill in `config.js` with KindWorld's Supabase URL and *anon* key, and requests are saved to KindWorld's `missions` table, so every phone sees the same list. Each request is shaped like a KindWorld mission (category Community, region EA), so it also shows in the KindWorld app; people who join there count toward the 1–6 places. Our own fields (job type, address, who signed up) are in `data.elderApp`. The code is in `kindworld.js`. With `config.js` empty, everything stays on this phone, as before.
- **Still on each phone:** volunteer accounts and points. Demo requests only appear when `config.js` is empty.
- **Privacy note:** KindWorld's database currently lets anyone with the public key read and change missions, which includes elders' addresses. Fine for a class demo; lock it down before real use. Lotus is a simple original drawing, not Tzu Chi's logo.

## Put it on GitHub Pages

1. Create a new **public** repository on GitHub (e.g. `elder-app`).
2. Click **Add file → Upload files** and drag in all files:
   `index.html`, `styles.css`, `app.js`, `volunteer.js`, `kindness.js`, `hualien-map.js`, `hualien-map-data.js`, `address-map.js`, `config.js`, `kindworld.js`, `manifest.webmanifest`, `icon.svg`, `README.md`.
   Click **Commit changes**.
3. Go to **Settings → Pages**. Under *Build and deployment*, set
   **Source: Deploy from a branch**, **Branch: `main`**, folder **`/ (root)`**, then **Save**.
4. After a minute or two, your app is live at
   `https://<your-username>.github.io/<repo-name>/`
5. Open that link on an Android phone in Chrome → menu ⋮ → **Add to Home screen**.
   (iPhone: Safari → Share → **Add to Home Screen**.)

## Try it on your computer

Just double-click `index.html`. (The home-screen install only works from the GitHub Pages link.)

## Editing the content

All categories and buttons live in the `CATEGORIES` list at the top of `app.js`.
Each button looks like:

```js
{ icon: '💊', zh: '附近藥局', en: 'Nearby pharmacy', href: maps('藥局') }
```

- Add `href` to make it open a link (`tel:0912345678` calls a number).
- Leave out `href` and it shows "Coming soon".
- Add `danger: true` to make it red.
