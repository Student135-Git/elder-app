'use strict';

/* =========================================================
   KindWorld storage for 住 requests.
   Each request is one row in KindWorld's `missions` table
   ({ doc_id, data }), shaped like a KindWorld mission so it
   also shows in the KindWorld app. Our own fields live in
   data.elderApp. Talks to Supabase's REST API directly, so
   no library is needed.
   ========================================================= */
const kw = (() => {
  const on = Boolean(KINDWORLD.url && KINDWORLD.anonKey);
  const base = on ? KINDWORLD.url.replace(/\/+$/, '') + '/rest/v1/missions' : '';
  const headers = (extra = {}) => ({
    apikey: KINDWORLD.anonKey,
    Authorization: 'Bearer ' + KINDWORLD.anonKey,
    'Content-Type': 'application/json',
    ...extra,
  });

  async function req(url, opts = {}) {
    const r = await fetch(url, { ...opts, headers: headers(opts.headers) });
    if (!r.ok) throw new Error(`KindWorld ${r.status}`);
    const text = await r.text();
    return text ? JSON.parse(text) : null;
  }

  // '09:30' + 2 hours → '11:30'
  function endTime(start, hours) {
    const [h, m] = start.split(':').map(Number);
    const t = h * 60 + m + hours * 60;
    return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  }

  function toMission(j) {
    const zh = j.types.map((k) => JOB_TYPES[k].zh).join('、');
    const en = j.types.map((k) => JOB_TYPES[k].en).join(', ');
    const signed = j.taken.length + (j.extra || 0);
    return {
      id: Number(j.id),
      title: `${zh} ${en}・${j.city}`,
      description: j.desc || `${zh} ${en}`,
      location: `花蓮縣${j.city} ${cityLabel(j.city, 'en')}, Hualien`, // township only; the address stays in elderApp
      date: j.date,
      startTime: j.start,
      endTime: endTime(j.start, j.hours),
      hours: j.hours,
      participants: `${signed}/${j.people}`,
      maxParticipants: j.people,
      currentParticipants: signed,
      category: 'Community',
      difficulty: 'Easy',
      organizer: '生活助手 Elder Helper',
      image: '',
      joined: false,
      region: 'EA',
      country: 'TW',
      language: 'zh-TW',
      registrationDeadline: new Date(j.expires).toISOString(),
      source: 'elder-app',
      elderApp: {
        types: j.types, desc: j.desc, city: j.city, address: j.address, hours: j.hours, start: j.start,
        people: j.people, date: j.date, posted: j.posted, expires: j.expires, owner: j.owner, taken: j.taken,
      },
    };
  }

  function fromRow(row) {
    const d = row.data || {};
    const e = d.elderApp;
    if (!e || !Array.isArray(e.types) || !Array.isArray(e.taken)) return null;
    // People who joined from the KindWorld app count too.
    const extra = Math.max(0, (Number(d.currentParticipants) || 0) - e.taken.length);
    return { ...e, id: row.doc_id, extra };
  }

  return {
    on,
    async list() {
      const rows = await req(`${base}?select=doc_id,data&data->>source=eq.elder-app`);
      const now = Date.now();
      return (rows || []).map(fromRow).filter((j) => j && j.expires > now);
    },
    save(j) {
      return req(`${base}?on_conflict=doc_id`, {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ doc_id: String(j.id), data: toMission(j), updated_at: new Date().toISOString() }),
      });
    },
    remove(id) {
      return req(`${base}?doc_id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
    },
  };
})();
