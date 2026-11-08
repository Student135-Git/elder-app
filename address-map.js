'use strict';

/* =========================================================
   Google map under the address box (我需要志工 → 發佈).
   - Picking a township jumps the map straight to it.
   - Typing an address moves the map to that spot.
   Two levels:
   - No key (config.js empty): Google's embeddable map.
   - GOOGLE_MAPS.key set: the Maps JavaScript API, with the
     township outlined, a pin you can drag or tap, and the
     address filled in from where the pin is.
   ========================================================= */
const addrMap = (() => {
  const KEY = (typeof GOOGLE_MAPS !== 'undefined' && GOOGLE_MAPS.key) || '';
  let googleP = null;
  let keyBroken = false; // Google rejected the key → everyone falls back to the embed

  const full = (town, address) => `花蓮縣${town || ''}${address || ''}`;
  const searchURL = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

  // Zoom that fits a township: about 10 for 秀林鄉, 13 for 花蓮市.
  function townZoom(town) {
    const g = HL_GEO[town];
    if (!g) return 9;
    const span = Math.max(g.north - g.south, g.east - g.west);
    return Math.max(9, Math.min(14, Math.round(Math.log2(1.2 / span)) + 9));
  }

  /* ---------- level 1: embeddable map, no key ---------- */
  function embed(box, st) {
    const frame = document.createElement('iframe');
    frame.className = 'addr-frame';
    frame.title = '地圖 Map';
    frame.loading = 'lazy';
    frame.referrerPolicy = 'no-referrer-when-downgrade';
    box.appendChild(frame);
    let shown = '';
    const show = () => {
      const exact = st.address.trim().length >= 2;
      const q = st.town ? full(st.town, exact ? st.address.trim() : '') : '花蓮縣';
      const z = exact ? 17 : st.town ? townZoom(st.town) : 9;
      const src = `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=${z}&hl=zh-TW&output=embed`;
      if (src !== shown) { frame.src = src; shown = src; }
    };
    show();
    // Wait until typing pauses so the map doesn't reload on every key.
    let timer = 0;
    const update = (from) => {
      clearTimeout(timer);
      if (from === 'typing') timer = setTimeout(show, 900); else show();
    };
    return { update };
  }

  /* ---------- level 2: Maps JavaScript API ---------- */
  function loadGoogle() {
    if (window.google && window.google.maps && window.google.maps.Geocoder) return Promise.resolve(window.google.maps);
    if (googleP) return googleP;
    googleP = new Promise((resolve, reject) => {
      window.__hlMapsReady = () => resolve(window.google.maps);
      const s = document.createElement('script');
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(KEY)}&language=zh-TW&region=TW&loading=async&callback=__hlMapsReady`;
      s.async = true;
      s.onerror = () => { googleP = null; reject(new Error('Google Maps did not load')); };
      document.head.appendChild(s);
    });
    return googleP;
  }

  // Google calls this when the key is wrong or not allowed on this site.
  window.gm_authFailure = () => {
    keyBroken = true;
    document.querySelectorAll('.addr-map').forEach((b) => b._fallback && b._fallback());
  };

  // "973台灣花蓮縣吉安鄉中央路三段45號" → township 吉安鄉, address 中央路三段45號
  function splitAddress(formatted) {
    const text = formatted.replace(/^\d{3,6}/, '').replace(/^(台灣|臺灣|Taiwan,?\s*)/, '').replace(/^花蓮縣/, '');
    const town = HL_TOWNS.map(([zh]) => zh).find((t) => text.startsWith(t));
    return town ? { town, address: text.slice(town.length).trim() } : { town: null, address: text.trim() };
  }

  function live(maps, box, st, cb) {
    const div = document.createElement('div');
    div.className = 'addr-live';
    box.appendChild(div);
    const map = new maps.Map(div, {
      center: { lat: 23.75, lng: 121.4 }, zoom: 9,
      mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
      clickableIcons: false, gestureHandling: 'cooperative',
    });
    const geocoder = new maps.Geocoder();
    const marker = new maps.Marker({ map, draggable: true, visible: false, title: '拖曳到正確位置 Drag to the right spot' });
    let outline = null;

    // Outline the township; fit = also zoom the map to it.
    function focusTown(fit = true) {
      if (outline) outline.setMap(null);
      outline = null;
      const g = HL_GEO[st.town];
      if (!g) { if (fit) { map.setCenter({ lat: 23.75, lng: 121.4 }); map.setZoom(9); } return; }
      outline = new maps.Polygon({
        map, paths: HL_SHAPES[st.town].map((ring) => ring.map(HL_TO_LATLNG)),
        strokeColor: '#1D6FB8', strokeWeight: 2.5, fillColor: '#1D6FB8', fillOpacity: 0.08, clickable: false,
      });
      if (fit) map.fitBounds({ south: g.south, west: g.west, north: g.north, east: g.east }, 12);
    }

    function place(latLng, zoom) {
      marker.setPosition(latLng);
      marker.setVisible(true);
      map.panTo(latLng);
      if (zoom) map.setZoom(zoom);
    }

    // Pin moved by hand → work out the address and township from it.
    function fromPin(latLng) {
      place(latLng);
      const ll = { lat: latLng.lat(), lng: latLng.lng() };
      geocoder.geocode({ location: ll, language: 'zh-TW' }, (res, status) => {
        if (status !== 'OK' || !res || !res[0]) { cb.onPin(null, null, ll); return; }
        const { town, address } = splitAddress(res[0].formatted_address);
        cb.onPin(town, address, ll);
      });
    }
    marker.addListener('dragend', (e) => fromPin(e.latLng));
    map.addListener('click', (e) => fromPin(e.latLng));

    // Typed address → find it inside the chosen township.
    let timer = 0, asked = '';
    function findTyped() {
      const text = st.address.trim();
      if (!st.town || text.length < 2) return;
      const q = full(st.town, text);
      if (q === asked) return;
      asked = q;
      const g = HL_GEO[st.town];
      geocoder.geocode({ address: q, region: 'tw', bounds: { south: g.south, west: g.west, north: g.north, east: g.east } }, (res, status) => {
        if (status !== 'OK' || !res || !res[0]) return;
        const loc = res[0].geometry.location;
        place(loc, 17);
        cb.onFound({ lat: loc.lat(), lng: loc.lng() });
      });
    }

    let lastTown = null;
    function update(from) {
      if (st.town !== lastTown) { lastTown = st.town; marker.setVisible(false); asked = ''; focusTown(); }
      if (from === 'typing') { clearTimeout(timer); timer = setTimeout(findTyped, 900); } else findTyped();
      if (st.lat != null && from === 'init') place({ lat: st.lat, lng: st.lng }, 17);
    }
    update('init');
    // The pin landed in another township: outline that one, but keep the view on the pin.
    const adopt = () => { lastTown = st.town; asked = ''; focusTown(false); };
    return { update, adopt };
  }

  /* ---------- mount ---------- */
  // cb.onPin(town, address, {lat,lng}) when the pin is moved by hand (level 2 only)
  // cb.onFound({lat,lng}) when a typed address was found (level 2 only)
  function mount(box, start, cb) {
    const st = { town: start.town || '', address: start.address || '', lat: start.lat, lng: start.lng };
    const open = box.parentElement.querySelector('.addr-open');
    const tip = box.parentElement.querySelector('.addr-tip');
    // The hint matches the map that is actually showing.
    const setTip = (pin) => {
      if (tip) tip.innerHTML = pin
        ? B('可以拖曳紅色圖釘，或點地圖上的位置，地址會自動填好。', 'Drag the red pin or tap the map, and the address fills in for you.')
        : B('選好鄉鎮、打好地址，地圖會自動移過去。', 'Pick the township and type the address — the map moves there.');
    };
    const refreshLink = () => { if (open) open.href = searchURL(full(st.town, st.address.trim())); };
    let view = null;

    const useEmbed = () => {
      box.querySelectorAll('.addr-live').forEach((n) => n.remove());
      if (!box.querySelector('.addr-frame')) view = embed(box, st);
      box.classList.remove('is-live');
      setTip(false);
    };
    box._fallback = useEmbed;

    if (KEY && !keyBroken) {
      setTip(false); // until the full map is ready
      box.classList.add('is-loading');
      loadGoogle()
        .then((maps) => {
          box.classList.remove('is-loading');
          if (!box.isConnected || keyBroken) { if (keyBroken) useEmbed(); return; }
          view = live(maps, box, st, {
            onPin(town, address, ll) {
              if (address) st.address = address;
              st.lat = ll.lat; st.lng = ll.lng;
              refreshLink();
              cb.onPin(town, address, ll);
            },
            onFound: cb.onFound,
          });
          box.classList.add('is-live');
          setTip(true);
        })
        .catch(() => { box.classList.remove('is-loading'); useEmbed(); });
    } else {
      useEmbed();
    }
    refreshLink();

    return {
      setTown(town) { st.town = town; st.lat = st.lng = null; refreshLink(); if (view) view.update('town'); },
      setAddress(text) { st.address = text; st.lat = st.lng = null; refreshLink(); if (view) view.update('typing'); },
      adoptTown(town) { st.town = town; refreshLink(); if (view && view.adopt) view.adopt(); },
    };
  }

  return { mount, searchURL, full };
})();

// Directions to a job for the volunteer (exact pin when we have one).
function navURL(s) {
  const dest = s.lat != null ? `${s.lat},${s.lng}` : addrMap.full(s.city, s.address);
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
}
