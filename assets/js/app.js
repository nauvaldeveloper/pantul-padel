/* =========================================================
   PANTUL PADEL — papan jadwal, tiket booking, main bareng
   ========================================================= */
(function () {
  'use strict';
  const D = window.PADEL;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rp = (n) => 'Rp' + Math.round(n).toLocaleString('id-ID');
  const rk = (n) => (n / 1000).toLocaleString('id-ID') + 'k';
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const dOf = (s) => new Date(s + 'T00:00');
  const courtOf = (id) => D.COURTS.find((c) => c.id === id);
  const HOURS = Array.from({ length: D.CLOSE - D.OPEN }, (_, i) => D.OPEN + i);
  const validWa = (v) => /^(\+?62|0)8\d{7,12}$/.test(v.replace(/[\s-]/g, ''));
  const longDay = (s) => dOf(s).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });

  function seeded(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; }

  /* ---------------- pricing & availability ---------------- */
  const weekend = (day) => [0, 6].includes(dOf(day).getDay());
  function band(day, h) { const wk = weekend(day); return D.BANDS.find((b) => (b.days === 'Sab–Min') === wk && h >= b.from && h < b.to); }
  const price = (court, day, h) => band(day, h).price - (courtOf(court).discount || 0);
  function busy(court, day, h) {
    const b = band(day, h).id, base = { pagi: .25, prime: .7, wkpagi: .55, wk: .72 }[b];
    return seeded(court + day + h) < base;
  }
  // main bareng: beberapa slot kosong yang dibuka pemain lain
  const matchCache = new Map();
  function matchAt(court, day, h) {
    const key = court + day + h;
    if (matchCache.has(key)) return matchCache.get(key);
    let m = null;
    if (!busy(court, day, h) && seeded('m' + key) < .07) {
      const joined = 2 + Math.floor(seeded('j' + key) * 2);
      m = { court, day, h, joined, level: D.LEVELS[Math.floor(seeded('l' + key) * D.LEVELS.length)], host: D.HOSTS[Math.floor(seeded('h' + key) * D.HOSTS.length)] };
    }
    matchCache.set(key, m); return m;
  }
  function past(day, h) { const now = new Date(); if (day !== iso(now)) return dOf(day) < dOf(iso(now)); return h <= now.getHours(); }
  const free = (c, day, h) => h < D.CLOSE && !busy(c, day, h) && !matchAt(c, day, h) && !past(day, h);

  /* ---------------- state ---------------- */
  const days = (() => { const d0 = new Date(); d0.setHours(0, 0, 0, 0); return Array.from({ length: D.DAYS_AHEAD }, (_, i) => { const d = new Date(d0); d.setDate(d0.getDate() + i); return iso(d); }); })();
  const st = { day: days[0], sel: null, racket: 0, balls: 0, join: null, slots: 1, name: '', wa: '', sent: '' };

  /* ---------------- render: days & board ---------------- */
  function renderDays() {
    $('#days').innerHTML = days.map((d, i) => `<button type="button" class="day" role="tab" data-day="${d}" aria-selected="${d === st.day}"><small>${i === 0 ? 'Hari ini' : dOf(d).toLocaleDateString('id-ID', { weekday: 'short' })}</small><b>${dOf(d).getDate()}</b><small>${dOf(d).toLocaleDateString('id-ID', { month: 'short' })}</small></button>`).join('');
  }
  function renderBoard() {
    let html = '<div class="bh"></div>' + D.COURTS.map((c) => `<div class="bh"><b>${esc(c.name)}</b><small>${esc(c.type)}</small></div>`).join('');
    for (const h of HOURS) {
      html += `<div class="bt">${pad(h)}</div>`;
      for (const c of D.COURTS) {
        const m = matchAt(c.id, st.day, h), b = busy(c.id, st.day, h), p = past(st.day, h);
        const sel = st.sel && st.sel.court === c.id && h >= st.sel.h && h < st.sel.h + st.sel.dur;
        const joinSel = st.join && st.join.court === c.id && st.join.h === h && st.join.day === st.day;
        let cls = 'cell', body = `<span class="p">${rk(price(c.id, st.day, h))}</span>`, dis = '', label = `${c.name} ${pad(h)}.00`;
        if (p) { cls += ' cell--past'; dis = 'disabled'; label += ' sudah lewat'; body = ''; }
        else if (b) { cls += ' cell--busy'; dis = 'disabled'; body = 'Terisi'; label += ' terisi'; }
        else if (m) { cls += ' cell--match'; body = `<b>Bareng</b><span class="p">${m.joined}/${D.PLAYERS} · ${m.level}</span>`; label += ` main bareng, butuh ${D.PLAYERS - m.joined} pemain`; }
        else label += ` kosong, ${rp(price(c.id, st.day, h))}`;
        if (sel || joinSel) cls += ' cell--sel';
        html += `<button type="button" class="${cls}" data-c="${c.id}" data-h="${h}" ${dis} aria-label="${esc(label)}" aria-pressed="${!!(sel || joinSel)}">${body}</button>`;
      }
    }
    $('#board').innerHTML = html;
  }

  /* ---------------- ticket ---------------- */
  function bookingTotal() {
    const s = st.sel; let court = 0;
    for (let i = 0; i < s.dur; i++) court += price(s.court, st.day, s.h + i);
    const add = st.racket * D.ADDONS.racket.price + st.balls * D.ADDONS.balls.price;
    return { court, add, total: court + add };
  }
  function keep() { if ($('#tName')) { st.name = $('#tName').value.trim(); st.wa = $('#tWa').value.trim(); } }
  const formHTML = (btn) => `<div class="fields"><input id="tName" placeholder="Nama" autocomplete="name" value="${esc(st.name)}" /><input id="tWa" placeholder="No. WhatsApp" inputmode="tel" autocomplete="tel" value="${esc(st.wa)}" /></div><p class="err" id="tErr" hidden></p><button type="button" class="go" id="tGo">${btn}</button>`;

  function renderTicket() {
    const t = $('#ticket'), body = $('#ticketBody');
    const active = !!(st.sel || st.join);
    t.classList.toggle('open', active);
    if (st.sent) {
      body.innerHTML = `<p class="t-label">Mode demo · pesan untuk admin</p><div class="wa"><div>${esc(st.sent)}</div></div><button type="button" class="ghost" id="tEdit">Ubah</button>`; return;
    }
    if (st.join) {
      const m = st.join, c = courtOf(m.court), per = Math.round(price(m.court, m.day, m.h) / D.PLAYERS);
      const max = D.PLAYERS - m.joined;
      body.innerHTML = `<p class="t-label">Main bareng · ${esc(m.level)}</p>
        <p class="t-title">${esc(c.name)} · ${pad(m.h)}.00</p><p class="t-sub">${longDay(m.day)} · dibuka ${esc(m.host)}</p>
        <div class="players">${Array.from({ length: D.PLAYERS }, (_, i) => i < m.joined ? `<i>${i === 0 ? esc(m.host[0]) : '✓'}</i>` : '<i class="open">+</i>').join('')}</div>
        <hr class="t-cut" />
        <div class="t-row"><span>Ikut sebanyak</span><div class="seg">${Array.from({ length: max }, (_, i) => `<button type="button" data-slots="${i + 1}" aria-pressed="${st.slots === i + 1}">${i + 1} orang</button>`).join('')}</div></div>
        <div class="t-row"><span>Bagian per orang</span><b class="num">${rp(per)}</b></div>
        <div class="t-total"><span class="t-label">Kamu bayar</span><b>${rp(per * st.slots)}</b></div>
        <hr class="t-cut" />${formHTML('Ikut main via WhatsApp')}`;
      return;
    }
    if (!st.sel) {
      body.innerHTML = `<p class="t-label">Tiket</p><p class="t-title">Belum ada jam</p><p class="t-empty">Tap kotak <b>kosong</b> di papan untuk booking satu lapangan, atau kotak <b>Bareng</b> untuk ikut main dengan pemain lain.</p>`; return;
    }
    const s = st.sel, c = courtOf(s.court), q = bookingTotal();
    const canTwo = free(s.court, st.day, s.h + 1) && s.h + 2 <= D.CLOSE;
    body.innerHTML = `<p class="t-label">Booking lapangan</p>
      <p class="t-title">${esc(c.name)} · ${pad(s.h)}.00–${pad(s.h + s.dur)}.00</p><p class="t-sub">${longDay(st.day)} · ${esc(c.type)}</p>
      <hr class="t-cut" />
      <div class="t-row"><span>Durasi</span><div class="seg"><button type="button" data-dur="1" aria-pressed="${s.dur === 1}">1 jam</button><button type="button" data-dur="2" aria-pressed="${s.dur === 2}" ${canTwo || s.dur === 2 ? '' : 'disabled'}>2 jam</button></div></div>
      <div class="t-row"><span>${D.ADDONS.racket.label} · ${rk(D.ADDONS.racket.price)}</span><div class="step"><button type="button" data-add="racket" data-d="-1" ${st.racket ? '' : 'disabled'} aria-label="Kurangi raket">−</button><b>${st.racket}</b><button type="button" data-add="racket" data-d="1" ${st.racket < D.ADDONS.racket.max ? '' : 'disabled'} aria-label="Tambah raket">+</button></div></div>
      <div class="t-row"><span>${D.ADDONS.balls.label} · ${rk(D.ADDONS.balls.price)}</span><div class="step"><button type="button" data-add="balls" data-d="-1" ${st.balls ? '' : 'disabled'} aria-label="Kurangi bola">−</button><b>${st.balls}</b><button type="button" data-add="balls" data-d="1" ${st.balls < D.ADDONS.balls.max ? '' : 'disabled'} aria-label="Tambah bola">+</button></div></div>
      <hr class="t-cut" />
      <div class="t-row"><span>Lapangan</span><b class="num">${rp(q.court)}</b></div>
      ${q.add ? `<div class="t-row"><span>Raket &amp; bola</span><b class="num">${rp(q.add)}</b></div>` : ''}
      <div class="t-total"><span class="t-label">Total</span><b>${rp(q.total)}</b></div>
      <div class="t-split"><span>Patungan ${D.PLAYERS} orang</span><b>${rp(Math.ceil(q.total / D.PLAYERS / 500) * 500)} / orang</b></div>
      ${formHTML('Booking via WhatsApp')}`;
  }

  function message() {
    if (st.join) {
      const m = st.join, c = courtOf(m.court), per = Math.round(price(m.court, m.day, m.h) / D.PLAYERS);
      return [`Halo ${D.name}, saya mau ikut main bareng 🎾`, '', `${c.name} · ${longDay(m.day)}, ${pad(m.h)}.00–${pad(m.h + 1)}.00`, `Dibuka oleh: ${m.host} (${m.level})`, `Ikut: ${st.slots} orang × ${rp(per)} = ${rp(per * st.slots)}`, '', `Nama: ${st.name}`, `No. WA: ${st.wa}`].join('\n');
    }
    const s = st.sel, c = courtOf(s.court), q = bookingTotal();
    return [`Halo ${D.name}, saya mau booking lapangan 🎾`, '', `${c.name} (${c.type})`, `${longDay(st.day)}, ${pad(s.h)}.00–${pad(s.h + s.dur)}.00 (${s.dur} jam)`,
      `Lapangan: ${rp(q.court)}`, ...(st.racket ? [`Sewa raket: ${st.racket} × ${rp(D.ADDONS.racket.price)}`] : []), ...(st.balls ? [`Bola: ${st.balls} kaleng × ${rp(D.ADDONS.balls.price)}`] : []),
      `Total: ${rp(q.total)}`, '', `Nama: ${st.name}`, `No. WA: ${st.wa}`].join('\n');
  }
  function submit() {
    keep();
    const err = $('#tErr');
    if (!st.name) { err.textContent = 'Isi nama dulu.'; err.hidden = false; return; }
    if (!validWa(st.wa)) { err.textContent = 'Nomor WhatsApp belum valid, contoh 0812xxxxxxx.'; err.hidden = false; return; }
    const msg = message();
    if (D.DEMO || !D.WA_NUMBER) { st.sent = msg; renderTicket(); return; }
    window.open(`https://wa.me/${D.WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  }

  /* ---------------- sections ---------------- */
  function renderMatches() {
    const list = [];
    for (const day of days) for (const h of HOURS) for (const c of D.COURTS) { const m = matchAt(c.id, day, h); if (m && !past(day, h)) list.push(m); }
    $('#matches').innerHTML = list.slice(0, 9).map((m) => `<button type="button" class="match" data-join="${m.court}|${m.day}|${m.h}">
      <div class="match__when"><b>${pad(m.h)}.00</b><small>${dOf(m.day).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</small></div>
      <strong>${esc(courtOf(m.court).name)} · ${esc(m.level)}</strong>
      <span>Dibuka ${esc(m.host)} · ${m.joined}/${D.PLAYERS} pemain</span>
      <em>Butuh ${D.PLAYERS - m.joined} lagi · ${rp(Math.round(price(m.court, m.day, m.h) / D.PLAYERS))}/orang</em></button>`).join('') || '<p>Belum ada slot main bareng.</p>';
  }
  function renderStatic() {
    $('#where').textContent = `${D.name} · ${D.area}`;
    $('#addr').textContent = D.address;
    $('#bands').innerHTML = D.BANDS.map((b) => `<div class="band"><small>${esc(b.label)}</small><b>${rk(b.price)}</b><span>${b.days} · ${pad(b.from)}.00–${pad(b.to)}.00</span></div>`).join('');
    $('#extras').innerHTML = `<span><b>${D.ADDONS.racket.label}</b> ${rp(D.ADDONS.racket.price)} / raket</span><span><b>Bola</b> ${rp(D.ADDONS.balls.price)} / kaleng isi 3</span><span><b>Patungan</b> otomatis dibagi ${D.PLAYERS} orang</span>`;
    $('#rules').innerHTML = D.RULES.map(([t, d]) => `<li><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join('');
    $('#courts').innerHTML = D.COURTS.map((c) => `<div class="court"><b>${esc(c.name)}</b><span>${esc(c.type)} · ${esc(c.note)}</span></div>`).join('');
    if (D.DEMO) { $('#demoBar').hidden = false; $('#demoLink').href = D.DEV_CONTACT_URL; }
  }

  /* ---------------- events ---------------- */
  function refresh() { renderBoard(); renderTicket(); }
  function bind() {
    $('#days').addEventListener('click', (e) => { const b = e.target.closest('[data-day]'); if (!b) return; st.day = b.dataset.day; st.sel = null; st.join = null; st.sent = ''; renderDays(); refresh(); });
    $('#board').addEventListener('click', (e) => {
      const b = e.target.closest('.cell'); if (!b || b.disabled) return;
      keep(); st.sent = '';
      const c = b.dataset.c, h = Number(b.dataset.h), m = matchAt(c, st.day, h);
      if (m) { st.join = m; st.sel = null; st.slots = 1; }
      else if (st.sel && st.sel.court === c && st.sel.h === h) st.sel = null;
      else if (st.sel && st.sel.court === c && h === st.sel.h + 1 && st.sel.dur === 1) st.sel.dur = 2;
      else { st.sel = { court: c, h, dur: 1 }; st.join = null; }
      refresh();
    });
    $('#ticket').addEventListener('click', (e) => {
      const t = e.target;
      if (t.closest('#tGo')) return submit();
      keep();
      if (t.closest('#tEdit')) st.sent = '';
      else if (t.closest('#ticketX')) { st.sel = null; st.join = null; st.sent = ''; }
      else if (t.closest('[data-dur]')) st.sel.dur = Number(t.closest('[data-dur]').dataset.dur);
      else if (t.closest('[data-add]')) { const a = t.closest('[data-add]'); st[a.dataset.add] = Math.max(0, st[a.dataset.add] + Number(a.dataset.d)); }
      else if (t.closest('[data-slots]')) st.slots = Number(t.closest('[data-slots]').dataset.slots);
      else return;
      refresh();
    });
    $('#matches').addEventListener('click', (e) => {
      const b = e.target.closest('[data-join]'); if (!b) return;
      const [c, day, h] = b.dataset.join.split('|');
      st.day = day; st.join = matchAt(c, day, Number(h)); st.sel = null; st.slots = 1; st.sent = '';
      renderDays(); refresh();
      document.getElementById('jadwal').scrollIntoView({ behavior: 'smooth' });
    });
    // tandai item rail yang sedang terlihat
    const items = [...document.querySelectorAll('.rail__item')];
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((en) => en.forEach((x) => { if (x.isIntersecting) items.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === '#' + x.target.id))); }), { rootMargin: '-45% 0px -50% 0px' });
      ['jadwal', 'bareng', 'harga', 'info'].forEach((id) => io.observe(document.getElementById(id)));
    }
  }

  renderStatic(); renderDays(); renderMatches(); refresh(); bind();
})();
