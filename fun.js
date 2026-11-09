'use strict';

/* =========================================================
   樂 Entertainment → 健康運動 (healthy exercise) and 有氧舞蹈
   (aerobic dance). Video picks come from a friend's project
   「樂・花蓮銀髮健康生活」; titles and channels checked on YouTube.
   Videos show as a picture with a big ▶ — the player loads only
   when tapped, and only one plays at a time.
   ========================================================= */

const EXERCISE_VIDEOS = [
  { list: 'PLxkgdAtrqsEXcuYBup6bvgNPmO9d2tvlb', thumb: 'CLHN-NwLH40', zh: '銀髮族核心運動・老歌帶動跳', en: 'Core exercise to classic songs', by: '長照2.0銀髮族健康促進' },
  { list: 'PLHPuO02YTZeeJvn-k8V5fRRGVcVjQKbOl', thumb: '7pIeSsndwbA', zh: '高齡者居家自主運動', en: 'Exercise at home for older adults', by: '臺灣ONWF歐樂福' },
  { id: 'zF_2-21l0cw', zh: '全身伸展操（12 分鐘）', en: 'Full-body stretching, 12 minutes', by: '北木健身' },
  { id: 'nbgF_8kinjg', zh: '下肢肌力訓練（初學者）', en: 'Leg strength for beginners', by: '北木健身' },
  { id: 'kyXUfFEry9Y', zh: '拍打經絡操（28 節）', en: 'Tapping exercise, 28 moves', by: '興寶健身舞' },
];

// YouTube Shorts — tall videos.
const DANCE_VIDEOS = [
  { id: 'E7MAStE2MKc', zh: '中老年健身操', en: 'Aerobics for older adults', by: '健康來敲門' },
  { id: 'pW9L62i4SeE', zh: '長輩太極舞', en: 'Tai Chi dance for seniors', by: 'Tai Chi for Beginners' },
  { id: 'giCOFJiKsds', zh: '正能量有氧操', en: 'Upbeat aerobics', by: '燕子健身' },
  { id: 'JZO257SxBjg', zh: '人人都能跳的有氧操', en: 'Aerobics anyone can do', by: '小馬達健身燃脂' },
  { id: 'IjX2pE1Z_Pw', zh: '有氧健身操完整版', en: 'Full aerobics routine', by: '小馬達健身燃脂' },
];

const ytThumb = (v, tall) => `https://i.ytimg.com/vi/${v.id || v.thumb}/${tall ? 'hq2' : 'hqdefault'}.jpg`;
const ytOpen = (v, tall) => v.list
  ? `https://www.youtube.com/playlist?list=${v.list}`
  : tall ? `https://www.youtube.com/shorts/${v.id}` : `https://youtu.be/${v.id}`;
const ytEmbed = (v) => (v.list
  ? `https://www.youtube-nocookie.com/embed/videoseries?list=${v.list}&autoplay=1&rel=0&playsinline=1`
  : `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0&playsinline=1`);

function posterHTML(v, tall) {
  return `
    <button type="button" class="vid-play" data-ytplay aria-label="播放 ${v.zh} Play ${v.en}">
      <img src="${ytThumb(v, tall)}" alt="" loading="lazy" decoding="async">
      <span class="vid-btn" aria-hidden="true">▶</span>
      ${v.list ? '<span class="vid-badge" aria-hidden="true">≡ 播放清單 Playlist</span>' : ''}
    </button>`;
}

function videoCard(v, i, tall) {
  return `
    <article class="vid${tall ? ' tall' : ''}" style="--i:${i}" data-v="${i}">
      <div class="vid-media">${posterHTML(v, tall)}</div>
      <div class="vid-text">
        <h3>${v.zh}</h3>
        <p class="en" lang="en">${v.en}</p>
        <p class="vid-by">${v.by}</p>
      </div>
      <a class="vid-yt" href="${ytOpen(v, tall)}" target="_blank" rel="noopener">在 YouTube 開啟 <span class="en" lang="en">Open in YouTube</span> ↗</a>
    </article>`;
}

const SAFETY = `
  <p class="note-box fun-note"><strong>溫馨提醒</strong>：依照自己的身體狀況調整速度；如果不舒服，請先休息。影片需要網路。<br>
  <span lang="en"><strong>Take care:</strong> go at your own pace and rest if you feel unwell. Videos need the internet.</span></p>`;

function renderVideoPage(kind) {
  const dance = kind === 'dance';
  const list = dance ? DANCE_VIDEOS : EXERCISE_VIDEOS;
  setHeader(dance ? '有氧舞蹈' : '健康運動', true, 'fun', 'fun');
  app.className = '';
  app.innerHTML = `
    ${dance ? pageHead('💃', '有氧舞蹈', 'Aerobic dance') : pageHead('🌿', '健康運動', 'Healthy exercise')}
    ${SAFETY}
    <p class="note fun-hint">按 ▶ 就在這裡播放。<br><span lang="en">Tap ▶ to play it right here.</span></p>
    <div class="vids${dance ? ' tall' : ''}" data-kind="${kind}">
      ${list.map((v, i) => videoCard(v, i, dance)).join('')}
    </div>`;
  titleEl.focus({ preventScroll: true });
}

// Put a playing video back to its picture (this also stops the sound).
function stopVideo(card) {
  const kind = card.closest('.vids').dataset.kind;
  const v = (kind === 'dance' ? DANCE_VIDEOS : EXERCISE_VIDEOS)[Number(card.dataset.v)];
  card.classList.remove('playing');
  card.querySelector('.vid-media').innerHTML = posterHTML(v, kind === 'dance');
}

function playVideo(btn) {
  const card = btn.closest('.vid');
  const kind = card.closest('.vids').dataset.kind;
  const v = (kind === 'dance' ? DANCE_VIDEOS : EXERCISE_VIDEOS)[Number(card.dataset.v)];
  document.querySelectorAll('.vid.playing').forEach((c) => { if (c !== card) stopVideo(c); });
  if (canSpeak) speechSynthesis.cancel(); // don't talk over the video
  card.classList.add('playing');
  card.querySelector('.vid-media').innerHTML = `
    <iframe src="${ytEmbed(v)}" title="${v.zh} ${v.en}"
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen
      referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  card.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-ytplay]');
  if (b) playVideo(b);
});
