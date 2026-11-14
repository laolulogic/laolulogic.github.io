/* Laolu Logic — interactions, motion, booking & forms */
(() => {
  'use strict';
  const C = window.LL || {};
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const G = !!(window.gsap && window.ScrollTrigger) && !reduce;
  root.classList.add(G ? 'has-gsap' : 'no-gsap');
  let lenis = null;

  /* ---------- Utilities ---------- */
  const toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl);
  let toastT; const toast = msg => { toastEl.textContent = msg; toastEl.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('is-on'), 3200); };
  const waLink = text => `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(text)}`;
  const mailLink = (subject, body) => `mailto:${C.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ---------- Theme ---------- */
  const themeBtn = $('.theme-toggle');
  const setTheme = t => { root.setAttribute('data-theme', t); try { localStorage.setItem('ll-theme', t); } catch (e) {} if (themeBtn) themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'); };
  if (themeBtn) {
    setTheme(root.getAttribute('data-theme') || 'light');
    themeBtn.addEventListener('click', e => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      if (!document.startViewTransition || reduce) return setTheme(next);
      const x = e.clientX || innerWidth - 60, y = e.clientY || 40, r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      document.startViewTransition(() => setTheme(next)).ready.then(() => {
        root.animate({ clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] }, { duration: 700, easing: 'cubic-bezier(.76,0,.24,1)', pseudoElement: '::view-transition-new(root)' });
      }).catch(() => {});
    });
  }

  /* ---------- Header + menu ---------- */
  const header = $('.site-header');
  const menuBtn = $('.menu-btn'), menu = $('.menu-panel');
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY;
    if (header) {
      header.classList.toggle('is-scrolled', y > 24);
      header.classList.toggle('is-hidden', y > 500 && y > lastY + 2 && !(menu && menu.classList.contains('is-open')));
      if (y < lastY - 2) header.classList.remove('is-hidden');
    }
    lastY = y;
    updateTop(y);
  };
  const setMenu = open => {
    if (!menu) return;
    menu.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', String(!open));
    if (lenis) open ? lenis.stop() : lenis.start();
    document.body.style.overflow = open ? 'hidden' : '';
  };
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
    $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); } });
  }

  /* ---------- Back to top with progress ring ---------- */
  const topBtn = $('.to-top'), ring = topBtn && $('.ring circle', topBtn);
  function updateTop(y) {
    if (!topBtn) return;
    const max = document.documentElement.scrollHeight - innerHeight;
    topBtn.classList.toggle('is-on', y > 700);
    if (ring) ring.style.strokeDashoffset = String(163.4 * (1 - Math.min(1, y / Math.max(1, max))));
  }
  if (topBtn) topBtn.addEventListener('click', () => lenis ? lenis.scrollTo(0, { duration: 1.4 }) : scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Cursor + magnetic ---------- */
  if (fine && !reduce) {
    const cur = document.createElement('div'); cur.className = 'cursor'; cur.setAttribute('aria-hidden', 'true'); cur.innerHTML = '<span>View</span>';
    document.body.appendChild(cur); document.body.classList.add('has-cursor');
    let mx = -100, my = -100, cx = -100, cy = -100;
    addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function loop() { cx += (mx - cx) * .2; cy += (my - cy) * .2; cur.style.transform = `translate3d(${cx}px,${cy}px,0)`; requestAnimationFrame(loop); })();
    document.addEventListener('pointerover', e => {
      const view = e.target.closest('[data-cursor="view"]');
      cur.classList.toggle('is-view', !!view);
      cur.classList.toggle('is-hover', !view && !!e.target.closest('a, button, summary, label, input, select, textarea'));
    });
    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); el.style.translate = `${(e.clientX - r.left - r.width / 2) * .2}px ${(e.clientY - r.top - r.height / 2) * .28}px`; });
      el.addEventListener('pointerleave', () => { el.style.translate = ''; });
    });
  }

  /* ---------- Services row image preview ---------- */
  const preview = $('.svc-preview');
  if (preview && fine) {
    const img = $('img', preview); let px = 0, py = 0, tx = 0, ty = 0, raf;
    const move = () => { px += (tx - px) * .15; py += (ty - py) * .15; preview.style.left = px + 'px'; preview.style.top = py + 'px'; raf = requestAnimationFrame(move); };
    $$('.svc[data-preview]').forEach(row => {
      row.addEventListener('pointerenter', e => { img.src = row.dataset.preview; img.alt = ''; tx = px = e.clientX; ty = py = e.clientY; preview.classList.add('is-on'); cancelAnimationFrame(raf); move(); });
      row.addEventListener('pointermove', e => { tx = e.clientX + 40; ty = e.clientY; });
      row.addEventListener('pointerleave', () => { preview.classList.remove('is-on'); cancelAnimationFrame(raf); });
    });
  }

  /* ---------- Testimonial rail (drag + buttons + progress) ---------- */
  $$('[data-rail]').forEach(wrap => {
    const rail = $('.t-rail', wrap), bar = $('.t-progress i', wrap);
    let down = false, sx = 0, sl = 0, moved = false;
    const upd = () => { if (!bar) return; const max = rail.scrollWidth - rail.clientWidth; const w = rail.clientWidth / rail.scrollWidth; bar.style.width = (w * 100) + '%'; bar.style.left = (max ? rail.scrollLeft / max : 0) * (100 - w * 100) + '%'; };
    rail.addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
    rail.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; rail.classList.add('is-drag'); });
    addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; rail.scrollLeft = sl - dx; });
    addEventListener('pointerup', () => { if (!down) return; down = false; rail.classList.remove('is-drag'); });
    rail.addEventListener('click', e => { if (moved) e.preventDefault(); }, true);
    const step = () => ($('.t-card', rail) || {}).offsetWidth + 20 || 400;
    $$('[data-rail-prev]', wrap).forEach(b => b.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' })));
    $$('[data-rail-next]', wrap).forEach(b => b.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' })));
  });

  /* ---------- Case filters + dialogs ---------- */
  const filters = $$('.filter'), cases = $$('[data-cat]'), fStatus = $('[data-filter-status]');
  filters.forEach(b => b.addEventListener('click', () => {
    const f = b.dataset.filter; let n = 0;
    filters.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    cases.forEach(c => {
      const on = f === 'all' || c.dataset.cat.split(' ').includes(f);
      c.classList.toggle('is-hidden', !on);
      if (on) { n++; c.style.opacity = 1; c.style.transform = 'none'; if (G) gsap.fromTo(c, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: .7, delay: n * .05, ease: 'power3.out' }); }
    });
    if (fStatus) fStatus.textContent = `Showing ${n} case stud${n === 1 ? 'y' : 'ies'}`;
    if (G) ScrollTrigger.refresh();
  }));
  // Deep-link a filter: work.html?filter=realestate
  const qf = new URLSearchParams(location.search).get('filter');
  if (qf) { const b = filters.find(x => x.dataset.filter === qf); if (b) b.click(); }

  $$('[data-open]').forEach(btn => btn.addEventListener('click', e => {
    const d = document.getElementById(btn.dataset.open); if (!d || !d.showModal) return;
    e.preventDefault(); d.showModal(); if (lenis) lenis.stop();
    history.replaceState(null, '', '#' + btn.dataset.open.replace('dlg-', ''));
  }));
  $$('dialog.case-dialog').forEach(d => {
    d.addEventListener('close', () => { if (lenis) lenis.start(); history.replaceState(null, '', location.pathname + location.search); });
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
    $$('[data-close]', d).forEach(b => b.addEventListener('click', () => d.close()));
  });
  if (location.hash && document.getElementById('dlg-' + location.hash.slice(1))) {
    setTimeout(() => { const d = document.getElementById('dlg-' + location.hash.slice(1)); d.showModal(); if (lenis) lenis.stop(); }, 400);
  }

  /* ---------- Workflow library: filter, show more, lightbox ---------- */
  const libGrid = $('[data-lib-grid]');
  if (libGrid) {
    const items = $$('.lib-item', libGrid), moreBtn = $('[data-lib-more]'), libFilters = $$('.lib-filter');
    const LIMIT = 12; let libFilter = 'all', expanded = false;
    const applyLib = () => {
      const matching = items.filter(i => libFilter === 'all' || i.dataset.p === libFilter);
      items.forEach(i => { i.hidden = true; });
      matching.forEach((i, idx) => { i.hidden = !expanded && idx >= LIMIT; });
      if (moreBtn) { moreBtn.parentElement.hidden = expanded || matching.length <= LIMIT; moreBtn.firstChild.textContent = `Show all ${matching.length} workflows `; }
      if (G) ScrollTrigger.refresh();
    };
    libFilters.forEach(b => b.addEventListener('click', () => {
      libFilter = b.dataset.libFilter; expanded = false;
      libFilters.forEach(x => x.setAttribute('aria-pressed', String(x === b))); applyLib();
      if (G) gsap.fromTo(items.filter(i => !i.hidden), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .6, stagger: .03, ease: 'power3.out' });
    }));
    if (moreBtn) moreBtn.addEventListener('click', () => { expanded = true; applyLib(); });
    applyLib();
    const lb = $('#lib-lightbox');
    if (lb && lb.showModal) {
      const lbImg = $('img', lb), lbT = $('[data-lb-title]', lb), lbP = $('[data-lb-pl]', lb); let cur = 0;
      const visible = () => items.filter(i => libFilter === 'all' || i.dataset.p === libFilter);
      const show = idx => { const list = visible(); cur = (idx + list.length) % list.length; const it = list[cur]; lbImg.src = it.dataset.src; lbImg.alt = it.dataset.t + ' workflow'; lbT.textContent = it.dataset.t; lbP.textContent = it.dataset.pl; };
      items.forEach(it => it.addEventListener('click', () => { show(visible().indexOf(it)); lb.showModal(); if (lenis) lenis.stop(); }));
      $('[data-lb-prev]', lb).addEventListener('click', () => show(cur - 1));
      $('[data-lb-next]', lb).addEventListener('click', () => show(cur + 1));
      $('[data-lb-close]', lb).addEventListener('click', () => lb.close());
      lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
      lb.addEventListener('close', () => { if (lenis) lenis.start(); });
      lb.addEventListener('keydown', e => { if (e.key === 'ArrowRight') show(cur + 1); if (e.key === 'ArrowLeft') show(cur - 1); });
    }
  }

  /* ---------- Services page side-nav ---------- */
  const sideLinks = $$('.svc-nav a');
  if (sideLinks.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(ents => ents.forEach(en => {
      if (en.isIntersecting) sideLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
    }), { rootMargin: '-40% 0px -55% 0px' });
    $$('.svc-block[id]').forEach(s => io.observe(s));
  }

  /* ---------- Tabs (contact page) ---------- */
  const tabs = $$('[role="tab"]');
  const selectTab = id => tabs.forEach(t => { const on = t.getAttribute('aria-controls') === id; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; const p = document.getElementById(t.getAttribute('aria-controls')); if (p) p.hidden = !on; });
  tabs.forEach(t => {
    t.addEventListener('click', () => selectTab(t.getAttribute('aria-controls')));
    t.addEventListener('keydown', e => { if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; const i = tabs.indexOf(t), n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length]; n.focus(); n.click(); });
  });
  if (tabs.length && /message/.test(location.hash)) selectTab('panel-message');

  /* =========================================================
     TIME ZONES (all IANA zones; DST handled by Intl)
     ========================================================= */
  const detectedTz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) { return 'UTC'; } })();
  const FALLBACK_TZ = ['Pacific/Honolulu', 'America/Anchorage', 'America/Los_Angeles', 'America/Denver', 'America/Phoenix', 'America/Chicago', 'America/New_York', 'America/Toronto', 'America/Halifax', 'America/Sao_Paulo', 'Atlantic/Azores', 'Europe/London', 'Europe/Dublin', 'Europe/Lisbon', 'Africa/Lagos', 'Europe/Paris', 'Europe/Berlin', 'Africa/Johannesburg', 'Africa/Cairo', 'Africa/Nairobi', 'Europe/Istanbul', 'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Dhaka', 'Asia/Bangkok', 'Asia/Singapore', 'Asia/Manila', 'Asia/Shanghai', 'Asia/Tokyo', 'Australia/Perth', 'Australia/Sydney', 'Pacific/Auckland', 'UTC'];
  const tzOffsetMin = (zone, at = Date.now()) => {
    try {
      const p = new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }).formatToParts(at).reduce((o, x) => (o[x.type] = x.value, o), {});
      return Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute) - Math.floor(at / 60000) * 60000) / 60000);
    } catch (e) { return 0; }
  };
  const fmtOffset = m => { const s = m < 0 ? '-' : '+', a = Math.abs(m); return `GMT${s}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`; };
  let tzList = null;
  const getTzList = () => {
    if (tzList) return tzList;
    let zones = [];
    try { zones = Intl.supportedValuesOf('timeZone'); } catch (e) { zones = FALLBACK_TZ.slice(); }
    if (!zones.includes(detectedTz)) zones.push(detectedTz);
    if (!zones.includes('UTC')) zones.push('UTC');
    tzList = zones.map(z => ({ z, off: tzOffsetMin(z) })).sort((a, b) => a.off - b.off || a.z.localeCompare(b.z));
    return tzList;
  };
  const fillTzSelect = (sel, value) => {
    const frag = document.createDocumentFragment();
    getTzList().forEach(({ z, off }) => { const o = document.createElement('option'); o.value = z; o.textContent = `(${fmtOffset(off)}) ${z.replace(/_/g, ' ').replace(/\//g, ' / ')}`; frag.appendChild(o); });
    sel.innerHTML = ''; sel.appendChild(frag); sel.value = value;
  };
  $$('select[data-tz-select]').forEach(sel => fillTzSelect(sel, detectedTz));

  /* =========================================================
     BOOKING
     ========================================================= */
  const bk = $('[data-booking]');
  if (bk) initBooking(bk);
  function initBooking(el) {
    let tz = detectedTz;
    const daysEl = $('.bk-days', el), timesEl = $('.bk-times', el), step1 = $('[data-step="1"]', el), step2 = $('[data-step="2"]', el), result = $('.result', el);
    const form = $('form', el), summary = $('.bk-summary strong', el), tzSel = $('[data-tz-select]', el), tzNow = $('[data-tz-now]', el);
    let keyFmt, dayFmt, numFmt, monFmt, timeFmt, longFmt;
    const buildFmts = () => {
      keyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
      dayFmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' });
      numFmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, day: 'numeric' });
      monFmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, month: 'short' });
      timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' });
      longFmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
      if (tzNow) tzNow.textContent = `It's currently ${timeFmt.format(Date.now())} there (${fmtOffset(tzOffsetMin(tz))}). Daylight saving is applied automatically.`;
    };
    buildFmts();
    if (tzSel) tzSel.addEventListener('change', () => {
      tz = tzSel.value || detectedTz; buildFmts();
      byDay = {}; slots.forEach(t => { const k = keyFmt.format(t); (byDay[k] = byDay[k] || []).push(t); });
      chosenDay = null; renderDays();
      if (!step2.hidden && chosen) summary.textContent = longFmt.format(chosen);
    });
    let slots = [], byDay = {}, chosenDay = null, chosen = null, live = false;

    const localSlots = () => {
      const out = [], now = Date.now(), off = (C.ownerTimeZoneOffset || 0) * 3600e3, step = (C.slotMinutes || 30) * 60e3;
      const earliest = now + (C.minNoticeHours || 4) * 3600e3, latest = now + (C.daysAhead || 21) * 86400e3;
      for (let i = 0; i <= (C.daysAhead || 21) + 1; i++) {
        const d = new Date(now + off + i * 86400e3);
        if (!(C.workDays || [0, 1, 2, 3, 4, 5, 6]).includes(d.getUTCDay())) continue;
        const start = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), C.dayStartHour || 9) - off;
        const end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), C.dayEndHour || 17) - off;
        for (let t = start; t + step <= end; t += step) if (t >= earliest && t <= latest) out.push(t);
      }
      return out;
    };
    const load = async () => {
      timesEl.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
      live = false;
      if (C.endpoint) {
        try {
          const now = Date.now();
          const r = await fetch(`${C.endpoint}?action=slots&start=${now}&end=${now + (C.daysAhead || 21) * 86400e3}`);
          const j = await r.json();
          if (j.ok && Array.isArray(j.slots)) { slots = j.slots; live = true; }
          else throw new Error('bad');
        } catch (e) { slots = localSlots(); }
      } else slots = localSlots();
      byDay = {}; slots.forEach(t => { const k = keyFmt.format(t); (byDay[k] = byDay[k] || []).push(t); });
      renderDays();
    };
    const renderDays = () => {
      daysEl.innerHTML = '';
      const keys = []; const now = Date.now();
      for (let i = 0; i < 14; i++) { const t = now + i * 86400e3; const k = keyFmt.format(t); if (!keys.find(x => x.k === k)) keys.push({ k, t }); }
      let first = null;
      keys.forEach(({ k, t }) => {
        const has = (byDay[k] || []).length > 0;
        const b = document.createElement('button'); b.type = 'button'; b.className = 'bk-day'; b.disabled = !has;
        b.setAttribute('aria-pressed', 'false'); b.dataset.key = k;
        b.innerHTML = `<small>${dayFmt.format(t)}</small><b>${numFmt.format(t)}</b><small>${monFmt.format(t)}</small>`;
        b.setAttribute('aria-label', `${dayFmt.format(t)} ${monFmt.format(t)} ${numFmt.format(t)}${has ? `, ${byDay[k].length} times available` : ', no times'}`);
        b.addEventListener('click', () => pickDay(k));
        daysEl.appendChild(b); if (has && !first) first = k;
      });
      if (first) pickDay(chosenDay && byDay[chosenDay] ? chosenDay : first); else timesEl.innerHTML = '<p class="bk-empty">No open times in the next two weeks. Message me on WhatsApp and we will find a time.</p>';
    };
    const pickDay = k => {
      chosenDay = k;
      $$('.bk-day', daysEl).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.key === k)));
      timesEl.innerHTML = '';
      (byDay[k] || []).forEach(t => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'bk-time'; b.textContent = timeFmt.format(t); b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', () => pickTime(t, b)); timesEl.appendChild(b);
      });
    };
    const pickTime = (t, b) => {
      chosen = t; $$('.bk-time', timesEl).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      summary.textContent = longFmt.format(t);
      step1.hidden = true; step2.hidden = false; result.classList.remove('is-on');
      setTimeout(() => { const f = $('input', form); if (f) f.focus({ preventScroll: true }); }, 50);
    };
    $('[data-change-time]', el).addEventListener('click', () => { step2.hidden = true; step1.hidden = false; });

    const v = attachValidation(form, { name: x => x.trim().length >= 2 || 'Please enter your name.', email: x => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.trim()) || 'Please enter a valid email.' });
    form.addEventListener('submit', async e => {
      e.preventDefault(); if (!v()) return;
      const fd = Object.fromEntries(new FormData(form).entries());
      const label = longFmt.format(chosen);
      const btn = $('button[type="submit"]', form), lab = $('.label', btn); btn.disabled = true; lab.textContent = 'Booking…';
      const show = html => { result.innerHTML = html; step2.hidden = true; result.classList.add('is-on'); result.focus && result.focus(); };
      const msg = `Hi Laolu, I'd like to book a strategy call on ${label} (${tz}).\n\nName: ${fd.name}\nEmail: ${fd.email}${fd.phone ? '\nPhone: ' + fd.phone : ''}${fd.company ? '\nCompany: ' + fd.company : ''}\nTopic: ${fd.topic}${fd.notes ? '\n\n' + fd.notes : ''}`;
      try {
        if (!C.endpoint) throw Object.assign(new Error('offline'), { offline: true });
        const r = await fetch(C.endpoint, { method: 'POST', body: JSON.stringify({ type: 'booking', start: chosen, tz, localLabel: label, ...fd }) });
        const j = await r.json();
        if (!j.ok) { toast(j.error || 'That time is no longer available.'); btn.disabled = false; lab.textContent = 'Confirm booking'; step2.hidden = true; step1.hidden = false; load(); return; }
        show(`<h3>You're booked. See you then.</h3><p><strong>${esc(label)}</strong> (${esc(tz.replace(/_/g, ' '))}). A calendar invite${j.meet ? ' with a Google Meet link' : ''} is on its way to <strong>${esc(fd.email)}</strong>.</p>${j.meet ? `<div class="hero-cta"><a class="btn btn--solid btn--sm" href="${esc(j.meet)}" target="_blank" rel="noopener">Open Meet link</a></div>` : ''}`);
        form.reset();
      } catch (err) {
        show(`<h3>Almost done: confirm your time</h3><p>Send this request and I'll confirm <strong>${esc(label)}</strong> (${esc(tz.replace(/_/g, ' '))}) with a calendar invite, usually within a few hours.</p><div class="hero-cta"><a class="btn btn--accent btn--sm" href="${waLink(msg)}" target="_blank" rel="noopener">Confirm on WhatsApp</a><a class="btn btn--line btn--sm" href="${mailLink('Strategy call request: ' + label, msg)}">Confirm by email</a></div>`);
      } finally { btn.disabled = false; lab.textContent = 'Confirm booking'; }
    });
    load();
  }

  /* =========================================================
     CONTACT FORM
     ========================================================= */
  function attachValidation(form, rules) {
    const check = n => {
      const input = form.elements[n]; if (!input) return true;
      const wrap = input.closest('.field'), res = rules[n](input.value), ok = res === true;
      wrap.classList.toggle('has-error', !ok); input.setAttribute('aria-invalid', String(!ok));
      const er = $('.error', wrap); if (er) er.textContent = ok ? '' : res; return ok;
    };
    Object.keys(rules).forEach(n => { const i = form.elements[n]; if (!i) return; i.addEventListener('blur', () => check(n)); i.addEventListener('input', () => { if (i.closest('.field').classList.contains('has-error')) check(n); }); });
    return () => { const bad = Object.keys(rules).filter(n => !check(n)); if (bad.length) { form.elements[bad[0]].focus(); return false; } return true; };
  }
  const cf = $('[data-contact-form]');
  if (cf) {
    const result = $('.result', cf.parentElement);
    const v = attachValidation(cf, { name: x => x.trim().length >= 2 || 'Please enter your name.', email: x => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.trim()) || 'Please enter a valid email.', message: x => x.trim().length >= 15 || 'A little more detail helps (15+ characters).' });
    cf.addEventListener('submit', async e => {
      e.preventDefault(); if (!v()) return;
      const fd = new FormData(cf);
      const data = Object.fromEntries(fd.entries());
      data.services = fd.getAll('service').join(', '); delete data.service;
      data.page = location.pathname;
      const btn = $('button[type="submit"]', cf), lab = $('.label', btn); btn.disabled = true; lab.textContent = 'Sending…';
      const msg = `Hi Laolu, I'm ${data.name}${data.company ? ' from ' + data.company : ''}.\n\n${data.message}\n\nServices: ${data.services || '-'}\nCRM: ${data.crm || '-'}\nTimeline: ${data.timeline || '-'}\nEmail: ${data.email}${data.phone ? '\nPhone: ' + data.phone : ''}`;
      const show = html => { result.innerHTML = html; cf.hidden = true; result.classList.add('is-on'); };
      try {
        if (!C.endpoint) throw Object.assign(new Error('offline'), { offline: true });
        const r = await fetch(C.endpoint, { method: 'POST', body: JSON.stringify({ type: 'contact', ...data }) });
        const j = await r.json(); if (!j.ok) throw new Error(j.error || 'failed');
        show(`<h3>Message received. Thank you, ${esc(data.name.split(' ')[0])}.</h3><p>A confirmation is on its way to ${esc(data.email)}. I'll reply personally, usually within a few hours.</p><div class="hero-cta"><a class="btn btn--line btn--sm" href="work.html">Browse case studies</a></div>`);
        cf.reset();
      } catch (err) {
        if (err.offline) show(`<h3>Your message is ready to send</h3><p>Choose how you'd like to send it. Everything you typed is already filled in.</p><div class="hero-cta"><a class="btn btn--accent btn--sm" href="${waLink(msg)}" target="_blank" rel="noopener">Send on WhatsApp</a><a class="btn btn--line btn--sm" href="${mailLink('Project enquiry from ' + data.name, msg)}">Send by email</a></div>`);
        else { toast('Could not send right now. Opening WhatsApp instead.'); window.open(waLink(msg), '_blank', 'noopener'); }
      } finally { btn.disabled = false; lab.textContent = 'Send message'; }
    });
  }

  /* ---------- Copy to clipboard ---------- */
  $$('[data-copy]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); navigator.clipboard && navigator.clipboard.writeText(b.dataset.copy).then(() => toast('Copied: ' + b.dataset.copy)); }));

  /* ---------- Statement words (scroll-filled text) ---------- */
  const statements = $$('[data-fill]');
  statements.forEach(st => {
    const walk = node => [...node.childNodes].forEach(ch => {
      if (ch.nodeType === 3) {
        const frag = document.createDocumentFragment();
        ch.textContent.split(/(\s+)/).forEach(p => { if (!p) return; if (/^\s+$/.test(p)) frag.appendChild(document.createTextNode(p)); else { const s = document.createElement('span'); s.className = 'word'; s.textContent = p; frag.appendChild(s); } });
        ch.replaceWith(frag);
      } else if (ch.nodeType === 1) walk(ch);
    });
    walk(st);
  });

  /* =========================================================
     MOTION (GSAP)
     ========================================================= */
  const intro = $('.intro');
  if (!G) {
    if (intro) intro.hidden = true;
    const els = $$('[data-reveal]');
    if ('IntersectionObserver' in window && !reduce) { const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } }), { threshold: .1 }); els.forEach(e => io.observe(e)); }
    else els.forEach(e => e.classList.add('is-visible'));
    $$('[data-count]').forEach(el => { el.textContent = el.dataset.count + (el.dataset.suffix || ''); });
    $$('.statement .word').forEach(w => w.classList.add('is-lit'));
    $$('.j-step').forEach(s => s.classList.add('is-on'));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);

  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.1, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => { const id = a.getAttribute('href'); if (id.length > 1 && document.querySelector(id)) { e.preventDefault(); lenis.scrollTo(id, { offset: -90 }); } }));
  }

  const bar = $('.progress');
  if (bar) gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });

  /* Entrance timeline (runs after the intro on home) */
  const entrance = () => {
    const heads = $$('[data-split]');
    const run = () => heads.forEach(el => {
      const inHero = !!el.closest('.hero, .page-hero');
      if (window.SplitText) {
        const sp = SplitText.create(el, { type: 'lines,words', mask: 'lines', linesClass: 'split-line' });
        gsap.from(sp.words, { yPercent: 115, duration: 1.15, ease: 'expo.out', stagger: .035, delay: inHero ? .05 : 0, scrollTrigger: inHero ? undefined : { trigger: el, start: 'top 86%' } });
      } else gsap.from(el, { y: 40, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: inHero ? undefined : { trigger: el, start: 'top 86%' } });
    });
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(run);
    gsap.from('[data-hero]', { y: 26, opacity: 0, duration: 1, ease: 'power3.out', stagger: .08, delay: .35 });
    if ($('.portrait')) {
      gsap.from('.portrait-bg', { clipPath: 'inset(100% 0 0 0)', duration: 1.4, ease: 'expo.inOut' });
      gsap.from('.portrait-img', { yPercent: 18, opacity: 0, duration: 1.5, ease: 'expo.out', delay: .4 });
      gsap.from('.badge-ring, .chip-float', { scale: .6, opacity: 0, duration: 1, ease: 'back.out(1.7)', stagger: .15, delay: 1 });
      gsap.to('.portrait-img', { yPercent: -6, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.chip-float', { y: -10, duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 2 });
    }
  };

  if (intro && !sessionStorage.getItem('ll-intro')) {
    if (lenis) lenis.stop();
    const tl = gsap.timeline({ onComplete: () => { intro.hidden = true; sessionStorage.setItem('ll-intro', '1'); if (lenis) lenis.start(); } });
    tl.to('.intro .mark path', { strokeDashoffset: 0, duration: .9, ease: 'power2.inOut', stagger: .12 })
      .from('.intro .mark circle', { scale: 0, transformOrigin: 'center', duration: .5, ease: 'back.out(2)', stagger: .1 }, '-=.45')
      .to('.intro .word span', { y: 0, duration: .8, ease: 'expo.out', stagger: .05 }, '-=.6')
      .to('.intro-bar i', { scaleX: 1, duration: 1.1, ease: 'power2.inOut' }, 0)
      .to('.intro-inner', { y: -30, opacity: 0, duration: .5, ease: 'power2.in' }, '+=.25')
      .to(intro, { clipPath: 'inset(0 0 100% 0)', duration: .9, ease: 'expo.inOut' }, '-=.15')
      .add(entrance, '-=.55');
    $('.intro-skip', intro).addEventListener('click', () => tl.progress(1));
  } else {
    if (intro) intro.hidden = true;
    entrance();
  }

  /* Reveals */
  const revealEls = $$('[data-reveal]');
  if (revealEls.length) {
    gsap.set(revealEls, { opacity: 0, y: 40 });
    ScrollTrigger.batch(revealEls, { start: 'top 92%', once: true, onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: 1.05, ease: 'power3.out', stagger: .09, overwrite: true }) });
    // Safety net: anything already scrolled past or on screen is never left hidden.
    const sweep = () => revealEls.forEach(el => { if (+getComputedStyle(el).opacity < .05 && el.getBoundingClientRect().top < innerHeight * .95) gsap.to(el, { opacity: 1, y: 0, duration: .8, ease: 'power3.out' }); });
    ScrollTrigger.addEventListener('scrollEnd', sweep);
    addEventListener('load', () => setTimeout(sweep, 1200));
  }

  /* Image / panel clip reveals */
  $$('[data-clip]').forEach(el => {
    gsap.fromTo(el, { clipPath: 'inset(12% 8% 12% 8% round 26px)' }, { clipPath: 'inset(0% 0% 0% 0% round 26px)', ease: 'none', scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 45%', scrub: .6 } });
    const im = $('img', el); if (im) gsap.fromTo(im, { scale: 1.18 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 35%', scrub: .6 } });
  });

  /* Mock bars grow */
  $$('.m-bar i').forEach(i => gsap.from(i, { scaleX: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: i, start: 'top 92%' } }));

  /* Counters */
  $$('[data-count]').forEach(el => {
    const end = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length, o = { v: 0 };
    const fmt = n => (dec ? n.toFixed(dec) : Math.round(n).toLocaleString('en-US')) + (el.dataset.suffix || '');
    gsap.to(o, { v: end, duration: 2.2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%' }, onUpdate: () => { el.textContent = fmt(o.v); } });
  });

  /* Statement scroll fill */
  statements.forEach(st => {
    const words = $$('.word', st);
    ScrollTrigger.create({ trigger: st, start: 'top 80%', end: 'bottom 45%', scrub: true,
      onUpdate: s => { const n = Math.round(s.progress * words.length); words.forEach((w, i) => w.classList.toggle('is-lit', i < n)); } });
  });

  /* Ghost words drift horizontally */
  $$('.ghost-word').forEach(w => gsap.fromTo(w, { xPercent: 4 }, { xPercent: -22, ease: 'none', scrollTrigger: { trigger: w.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));

  /* Journey line */
  const jr = $('.journey');
  if (jr) {
    const steps = $$('.j-step', jr), vertical = matchMedia('(max-width: 900px)').matches;
    gsap.to('.journey-line', { [vertical ? 'scaleY' : 'scaleX']: 1, ease: 'none', scrollTrigger: { trigger: jr, start: 'top 75%', end: 'bottom 55%', scrub: .5,
      onUpdate: s => steps.forEach((st, i) => st.classList.toggle('is-on', s.progress >= i / steps.length + .02)) } });
  }

  /* Process line */
  const pl = $('.process-line i');
  if (pl) gsap.to(pl, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.process', start: 'top 75%', end: 'top 35%', scrub: .5 } });

  /* Logo rail reacts to scroll velocity */
  const rail = $('.logo-rail');
  if (rail) ScrollTrigger.create({ onUpdate: s => { rail.style.animationDuration = `${48 / (1 + Math.min(Math.abs(s.getVelocity()) / 900, 3))}s`; } });

  /* Footer wordmark rises */
  const fg = $('.f-giant');
  if (fg) gsap.fromTo(fg, { yPercent: 45 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.site-footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  /* Big CTA scale-in */
  const bc = $('.big-cta h2');
  if (bc) gsap.fromTo(bc, { scale: .86, opacity: .3 }, { scale: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: bc, start: 'top 95%', end: 'top 40%', scrub: true } });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
