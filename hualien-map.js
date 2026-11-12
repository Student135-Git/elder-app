'use strict';

/* =========================================================
   3D map of 花蓮縣 for the township picker.
   Each of the 13 townships is its own raised block built from
   the real boundaries in hualien-map-data.js. Tap a township on
   the map or its button below — both pick the same thing.
   - The flat, tilted SVG version shows first (and stays if 3D
     can't run); three.js then swaps in the real 3D map.
   - Any <div class="hl-map"> added to the page mounts itself.
   ========================================================= */
const hlMap = (() => {
  const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
  const NAMES = HL_TOWNS.map(([zh]) => zh); // north → south
  const EN = Object.fromEntries(HL_TOWNS);
  const DEPTH = 2.4; // km of block height before lifting
  let threeP = null;

  // Bounds of the whole county, in km.
  const all = Object.values(HL_SHAPES).flat(2);
  const B = {
    x0: Math.min(...all.map((p) => p[0])), x1: Math.max(...all.map((p) => p[0])),
    y0: Math.min(...all.map((p) => p[1])), y1: Math.max(...all.map((p) => p[1])),
  };

  // Area-weighted centre of a township's outline (where its name tag sits).
  function centroid(ring) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const f = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
      a += f; cx += (ring[j][0] + ring[i][0]) * f; cy += (ring[j][1] + ring[i][1]) * f;
    }
    return a ? [cx / (3 * a), cy / (3 * a)] : ring[0];
  }
  const CENTRES = Object.fromEntries(NAMES.map((n) => [n, centroid(HL_SHAPES[n][0])]));

  // Coloured by landform — Central Mountain Range (green), East Rift Valley (sand),
  // coast (aqua) — with neighbours in different shades so every border reads.
  const LAND = {
    秀林鄉: ['mountain', '#86B98F'], 萬榮鄉: ['mountain', '#A3CC9B'], 卓溪鄉: ['mountain', '#7AAE88'],
    吉安鄉: ['valley', '#E6D3A3'], 壽豐鄉: ['valley', '#F1E3BC'], 鳳林鎮: ['valley', '#E2CC95'],
    光復鄉: ['valley', '#F1E3BC'], 瑞穗鄉: ['valley', '#E2CC95'], 玉里鎮: ['valley', '#F1E3BC'], 富里鄉: ['valley', '#E2CC95'],
    新城鄉: ['coast', '#8CCBD8'], 花蓮市: ['coast', '#6FB9CB'], 豐濱鄉: ['coast', '#9BD3DE'],
  };
  const baseColor = (i) => LAND[NAMES[i]][1];
  const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function tagHTML(name) {
    return `<b>${name}</b><span lang="en">${EN[name]}</span>`;
  }

  /* ---------- flat, tilted SVG map (first paint and fallback) ---------- */
  function flatMap(box, state) {
    const pad = 2;
    const w = B.x1 - B.x0 + pad * 2, h = B.y1 - B.y0 + pad * 2;
    const pt = ([x, y]) => `${(x - B.x0 + pad).toFixed(2)},${(B.y1 - y + pad).toFixed(2)}`;
    const paths = NAMES.map((n, i) => {
      const d = HL_SHAPES[n].map((r) => 'M' + r.map(pt).join('L') + 'Z').join('');
      return `<path d="${d}" data-c="${n}" style="--fill:${baseColor(i)};--i:${i}"></path>`;
    }).join('');
    box.insertAdjacentHTML('beforeend', `<svg class="hl-flat" viewBox="0 0 ${w.toFixed(1)} ${h.toFixed(1)}" preserveAspectRatio="xMidYMid meet" focusable="false">${paths}</svg>`);
    const svg = box.querySelector('.hl-flat');
    const paint = () => svg.querySelectorAll('path').forEach((p) => {
      p.classList.toggle('on', p.dataset.c === state.selected);
      p.classList.toggle('hover', p.dataset.c === state.hover);
    });
    svg.addEventListener('click', (e) => { const p = e.target.closest('path'); if (p) state.onTap(p.dataset.c); });
    svg.addEventListener('pointerover', (e) => { const p = e.target.closest('path'); state.hover = p ? p.dataset.c : null; paint(); });
    svg.addEventListener('pointerleave', () => { state.hover = null; paint(); });
    paint();
    return { svg, paint };
  }

  /* ---------- real 3D map (three.js) ---------- */
  function webglOK() {
    try { const c = document.createElement('canvas'); return Boolean(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
  }

  function build3D(THREE, box, state, flat) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const canvas = renderer.domElement;
    canvas.className = 'hl-canvas';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 1, 2000);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9fb3c8, 2.1));
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(-60, 140, 90); // light from the north-west, like a relief map
    scene.add(sun);

    // The map lies flat (shape y = north → away from the camera) and stays still:
    // it never turns or sways, only the townships rise and the camera moves in on a pick.
    const map = new THREE.Group();
    map.rotation.x = -Math.PI / 2;
    scene.add(map);

    const blocks = NAMES.map((name, i) => {
      const [outer, ...holes] = HL_SHAPES[name];
      const shape = new THREE.Shape(outer.map(([x, y]) => new THREE.Vector2(x, y)));
      holes.forEach((h) => shape.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y)))));
      const geo = new THREE.ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.25, bevelSize: 0.25, bevelSegments: 2, curveSegments: 1 });
      const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(baseColor(i)), roughness: 0.62, metalness: 0.05, emissive: 0x1d6fb8, emissiveIntensity: 0 });
      const mesh = new THREE.Mesh(geo, mat);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 35), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }));
      mesh.add(edges);
      mesh.userData.name = name;
      map.add(mesh);
      const still = reduce();
      return {
        name, i, mesh, mat, base: new THREE.Color(baseColor(i)),
        h: still ? 1 : 0.02, lift: 0, glow: 0, // current
        start: performance.now() + (still ? 0 : 120 + i * 70), // rise one by one, north → south
      };
    });
    const byName = Object.fromEntries(blocks.map((b) => [b.name, b]));
    const SELECTED = new THREE.Color('#0E5296'); // a shade deeper than the app blue; the lights brighten it
    const DIM = new THREE.Color('#9aa6b2');

    // Camera: tilted view from the south; distance fitted to the box each resize.
    const focus = new THREE.Vector3(0, 0, 4);
    const camAim = focus.clone();
    let fitDist = 220;
    function fit() {
      const w = box.clientWidth || 300, h = box.clientHeight || 300;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const corners = [];
      [B.x0, B.x1].forEach((x) => [B.y0, B.y1].forEach((y) => [0, DEPTH * 3].forEach((z) => corners.push(new THREE.Vector3(x, z, -y)))));
      const dir = new THREE.Vector3(0, Math.sin(0.92), Math.cos(0.92)); // ~53° above the horizon
      let d = 220;
      for (let k = 0; k < 4; k++) {
        camera.position.copy(focus).addScaledVector(dir, d);
        camera.lookAt(focus);
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld();
        const ext = Math.max(...corners.map((c) => { const p = c.clone().project(camera); return Math.max(Math.abs(p.x), Math.abs(p.y)); }));
        d *= ext / 0.92;
      }
      fitDist = d;
    }
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);

    // Pointer: tap picks, mouse hover previews.
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const hit = (e) => {
      const r = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const h = ray.intersectObjects(blocks.map((b) => b.mesh), false)[0];
      return h ? h.object.userData.name : null;
    };
    let down = null;
    canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const n = hit(e);
      if (n !== state.hover) { state.hover = n; canvas.style.cursor = n ? 'pointer' : ''; }
    });
    const up = (e) => {
      // A tap is a press and release in about the same place (not a scroll or a swipe).
      const still = down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 12;
      if (still && e.type === 'pointerup') { const n = hit(e); if (n) state.onTap(n); }
      down = null;
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', () => { if (state.hover) state.hover = null; canvas.style.cursor = ''; });

    // Name tag that follows the hovered / selected township.
    const tag = document.createElement('div');
    tag.className = 'hl-tag';
    tag.setAttribute('aria-hidden', 'true');
    box.appendChild(tag);
    let tagFor = null;
    const v = new THREE.Vector3();

    let raf = 0, last = performance.now();
    function frame(now) {
      if (!box.isConnected) { dispose(); return; }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const k = (speed) => (reduce() ? 1 : 1 - Math.exp(-dt * speed));

      blocks.forEach((b) => {
        const sel = b.name === state.selected, hov = b.name === state.hover;
        const grown = now >= b.start;
        const hGoal = !grown ? 0.02 : sel ? (state.picked ? 2.6 : 1.9) : hov ? 1.35 : 1;
        const liftGoal = sel ? (state.picked ? 3.2 : 1.6) : hov ? 0.8 : 0;
        b.h += (hGoal - b.h) * k(grown && b.h < 0.98 && !sel && !hov ? 6 : 9);
        b.lift += (liftGoal - b.lift) * k(9);
        b.mesh.scale.z = Math.max(0.02, b.h);
        b.mesh.position.z = b.lift;
        const goal = sel ? SELECTED : state.selected && state.picked ? b.base.clone().lerp(DIM, 0.45) : b.base;
        b.mat.color.lerp(goal, k(8));
        b.glow += ((sel ? (state.picked ? 0.4 + Math.sin(now / 120) * 0.15 : 0.12) : hov ? 0.18 : 0) - b.glow) * k(10);
        b.mat.emissiveIntensity = b.glow;
      });

      // Ease the camera toward the selected township once it is picked.
      const s = state.picked && byName[state.selected];
      const [cx, cy] = s ? CENTRES[s.name] : [0, 4];
      const aimGoal = s ? new THREE.Vector3(cx, 0, -cy) : focus;
      camAim.lerp(aimGoal, k(4));
      const dist = s ? fitDist * 0.78 : fitDist;
      const dir = new THREE.Vector3(0, Math.sin(0.92), Math.cos(0.92));
      const want = camAim.clone().addScaledVector(dir, dist);
      camera.position.lerp(want, k(4));
      camera.lookAt(camAim);

      renderer.render(scene, camera);

      // Tag position: top of the township's centre.
      const name = state.hover || state.selected;
      if (name) {
        const b = byName[name];
        const [x, y] = CENTRES[name];
        v.set(x, y, DEPTH * b.h + b.lift + 0.6);
        map.localToWorld(v);
        v.project(camera);
        if (tagFor !== name) { tag.innerHTML = tagHTML(name); tagFor = name; }
        tag.style.transform = `translate(${((v.x + 1) / 2) * box.clientWidth}px, ${((1 - v.y) / 2) * box.clientHeight}px) translate(-50%, calc(-100% - 6px))`;
        tag.classList.add('show');
        tag.classList.toggle('sel', name === state.selected);
      } else {
        tag.classList.remove('show');
      }
      raf = requestAnimationFrame(frame);
    }

    function dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      blocks.forEach((b) => { b.mesh.geometry.dispose(); b.mat.dispose(); b.mesh.children.forEach((c) => { c.geometry.dispose(); c.material.dispose(); }); });
      renderer.dispose();
      renderer.forceContextLoss(); // phones only allow a few 3D canvases at once
    }

    box.insertBefore(canvas, flat.svg);
    box.classList.add('is-3d');
    raf = requestAnimationFrame(frame);
  }

  function mount(box) {
    if (box._map) return box._map;
    const state = {
      selected: box.dataset.current || null, hover: null, picked: false,
      onTap: (name) => {
        const tile = box.closest('.picker')?.querySelector(`.town[data-c="${name}"]`);
        if (tile) tile.click();
      },
    };
    const flat = flatMap(box, state);
    const api = {
      preview(name) { state.hover = name; flat.paint(); },
      pick(name) { state.selected = name; state.picked = true; flat.paint(); },
    };
    box._map = api;
    if (webglOK()) {
      threeP = threeP || import(THREE_URL);
      threeP.then((THREE) => { if (box.isConnected) build3D(THREE, box, state, flat); })
        .catch(() => { threeP = null; }); // stay on the flat map; try again next time
    }
    return api;
  }

  // Mount every map that appears, whichever page or sheet adds it.
  new MutationObserver((list) => {
    list.forEach((m) => m.addedNodes.forEach((n) => {
      if (n.nodeType !== 1) return;
      if (n.matches('.hl-map')) mount(n);
      n.querySelectorAll('.hl-map').forEach(mount);
    }));
  }).observe(document.body, { childList: true, subtree: true });

  return { mount };
})();
