/* Laolu Logic: consent-based analytics (Google Analytics 4 + Microsoft Clarity).
   Nothing loads until the IDs are set in js/config.js AND the visitor accepts. */
(() => {
  'use strict';
  const C = window.LL || {};
  const KEY = 'll-consent';
  const enabled = !!(C.ga4 || C.clarity);
  const get = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const set = v => { try { localStorage.setItem(KEY, v); } catch (e) {} };
  let loaded = false;

  // Public helper used by the forms: llTrack('generate_lead', {...})
  window.llTrack = (name, params) => { try { if (window.gtag) gtag('event', name, params || {}); if (window.clarity) clarity('event', name); } catch (e) {} };

  const load = () => {
    if (loaded) return; loaded = true;
    if (C.ga4) {
      const s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(C.ga4); document.head.appendChild(s);
      window.dataLayer = window.dataLayer || []; window.gtag = function () { dataLayer.push(arguments); };
      gtag('js', new Date()); gtag('config', C.ga4, { anonymize_ip: true });
    }
    if (C.clarity) {
      (function (c, l, a, r, i, t, y) { c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); }; t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i; y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y); })(window, document, 'clarity', 'script', C.clarity);
    }
  };

  // Count the clicks that matter: WhatsApp, email, phone, booking links
  document.addEventListener('click', e => {
    const a = e.target.closest('a'); if (!a) return;
    const h = a.getAttribute('href') || '';
    if (h.includes('wa.me/')) llTrack('click_whatsapp', { page: location.pathname });
    else if (h.startsWith('mailto:')) llTrack('click_email', { page: location.pathname });
    else if (h.startsWith('tel:')) llTrack('click_call', { page: location.pathname });
    else if (h.includes('#book')) llTrack('click_book_call', { page: location.pathname });
  });

  // Small, non-blocking consent card
  let card;
  const show = () => {
    if (!enabled) return;
    if (!card) {
      card = document.createElement('div'); card.className = 'consent'; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', 'Cookie preferences');
      card.innerHTML = '<p>I use privacy-friendly analytics to see which pages help visitors. No ads, no selling data. <a href="/privacy">Privacy policy</a></p><div><button type="button" class="btn btn--accent btn--sm" data-c="yes">Accept</button><button type="button" class="btn btn--line btn--sm" data-c="no">Decline</button></div>';
      card.addEventListener('click', e => {
        const b = e.target.closest('[data-c]'); if (!b) return;
        const yes = b.dataset.c === 'yes'; set(yes ? 'granted' : 'denied'); card.classList.remove('is-on');
        if (yes) load(); else if (loaded) location.reload();
      });
      document.body.appendChild(card);
    }
    requestAnimationFrame(() => card.classList.add('is-on'));
  };
  document.querySelectorAll('[data-cookie-settings]').forEach(b => { if (!enabled) { b.previousSibling && b.previousSibling.nodeType === 3 && b.previousSibling.remove(); b.remove(); } else b.addEventListener('click', show); });
  if (!enabled) return;
  const c = get();
  if (c === 'granted') load();
  else if (c !== 'denied') setTimeout(show, 1800);
})();
