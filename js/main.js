/* Laolu Logic — interactions, motion, booking & forms */
(() => {
  'use strict';
  const C = window.LL || {};
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const G = false; // native, dependency-free motion (no animation library)
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

  /* ---------- Shared image zoom (case studies, blog, library) ---------- */
  let zoomDlg = null;
  const openZoom = (src, alt) => {
    if (!zoomDlg) {
      zoomDlg = document.createElement('dialog'); zoomDlg.className = 'lightbox'; zoomDlg.setAttribute('aria-label', 'Image preview');
      zoomDlg.innerHTML = '<figure><div class="lb-img"><img alt=""></div></figure><button class="lb-btn lb-close" type="button" aria-label="Close"><svg><use href="/assets/icons.svg#x"/></svg></button>';
      document.body.appendChild(zoomDlg);
      $('.lb-close', zoomDlg).addEventListener('click', () => zoomDlg.close());
      zoomDlg.addEventListener('click', e => { if (e.target === zoomDlg) zoomDlg.close(); });
    }
    const im = $('img', zoomDlg); im.src = src; im.alt = alt || ''; zoomDlg.showModal();
  };
  $$('[data-zoom]').forEach(b => b.addEventListener('click', () => openZoom(b.dataset.zoom, ($('img', b) || {}).alt)));

  /* ---------- Article pages: table of contents, copy link, share ---------- */
  const toc = $$('.art-toc a');
  if (toc.length && 'IntersectionObserver' in window) {
    const map = new Map(toc.map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(ents => ents.forEach(en => {
      if (en.isIntersecting) { toc.forEach(a => a.classList.remove('is-active')); const a = map.get(en.target.id); if (a) a.classList.add('is-active'); }
    }), { rootMargin: '-15% 0px -70% 0px' });
    $$('.art-body h2[id]').forEach(h => io.observe(h));
  }
  $$('[data-copy-url]').forEach(b => b.addEventListener('click', () => { navigator.clipboard && navigator.clipboard.writeText(location.href.split('#')[0]).then(() => toast('Link copied')); }));
  $$('[data-share="linkedin"]').forEach(a => { a.href = 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(location.href.split('#')[0]); });

  /* ---------- Rails: drag, buttons, progress, optional slow auto-scroll ---------- */
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
    // Auto-scroll: steady ~32px/s, loops seamlessly, pauses on hover, focus, touch and drag
    if (wrap.hasAttribute('data-autoplay') && !reduce) {
      const cards = [...rail.children];
      cards.forEach(c => { const k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); $$('a, button', k).forEach(x => x.tabIndex = -1); rail.appendChild(k); });
      let paused = false, last = 0, acc = 0; const speed = 32;
      const half = () => rail.scrollWidth / 2;
      const tick = t => {
        if (last && !paused && !down && document.visibilityState === 'visible') {
          acc += (t - last) / 1000 * speed;
          if (acc >= 1) { const px = Math.floor(acc); acc -= px; rail.scrollLeft += px; if (rail.scrollLeft >= half()) rail.scrollLeft -= half(); }
        }
        last = t; requestAnimationFrame(tick);
      };
      ['pointerenter', 'focusin', 'touchstart'].forEach(ev => wrap.addEventListener(ev, () => { paused = true; }, { passive: true }));
      ['pointerleave', 'focusout'].forEach(ev => wrap.addEventListener(ev, () => { paused = false; }));
      wrap.addEventListener('touchend', () => setTimeout(() => { paused = false; }, 2500), { passive: true });
      rail.addEventListener('scroll', () => { if (rail.scrollLeft >= half()) rail.scrollLeft -= half(); }, { passive: true });
      requestAnimationFrame(tick);
    }
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
  const qs = new URLSearchParams(location.search), qf = qs.get('filter') || qs.get('cat');
  if (qf) { const b = filters.find(x => x.dataset.filter === qf); if (b) b.click(); }

  /* ---------- Case viewer: side panel with counter, prev/next, metrics, tabs, zoom ---------- */
  const caseDialogs = $$('dialog.case-dialog');
  if (caseDialogs.length) {
    const icon = (id, rot) => `<svg${rot ? ` style="transform:rotate(${rot}deg)"` : ''}><use href="/assets/icons.svg#${id}"/></svg>`;
    // order follows the case cards currently visible (respects the active filter)
    const order = () => $$('.case:not(.is-hidden) [data-open]').map(b => b.dataset.open);
    let zoom = null;
    const openZoom = (src, alt) => {
      if (!zoom) {
        zoom = document.createElement('dialog'); zoom.className = 'lightbox'; zoom.setAttribute('aria-label', 'Screenshot'); 
        zoom.innerHTML = `<figure><div class="lb-img"><img alt=""></div></figure><button class="lb-btn lb-close" type="button" aria-label="Close">${icon('x')}</button>`;
        document.body.appendChild(zoom);
        $('.lb-close', zoom).addEventListener('click', () => zoom.close());
        zoom.addEventListener('click', e => { if (e.target === zoom) zoom.close(); });
      }
      const im = $('img', zoom); im.src = src; im.alt = alt || ''; zoom.showModal();
    };
    const tabName = h => { const t = h.toLowerCase(); if (/stack|tools/.test(t)) return 'stack'; if (/built|design|deliver|how|what i/.test(t)) return 'build'; return 'overview'; };
    const enhance = d => {
      if (d.dataset.enhanced) return; d.dataset.enhanced = '1';
      const sc = $('.dlg-scroll', d), body = $('.dlg-body', d), hero = $('.dlg-hero', d);
      const labelTxt = ($('.label', body) || {}).textContent || '';
      const platform = labelTxt.split('·').slice(1, 2).join('').trim();
      // sticky bar
      const bar = document.createElement('div'); bar.className = 'dlg-bar';
      bar.innerHTML = `<div class="dlg-count"><b data-n></b><span>${esc(labelTxt.replace(/^(Case study|Workflow builds)\s*·\s*/i, ''))}</span></div>
        <a class="dlg-full" href="/case-studies/${d.id.replace('dlg-', '')}">Full case study ${icon('arrow-up-right')}</a>
        <button class="dlg-nav" type="button" data-prev aria-label="Previous case study">${icon('arrow', 180)}</button>
        <button class="dlg-nav" type="button" data-next aria-label="Next case study">${icon('arrow')}</button>
        <button class="dlg-nav" type="button" data-close aria-label="Close case study">${icon('x')}</button><i class="dlg-progress"></i>`;
      sc.prepend(bar);
      // header first, then the real screenshot shown whole
      const lead = $('.lead', body);
      const img = $('img', hero);
      if (img) {
        const src = img.getAttribute('src'), alt = img.getAttribute('alt') || ($('h2', body) || {}).textContent || '';
        hero.innerHTML = `<div class="dlg-shot"><div class="dlg-shot-bar"><i></i><i></i><i></i><span>${esc(platform)}</span></div>
          <button class="dlg-shot-img" type="button" aria-label="Zoom screenshot"><img src="${esc(src)}" alt="${esc(alt)}" decoding="async"></button>
          <div class="dlg-shot-cap"><span>Real build screenshot</span><span>Client details removed</span></div></div>`;
        $('.dlg-shot-img', hero).addEventListener('click', () => openZoom(src, alt));
      } else {
        const mock = $('.mock', hero); if (mock) { hero.innerHTML = ''; const wrap = document.createElement('div'); wrap.className = 'dlg-mock'; wrap.appendChild(mock); hero.appendChild(wrap); }
      }
      if (lead) lead.after(hero); else body.prepend(hero);
      // metrics right under the screenshot
      const kpis = $('.dlg-kpis', body); if (kpis) hero.after(kpis);
      // tabs from the content columns
      const cols = $('.dlg-cols', body);
      if (cols) {
        const panes = { overview: [], build: [], stack: [] };
        [...cols.children].forEach(col => { const h = $('h3', col); panes[tabName(h ? h.textContent : '')].push(col); });
        const stackPills = panes.stack.length ? $$('.tool-pill', panes.stack[0]) : [];
        if (stackPills.length) { const tools = document.createElement('div'); tools.className = 'dlg-tools'; stackPills.forEach(p => tools.appendChild(p.cloneNode(true))); (lead || $('h2', body)).after(tools); }
        const defs = [['overview', 'Overview'], ['build', 'How it works'], ['stack', 'Tools & stack']].filter(([k]) => panes[k].length);
        const uid = d.id;
        const tabs = document.createElement('div'); tabs.className = 'dlg-tabs'; tabs.setAttribute('role', 'tablist');
        const holder = document.createElement('div');
        defs.forEach(([k, name], i) => {
          const t = document.createElement('button'); t.type = 'button'; t.className = 'dlg-tab'; t.setAttribute('role', 'tab'); t.id = `${uid}-t-${k}`; t.setAttribute('aria-controls', `${uid}-p-${k}`); t.setAttribute('aria-selected', String(i === 0)); t.textContent = name; tabs.appendChild(t);
          const p = document.createElement('div'); p.className = 'dlg-pane'; p.id = `${uid}-p-${k}`; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', t.id); p.hidden = i !== 0;
          panes[k].forEach(col => {
            const blk = document.createElement('div'); blk.className = 'dlg-block';
            const h = $('h3', col); if (h) blk.appendChild(h.cloneNode(true));
            const ul = $('ul', col);
            if (ul && k === 'build') { const ol = document.createElement('ol'); ol.className = 'dlg-steps'; $$('li', ul).forEach(li => ol.appendChild(li.cloneNode(true))); blk.appendChild(ol); $$('p', col).forEach(x => blk.appendChild(x.cloneNode(true))); }
            else if (k === 'stack') { const s = document.createElement('div'); s.className = 'dlg-stack'; $$('.tool-pill', col).forEach(x => s.appendChild(x.cloneNode(true))); blk.appendChild(s); }
            else [...col.children].filter(x => x !== h).forEach(x => blk.appendChild(x.cloneNode(true)));
            p.appendChild(blk);
          });
          holder.appendChild(p);
        });
        tabs.addEventListener('click', e => {
          const t = e.target.closest('.dlg-tab'); if (!t) return;
          $$('.dlg-tab', tabs).forEach(x => x.setAttribute('aria-selected', String(x === t)));
          $$('.dlg-pane', holder).forEach(p => { p.hidden = p.id !== t.getAttribute('aria-controls'); });
        });
        tabs.addEventListener('keydown', e => {
          if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; e.stopPropagation();
          const all = $$('.dlg-tab', tabs), i = all.indexOf(document.activeElement); if (i < 0) return;
          const n = all[(i + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length]; n.focus(); n.click();
        });
        cols.after(tabs); tabs.after(holder);
      }
      // closing call to action
      const old = $('.hero-cta', body), oldBtn = old && $('a', old);
      const cta = document.createElement('div'); cta.className = 'dlg-cta';
      cta.innerHTML = `<p>Want something like this for your business?<small>Free 30-minute call. You leave with a clear plan, even if we don't work together.</small></p>
        <div class="hero-cta"><a class="btn btn--accent btn--sm" href="/case-studies/${d.id.replace('dlg-', '')}">Read the full case study ${icon('arrow')}</a><a class="btn btn--line btn--sm" href="/contact#book">${esc(oldBtn ? oldBtn.textContent.trim() : 'Book a strategy call')}</a>
        <a class="btn btn--line btn--sm" href="https://wa.me/${C.whatsapp}?text=${encodeURIComponent('Hi Laolu, I saw your case study "' + (($('h2', body) || {}).textContent || '') + '" and I want something similar.')}" target="_blank" rel="noopener">WhatsApp me</a></div>`;
      body.appendChild(cta);
      // progress bar + controls
      const prog = $('.dlg-progress', bar);
      sc.addEventListener('scroll', () => { const m = sc.scrollHeight - sc.clientHeight; prog.style.width = (m > 0 ? sc.scrollTop / m * 100 : 0) + '%'; }, { passive: true });
      $('[data-prev]', bar).addEventListener('click', () => step(d, -1));
      $('[data-next]', bar).addEventListener('click', () => step(d, 1));
      $$('[data-close]', d).forEach(b => b.addEventListener('click', () => d.close()));
      d.addEventListener('click', e => { if (e.target === d) d.close(); });
      d.addEventListener('keydown', e => {
        if (e.target.closest('input, textarea, select, .dlg-tabs')) return;
        if (e.key === 'ArrowRight') step(d, 1); if (e.key === 'ArrowLeft') step(d, -1);
      });
      d.addEventListener('close', () => { if (!d.dataset.swap) { history.replaceState(null, '', location.pathname + location.search); } delete d.dataset.swap; });
    };
    const openCase = (id, from) => {
      const d = document.getElementById(id); if (!d || !d.showModal) return;
      enhance(d);
      const list = order(), i = list.indexOf(id), total = list.length || caseDialogs.length;
      $('[data-n]', d).textContent = `Case ${String((i < 0 ? 0 : i) + 1).padStart(2, '0')} / ${total}`;
      if (from) { from.dataset.swap = '1'; from.close(); }
      d.showModal(); $('.dlg-scroll', d).scrollTop = 0; $('.dlg-progress', d).style.width = '0';
      const firstTab = $('.dlg-tab', d); if (firstTab && firstTab.getAttribute('aria-selected') !== 'true') firstTab.click();
      history.replaceState(null, '', '#' + id.replace('dlg-', ''));
    };
    const step = (d, dir) => { const list = order(); if (list.length < 2) return; const i = list.indexOf(d.id); openCase(list[(i + dir + list.length) % list.length], d); };
    $$('[data-open]').forEach(btn => btn.addEventListener('click', e => { e.preventDefault(); openCase(btn.dataset.open); }));
    // the whole card image and title open the case too
    $$('.case').forEach(card => {
      const b = $('[data-open]', card); if (!b) return;
      [$('.case-media', card), $('h3', card)].forEach(el => el && el.addEventListener('click', () => openCase(b.dataset.open)));
    });
    if (location.hash && document.getElementById('dlg-' + location.hash.slice(1))) setTimeout(() => openCase('dlg-' + location.hash.slice(1)), 300);
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
      const btn = $('button[type="submit"]', form), lab = $('.btn-text', btn); btn.disabled = true; lab.textContent = 'Booking…';
      const show = html => { result.innerHTML = html; step2.hidden = true; result.classList.add('is-on'); result.focus && result.focus(); };
      const msg = `Hi Laolu, I'd like to book a strategy call on ${label} (${tz}).\n\nName: ${fd.name}\nEmail: ${fd.email}${fd.phone ? '\nPhone: ' + fd.phone : ''}${fd.company ? '\nCompany: ' + fd.company : ''}\nTopic: ${fd.topic}${fd.notes ? '\n\n' + fd.notes : ''}`;
      try {
        if (!C.endpoint) throw Object.assign(new Error('offline'), { offline: true });
        const r = await fetch(C.endpoint, { method: 'POST', body: JSON.stringify({ type: 'booking', start: chosen, tz, localLabel: label, ...fd }) });
        const j = await r.json();
        if (!j.ok) { toast(j.error || 'That time is no longer available.'); btn.disabled = false; lab.textContent = 'Confirm booking'; step2.hidden = true; step1.hidden = false; load(); return; }
        window.llTrack && llTrack('book_call', { method: 'calendar' });
        show(`<h3>You're booked. See you then.</h3><p><strong>${esc(label)}</strong> (${esc(tz.replace(/_/g, ' '))}). A calendar invite${j.meet ? ' with a Google Meet link' : ''} is on its way to <strong>${esc(fd.email)}</strong>.</p>${j.meet ? `<div class="hero-cta"><a class="btn btn--solid btn--sm" href="${esc(j.meet)}" target="_blank" rel="noopener">Open Meet link</a></div>` : ''}`);
        form.reset();
      } catch (err) {
        show(`<h3>Almost done: confirm your time</h3><p>Send this request and I'll confirm <strong>${esc(label)}</strong> (${esc(tz.replace(/_/g, ' '))}) with a calendar invite, usually within an hour.</p><div class="hero-cta"><a class="btn btn--accent btn--sm" href="${waLink(msg)}" target="_blank" rel="noopener">Confirm on WhatsApp</a><a class="btn btn--line btn--sm" href="${mailLink('Strategy call request: ' + label, msg)}">Confirm by email</a></div>`);
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
      const btn = $('button[type="submit"]', cf), lab = $('.btn-text', btn); btn.disabled = true; lab.textContent = 'Sending…';
      const msg = `Hi Laolu, I'm ${data.name}${data.company ? ' from ' + data.company : ''}.\n\n${data.message}\n\nServices: ${data.services || '-'}\nCRM: ${data.crm || '-'}\nTimeline: ${data.timeline || '-'}\nEmail: ${data.email}${data.phone ? '\nPhone: ' + data.phone : ''}`;
      const show = html => { result.innerHTML = html; cf.hidden = true; result.classList.add('is-on'); };
      try {
        if (!C.endpoint) throw Object.assign(new Error('offline'), { offline: true });
        const r = await fetch(C.endpoint, { method: 'POST', body: JSON.stringify({ type: 'contact', ...data }) });
        const j = await r.json(); if (!j.ok) throw new Error(j.error || 'failed');
        window.llTrack && llTrack('generate_lead', { form: 'contact' });
        show(`<h3>Message received. Thank you, ${esc(data.name.split(' ')[0])}.</h3><p>A confirmation is on its way to ${esc(data.email)}. I'll reply personally, usually within an hour.</p><div class="hero-cta"><a class="btn btn--line btn--sm" href="work.html">Browse case studies</a></div>`);
        cf.reset();
      } catch (err) {
        if (err.offline) show(`<h3>Your message is ready to send</h3><p>Choose how you'd like to send it. Everything you typed is already filled in.</p><div class="hero-cta"><a class="btn btn--accent btn--sm" href="${waLink(msg)}" target="_blank" rel="noopener">Send on WhatsApp</a><a class="btn btn--line btn--sm" href="${mailLink('Project enquiry from ' + data.name, msg)}">Send by email</a></div>`);
        else { toast('Could not send right now. Opening WhatsApp instead.'); window.open(waLink(msg), '_blank', 'noopener'); }
      } finally { btn.disabled = false; lab.textContent = 'Send message'; }
    });
  }

  /* ---------- Free checklist sign-up (separate from the contact form) ---------- */
  const PDF = '/assets/downloads/crm-leak-checklist.pdf';
  $$('[data-lead-magnet]').forEach(f => {
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const name = f.elements.name.value.trim(), email = f.elements.email.value.trim();
      const bad = [[f.elements.name, name.length >= 2], [f.elements.email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)]];
      bad.forEach(([el, ok]) => { el.closest('.field').classList.toggle('has-error', !ok); el.setAttribute('aria-invalid', String(!ok)); });
      const first = bad.find(([, ok]) => !ok); if (first) { first[0].focus(); $('.lm-note', f).textContent = 'Please add your first name and a valid email.'; return; }
      const btn = $('button[type="submit"]', f), lab = $('.btn-text', btn); btn.disabled = true; lab.textContent = 'Preparing your download…';
      if (C.endpoint && !f.elements.website_url.value) {
        try { await fetch(C.endpoint, { method: 'POST', body: JSON.stringify({ type: 'resource', resource: 'CRM Leak Checklist', name, email, services: 'Free checklist', message: 'Requested the free CRM Leak Checklist (PDF).', page: location.pathname, website_url: f.elements.website_url.value }) }); } catch (err) {}
      }
      window.llTrack && llTrack('generate_lead', { form: 'checklist' });
      const box = f.closest('.lm');
      f.outerHTML = `<div class="lm-done" role="status"><b>It's yours, ${esc(name.split(' ')[0])}.</b><p>Your download should start now. A copy is on its way to ${esc(email)}.</p><div class="hero-cta"><a class="btn btn--accent btn--sm" href="${PDF}" download>Download the PDF</a><a class="btn btn--line btn--sm" href="/contact#book">Book a free review call</a></div></div>`;
      box.classList.add('is-done');
      const a = document.createElement('a'); a.href = PDF; a.download = 'Laolu-Logic-CRM-Leak-Checklist.pdf'; document.body.appendChild(a); a.click(); a.remove();
    });
  });
  /* ---------- Copy to clipboard ---------- */
  $$('[data-copy]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); navigator.clipboard && navigator.clipboard.writeText(b.dataset.copy).then(() => toast('Copied: ' + b.dataset.copy)); }));

  /* =========================================================
     MOTION: native and lightweight. Content is visible by default;
     only blocks below the first screen fade in once.
     ========================================================= */
  const counters = $$('[data-count]');
  const fmtCount = (el, v) => { const dec = (el.dataset.count.split('.')[1] || '').length; return (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US')) + (el.dataset.suffix || ''); };
  const runCount = el => {
    const end = parseFloat(el.dataset.count); if (reduce) { el.textContent = fmtCount(el, end); return; }
    const t0 = performance.now(), dur = 1400;
    const step = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = fmtCount(el, end * e); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target; io.unobserve(el);
      if (el.hasAttribute('data-count')) runCount(el);
      if (el.classList.contains('process')) el.classList.add('is-drawn');
      el.classList.add('is-visible');
    }), { rootMargin: '0px 0px -6% 0px' });
    if (!reduce) $$('[data-reveal], [data-clip], [data-split]').forEach(el => { if (!el.closest('.hero, .page-hero, .art-hero') && el.getBoundingClientRect().top > innerHeight) { el.classList.add('rv'); io.observe(el); } });
    counters.forEach(el => io.observe(el));
    $$('.process').forEach(el => io.observe(el));
  } else counters.forEach(el => { el.textContent = fmtCount(el, parseFloat(el.dataset.count)); });

  /* Reading progress bar */
  const bar = $('.progress');
  if (bar) { const upd = () => { const m = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${m > 0 ? Math.min(1, scrollY / m) : 0})`; }; addEventListener('scroll', upd, { passive: true }); upd(); }
})();