/* Laolu Logic: interaction layer. Dependency-free, respects reduced motion,
   and every effect is decorative: content stays readable without it. */
(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const raf = fn => { let q = false; return (...a) => { if (q) return; q = true; requestAnimationFrame(() => { q = false; fn(...a); }); }; };

  /* ---------- 1. Hero backdrop: aurora, grid, workflow lines, pointer spotlight ---------- */
  const flowSVG = `<svg class="hfx-flow" viewBox="0 0 1200 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id="hfxg" x1="0" x2="1"><stop offset="0" stop-color="currentColor" stop-opacity="0"/><stop offset=".5" stop-color="currentColor"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>
    <path id="hf1" d="M620 90 C 760 90, 780 250, 930 250 S 1110 160, 1260 170"/>
    <path id="hf2" d="M560 330 C 720 330, 760 420, 900 420 S 1080 330, 1260 360"/>
    <path id="hf3" d="M700 560 C 820 560, 860 470, 980 470 S 1120 560, 1260 540"/>
    <path d="M930 250 C 930 320, 900 360, 900 420" class="hf-v"/>
    <g class="hf-nodes"><rect x="905" y="236" width="50" height="28" rx="8"/><rect x="875" y="406" width="50" height="28" rx="8"/><rect x="955" y="456" width="50" height="28" rx="8"/><circle cx="620" cy="90" r="4"/><circle cx="560" cy="330" r="4"/><circle cx="700" cy="560" r="4"/></g>
    <g class="hf-pulses">
      <circle r="3.5"><animateMotion dur="5.5s" repeatCount="indefinite"><mpath href="#hf1"/></animateMotion></circle>
      <circle r="3.5"><animateMotion dur="7s" begin="-2s" repeatCount="indefinite"><mpath href="#hf2"/></animateMotion></circle>
      <circle r="3.5"><animateMotion dur="6.2s" begin="-4s" repeatCount="indefinite"><mpath href="#hf3"/></animateMotion></circle>
    </g></svg>`;
  $$('.hero, .page-hero, .art-hero').forEach(h => {
    if ($('.hfx', h)) return;
    const fx = document.createElement('div');
    fx.className = 'hfx'; fx.setAttribute('aria-hidden', 'true');
    fx.innerHTML = `<div class="hfx-aurora"><i></i><i></i><i></i></div><div class="hfx-grid"></div>${h.classList.contains('art-hero') ? '' : flowSVG}<div class="hfx-spot"></div>`;
    h.prepend(fx);
    if (fine && !reduce) {
      const move = raf(e => { const r = h.getBoundingClientRect(); h.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%'); h.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%'); });
      h.addEventListener('pointermove', e => { h.classList.add('is-lit'); move(e); });
      h.addEventListener('pointerleave', () => h.classList.remove('is-lit'));
    }
  });

  /* ---------- 2. Split headings into words for staggered reveals ---------- */
  const splitWords = el => {
    if (el.dataset.splitDone) return; el.dataset.splitDone = '1';
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/); const frag = document.createDocumentFragment();
          parts.forEach(p => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            const w = document.createElement('span'); w.className = 'w'; const s = document.createElement('span'); s.textContent = p; s.style.setProperty('--i', i++); w.appendChild(s); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains('rot') && n.tagName !== 'BR') walk(n);
        else if (n.nodeType === 1 && n.classList.contains('rot')) { const w = document.createElement('span'); w.className = 'w w--rot'; n.replaceWith(w); w.appendChild(n); n.style.setProperty('--i', i++); }
      });
    };
    walk(el); el.classList.add('is-split');
  };
  if (!reduce) {
    $$('.hero h1, .page-hero h1, .art-hero h1').forEach(h => { splitWords(h); h.classList.add('h-in'); });
    $$('[data-split]').forEach(el => { if (!el.closest('.hero, .page-hero, .art-hero')) splitWords(el); });
  }

  /* ---------- 3. Home: rotating phrase in the headline ---------- */
  const rot = $('.rot[data-rotate]');
  if (rot) {
    const words = rot.dataset.rotate.split('|'); let k = 0;
    rot.innerHTML = `<span class="rot-track">${words.map((w, j) => `<span class="rot-w${j === 0 ? ' is-on' : ''}"${j ? ' aria-hidden="true"' : ''}>${w}</span>`).join('')}</span>`;
    const items = $$('.rot-w', rot);
    const h1 = rot.closest('h1');
    const fit = () => { const on = items[k]; rot.style.width = on.offsetWidth + 'px'; };
    // reserve the tallest wrap so the page below never jumps when the phrase changes
    const reserve = () => { if (!h1) return; h1.style.minHeight = ''; let max = 0; rot.style.transition = 'none'; items.forEach(it => { rot.style.width = it.offsetWidth + 'px'; max = Math.max(max, h1.offsetHeight); }); h1.style.minHeight = max + 'px'; fit(); void rot.offsetWidth; rot.style.transition = ''; };
    requestAnimationFrame(reserve); (document.fonts && document.fonts.ready || Promise.resolve()).then(reserve); addEventListener('resize', raf(reserve));
    if (!reduce) setInterval(() => {
      if (document.hidden) return;
      const prev = items[k]; k = (k + 1) % items.length; const next = items[k];
      prev.classList.remove('is-on'); prev.classList.add('is-out'); next.classList.remove('is-out'); next.classList.add('is-on');
      setTimeout(() => prev.classList.remove('is-out'), 700); fit();
    }, 2600);
  }

  /* ---------- 4. Home: live activity feed beside the portrait ---------- */
  const feed = $('[data-live-feed]');
  if (feed) {
    const items = [
      ['bolt', 'New Zillow lead', 'Texted back in 6 seconds'],
      ['phone', 'AI agent answered a call', 'Qualified and booked for Tue 2:30 PM'],
      ['msg', 'Follow-up #4 sent', 'Sarah replied: "Can we see it Saturday?"'],
      ['refresh', 'Old lead re-engaged', 'Hand-raiser alert sent to the agent'],
      ['cal', 'Appointment confirmed', 'Reminder texts scheduled automatically']
    ];
    const icon = { bolt: 'M13 2 4 14h7l-1 8 9-12h-7z', phone: 'M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z', msg: 'M4 4h16v12H7l-3 3z', refresh: 'M17.7 6.3A8 8 0 1 0 20 12h-2a6 6 0 1 1-1.8-4.3L13 11h7V4z', cal: 'M7 2v2H4v18h16V4h-3V2h-2v2H9V2zm-1 8h12v10H6z' };
    let n = 0; const body = $('.lf-body', feed);
    const render = () => { const [ic, t, s] = items[n]; body.innerHTML = `<span class="lf-ic"><svg viewBox="0 0 24 24"><path d="${icon[ic]}"/></svg></span><span><b>${t}</b><small>${s}</small></span>`; };
    render();
    if (!reduce) setInterval(() => { if (document.hidden) return; feed.classList.add('is-swap'); setTimeout(() => { n = (n + 1) % items.length; render(); feed.classList.remove('is-swap'); }, 380); }, 3400);
  }

  /* ---------- 5. Portrait and photo parallax toward the pointer ---------- */
  if (fine && !reduce) $$('.portrait, .about-photo').forEach(p => {
    const host = p.closest('section') || p;
    const move = raf(e => { const r = p.getBoundingClientRect(); const x = (e.clientX - (r.left + r.width / 2)) / innerWidth, y = (e.clientY - (r.top + r.height / 2)) / innerHeight; p.style.setProperty('--px', x.toFixed(3)); p.style.setProperty('--py', y.toFixed(3)); });
    host.addEventListener('pointermove', move);
    host.addEventListener('pointerleave', () => { p.style.setProperty('--px', 0); p.style.setProperty('--py', 0); });
  });

  /* ---------- 6. Cards: soft spotlight that follows the pointer, gentle 3D tilt ---------- */
  if (fine && !reduce) {
    const glowSel = '.case, .pkg, .value, .pain, .cert, .post-card, .post-feature, .cred, .stack-cell, .pain, .channel, .rel-grid > a, .art-inline-cta, .t-card';
    const tiltSel = '.case, .pkg, .cert, .post-card, .cred';
    $$(glowSel).forEach(c => {
      if ($(':scope > .glow', c)) return;
      const g = document.createElement('span'); g.className = 'glow'; g.setAttribute('aria-hidden', 'true'); c.prepend(g); c.classList.add('has-glow');
      const tilt = c.matches(tiltSel);
      const move = raf(e => {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--gx', (x * 100).toFixed(1) + '%'); c.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
        if (tilt) c.style.setProperty('--tilt', `perspective(900px) rotateX(${((.5 - y) * 4).toFixed(2)}deg) rotateY(${((x - .5) * 5).toFixed(2)}deg)`);
      });
      c.addEventListener('pointermove', move);
      c.addEventListener('pointerleave', () => { c.style.removeProperty('--tilt'); });
      if (tilt) c.classList.add('has-tilt');
    });
  }

  /* ---------- 7. Case cards: a "view" bubble that follows the cursor over the image ---------- */
  if (fine && !reduce) $$('.case .case-media').forEach(m => {
    const card = m.closest('.case'); const isLink = card.tagName === 'A';
    const b = document.createElement('span'); b.className = 'case-cursor'; b.setAttribute('aria-hidden', 'true');
    b.innerHTML = `<svg viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9"/></svg>${isLink ? 'View' : 'Open'}`;
    m.appendChild(b); m.classList.add('has-cursor');
    const move = raf(e => { const r = m.getBoundingClientRect(); b.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px) translate(-50%, -50%) scale(1)`; });
    m.addEventListener('pointerenter', e => { m.classList.add('is-hover'); move(e); });
    m.addEventListener('pointermove', move);
    m.addEventListener('pointerleave', () => m.classList.remove('is-hover'));
  });

  /* ---------- 8. Filter pills: a sliding highlight + staggered card entrance ---------- */
  $$('.filters').forEach(group => {
    const pills = $$('.filter', group); if (!pills.length) return;
    const ind = document.createElement('span'); ind.className = 'filter-ind'; ind.setAttribute('aria-hidden', 'true'); group.prepend(ind); group.classList.add('has-ind');
    const place = () => { const on = pills.find(p => p.getAttribute('aria-pressed') === 'true') || pills[0]; ind.style.width = on.offsetWidth + 'px'; ind.style.height = on.offsetHeight + 'px'; ind.style.transform = `translate(${on.offsetLeft}px, ${on.offsetTop}px)`; };
    place(); addEventListener('resize', raf(place));
    new MutationObserver(place).observe(group, { subtree: true, attributes: true, attributeFilter: ['aria-pressed'] });
    pills.forEach(p => p.addEventListener('click', () => {
      if (reduce || !Element.prototype.animate) return;
      requestAnimationFrame(() => {
        const grid = group.parentElement; let d = 0;
        $$('[data-cat]:not(.is-hidden), .lib-item:not([hidden]):not(.is-hidden)', grid).slice(0, 14).forEach(c => {
          c.animate([{ opacity: 0, transform: 'translateY(24px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 560, delay: d, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }); d += 45;
        });
      });
    }));
  });

  /* ---------- 9. Home services list: one highlight that glides between rows ---------- */
  $$('.svc-list').forEach(list => {
    if (!fine) return;
    const hl = document.createElement('span'); hl.className = 'svc-hl'; hl.setAttribute('aria-hidden', 'true'); list.prepend(hl); list.classList.add('has-hl');
    $$('.svc', list).forEach(row => row.addEventListener('pointerenter', () => { hl.style.transform = `translateY(${row.offsetTop}px)`; hl.style.height = row.offsetHeight + 'px'; list.classList.add('is-hl'); }));
    list.addEventListener('pointerleave', () => list.classList.remove('is-hl'));
  });

  /* ---------- 10. Scroll-linked: timeline line draw, statement fill, sticky service nav progress ---------- */
  const tl = $('.timeline');
  const fillEls = $$('[data-fill]');
  if (!reduce) fillEls.forEach(el => {
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) { const f = document.createDocumentFragment(); n.textContent.split(/(\s+)/).forEach(p => { if (!p) return; if (/^\s+$/.test(p)) f.appendChild(document.createTextNode(p)); else { const s = document.createElement('span'); s.className = 'word'; s.textContent = p; f.appendChild(s); } }); n.replaceWith(f); }
      else if (n.nodeType === 1) walk(n);
    });
    walk(el); el.classList.add('is-fill');
  });
  const svcBlocks = $$('.svc-block'); const svcNav = $('.svc-nav');
  if (svcNav && svcBlocks.length) { const pr = document.createElement('span'); pr.className = 'svc-prog'; pr.innerHTML = '<i></i>'; svcNav.appendChild(pr); }
  if (tl) { tl.classList.add('tl--live'); const line = document.createElement('span'); line.className = 'tl-line'; line.setAttribute('aria-hidden', 'true'); tl.prepend(line); }
  const onScroll = raf(() => {
    const vh = innerHeight;
    if (tl) {
      const r = tl.getBoundingClientRect(); const p = Math.max(0, Math.min(1, (vh * .62 - r.top) / r.height));
      tl.style.setProperty('--tlp', p.toFixed(3));
      $$('.tl', tl).forEach(item => item.classList.toggle('is-on', item.getBoundingClientRect().top < vh * .62));
    }
    fillEls.forEach(el => {
      const ws = $$('.word', el); if (!ws.length) return; const r = el.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (vh * .85 - r.top) / (r.height + vh * .35)));
      const lit = Math.round(p * ws.length); ws.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
    });
    if (svcNav && svcBlocks.length) {
      const first = svcBlocks[0].getBoundingClientRect(), last = svcBlocks[svcBlocks.length - 1].getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (vh * .4 - first.top) / (last.bottom - first.top)));
      svcNav.style.setProperty('--sp', p.toFixed(3));
    }
  });
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();

  /* ---------- 11. Tabs (real estate "who it's for") ---------- */
  $$('[data-tabs]').forEach(w => {
    const tabs = $$('[role="tab"]', w), panels = $$('[role="tabpanel"]', w);
    const ind = $('.tab-ind', w);
    const sel = t => {
      tabs.forEach(x => { const on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; });
      panels.forEach(p => { const on = p.id === t.getAttribute('aria-controls'); p.hidden = !on; if (on && !reduce && p.animate) p.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' }); });
      if (ind) { ind.style.width = t.offsetWidth + 'px'; ind.style.transform = `translateX(${t.offsetLeft}px)`; }
    };
    tabs.forEach((t, i) => { t.addEventListener('click', () => sel(t)); t.addEventListener('keydown', e => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return; e.preventDefault(); const n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); sel(n); }); });
    requestAnimationFrame(() => sel(tabs.find(t => t.getAttribute('aria-selected') === 'true') || tabs[0]));
    addEventListener('resize', raf(() => sel(tabs.find(t => t.getAttribute('aria-selected') === 'true'))));
  });

  /* ---------- 12. Platform explorer (real estate): pick a platform, read what I do there ---------- */
  $$('[data-explorer]').forEach(w => {
    const cells = $$('[data-detail]', w), out = $('.explorer-out', w);
    const show = c => {
      cells.forEach(x => { x.classList.toggle('is-active', x === c); x.setAttribute('aria-pressed', String(x === c)); });
      out.innerHTML = `<strong>${c.querySelector('strong').textContent}</strong><p>${c.dataset.detail}</p>`;
      if (!reduce && out.animate) out.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'ease-out' });
    };
    cells.forEach(c => { c.addEventListener('click', () => show(c)); if (fine) c.addEventListener('pointerenter', () => show(c)); });
    if (cells[0]) show(cells[0]);
  });

  /* ---------- 13. Buttons: ripple from the click point ---------- */
  if (!reduce) document.addEventListener('pointerdown', e => {
    const b = e.target.closest('.btn, .filter, [role="tab"]'); if (!b) return;
    const r = b.getBoundingClientRect(); const s = document.createElement('span'); s.className = 'ripple';
    const d = Math.max(r.width, r.height) * 2; s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    b.appendChild(s); setTimeout(() => s.remove(), 650);
  });

  /* ---------- 14. Custom cursor: a precise dot and a soft ring that reacts to what's underneath ---------- */
  if (fine && !reduce) {
    const dot = document.createElement('div'), ring = document.createElement('div');
    dot.className = 'cur-dot'; ring.className = 'cur-ring'; ring.innerHTML = '<span></span>';
    dot.setAttribute('aria-hidden', 'true'); ring.setAttribute('aria-hidden', 'true');
    document.body.append(ring, dot); document.documentElement.classList.add('has-cur');
    const label = ring.firstChild;
    let mx = -100, my = -100, rx = -100, ry = -100, running = false, shown = false;
    const loop = () => {
      rx += (mx - rx) * .2; ry += (my - ry) * .2;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      if (Math.abs(mx - rx) + Math.abs(my - ry) > .2) requestAnimationFrame(loop); else running = false;
    };
    const setState = t => {
      const el = t && t.closest ? t : null;
      const field = el && el.closest('input, textarea, select, [contenteditable="true"], .bk-times, iframe');
      const media = el && el.closest('.case-media.has-cursor');
      const drag = el && el.closest('[data-rail] .t-rail, .t-rail');
      const act = el && el.closest('a, button, [role="tab"], label, summary, .lib-item, [data-zoom], [data-open]');
      document.documentElement.classList.toggle('cur-off', !!(field || media));
      ring.classList.toggle('is-act', !!act && !drag);
      ring.classList.toggle('is-drag', !!drag && !act);
      label.textContent = drag && !act ? 'Drag' : '';
    };
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      if (!shown) { shown = true; rx = mx; ry = my; document.documentElement.classList.add('cur-on'); }
      if (!running) { running = true; requestAnimationFrame(loop); }
    }, { passive: true });
    document.addEventListener('pointerover', e => setState(e.target), { passive: true });
    document.addEventListener('pointerdown', () => ring.classList.add('is-down'));
    document.addEventListener('pointerup', () => ring.classList.remove('is-down'));
    document.addEventListener('mouseleave', () => { document.documentElement.classList.remove('cur-on'); shown = false; });
    document.addEventListener('mouseenter', () => document.documentElement.classList.add('cur-on'));
  }

  /* ---------- 15. Magnetic pull on the main calls to action ---------- */
  if (fine && !reduce) $$('.hero-cta .btn--accent, .f-cta .btn--accent, .site-header .btn--solid, .big-cta .btn--accent').forEach(b => {
    const move = raf(e => { const r = b.getBoundingClientRect(); const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2); b.style.transform = `translate(${(x * .18).toFixed(1)}px, ${(y * .28).toFixed(1)}px)`; });
    b.addEventListener('pointermove', move);
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    b.classList.add('is-magnetic');
  });

  /* ---------- 16. Hero depth: layers drift at different speeds while you scroll ---------- */
  if (!reduce) {
    const heroes = $$('.hero, .page-hero');
    const depth = raf(() => heroes.forEach(h => {
      const r = h.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      h.style.setProperty('--sy', Math.max(0, -r.top).toFixed(0));
    }));
    addEventListener('scroll', depth, { passive: true }); depth();
  }

  /* ---------- 17. Click an email address: copy it as well as opening the mail app ---------- */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="mailto:"]'); if (!a || !navigator.clipboard) return;
    const addr = a.getAttribute('href').slice(7).split('?')[0];
    navigator.clipboard.writeText(addr).then(() => {
      let t = $('.toast'); if (!t) return; t.textContent = 'Email copied: ' + addr; t.classList.add('is-on'); setTimeout(() => t.classList.remove('is-on'), 2600);
    }).catch(() => {});
  });
/* ---------- 18. Phones: a slim "Book / WhatsApp" bar after the first screen ---------- */
  const mBar = $('.m-cta');
  if (mBar) {
    const foot = $('.site-footer'); const onContact = location.pathname.startsWith('/contact');
    const tick = raf(() => { const fr = foot ? foot.getBoundingClientRect().top : 1e9; mBar.classList.toggle('is-on', !onContact && scrollY > innerHeight * .8 && fr > innerHeight); });
    addEventListener('scroll', tick, { passive: true }); tick();
  }
})();