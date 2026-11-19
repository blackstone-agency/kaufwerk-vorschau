/* KaufWerk – Boost: Aktions-Countdown, Versand heute, Lücke bis Gratis-Versand, Lightbox, Karten-Bilder,
   Zurück nach oben, Suchverlauf & Vorschläge, Warenkorb-Erinnerung, Bottom-Navigation. Ohne Abhängigkeiten. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const CFG = window.KW_SETTINGS || {};
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v === null ? d : v; } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* privat */ } }
  };
  const sess = {
    get(k) { try { return sessionStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (_) { /* privat */ } }
  };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const euro = (n) => Number(n).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  const mini = (p) => `<a class="mini" href="${esc(p.url)}"><span class="mini__img">${p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy">` : ''}</span>`
    + `<span class="mini__text"><span class="mini__vendor">${esc(p.vendor)}</span><span class="mini__title">${esc(p.title)}</span><span class="mini__price">${esc(p.price)}</span></span></a>`;

  /* Echter Countdown bis Aktionsende (Deadline-Effekt) */
  const pad = (n) => String(n).padStart(2, '0');
  const tick = () => $$('[data-promo-end]').forEach((el) => {
    const end = new Date(`${el.dataset.promoEnd}T23:59:59`);
    const ms = end - Date.now();
    if (Number.isNaN(ms) || ms <= 0) { el.hidden = true; return; }
    const d = Math.floor(ms / 864e5);
    const h = Math.floor((ms % 864e5) / 36e5);
    const m = Math.floor((ms % 36e5) / 6e4);
    const s = Math.floor((ms % 6e4) / 1e3);
    $$('[data-countdown]', el).concat(el.hasAttribute('data-countdown') ? [el] : []).forEach((out) => {
      out.textContent = `${d > 0 ? `${d} T ` : ''}${pad(h)}:${pad(m)}:${pad(s)}`;
    });
  });
  tick();
  setInterval(tick, 1000);

  /* „Versand heute“ auf Karten bis zum Annahmeschluss */
  const cutoff = Number(CFG.cutoff || 0);
  const shipsToday = () => { const n = new Date(); return cutoff > 0 && n.getDay() >= 1 && n.getDay() <= 5 && n.getHours() < cutoff; };
  const markToday = () => { const on = shipsToday(); $$('[data-ship-today]').forEach((el) => { el.hidden = !on; }); };

  /* Lücke bis zum Gratis-Versand mit passenden Artikeln füllen (Goal-Gradient + Cross-Selling) */
  let catalog = null;
  const loadCatalog = async () => {
    if (window.KW_PRODUCTS) return window.KW_PRODUCTS;
    if (catalog) return catalog;
    try {
      const data = await (await fetch('/collections/all/products.json?limit=250')).json();
      const pct = Number(CFG.promoPercent || 0);
      catalog = data.products.filter((p) => p.variants.some((v) => v.available)).map((p) => {
        const regular = Number(p.variants[0].price);
        const pay = pct ? regular - Math.round(regular * pct) / 100 : regular;
        return { handle: p.handle, title: p.title, url: `/products/${p.handle}`, image: p.images[0] && p.images[0].src, vendor: p.vendor, priceValue: pay, price: euro(pay) };
      });
    } catch (_) { catalog = []; }
    return catalog;
  };
  const fillGap = async () => {
    const box = $('[data-gap]');
    if (!box || box.dataset.done) return;
    const remaining = Number(box.dataset.gap) / 100;
    if (!(remaining > 0)) return;
    box.dataset.done = '1';
    const inCart = (box.dataset.exclude || '').split(',');
    const list = (await loadCatalog()).filter((p) => p.priceValue >= remaining && !inCart.includes(p.handle))
      .sort((a, b) => a.priceValue - b.priceValue).slice(0, 3);
    if (!list.length) return;
    box.innerHTML = `<p class="gap__title">Damit ist dein Versand kostenlos:</p><ul>${list.map((p) => `<li>${mini(p)}</li>`).join('')}</ul>`;
    box.hidden = false;
  };
  window.KW_BOOST = { fillGap, tick };

  /* Auf DOM-Änderungen reagieren (Warenkorb neu gerendert, Artikel nachgeladen) */
  let pending = false;
  new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; markToday(); fillGap(); tick(); });
  }).observe(document.body, { childList: true, subtree: true });
  markToday();
  fillGap();

  /* Vollbild-Galerie mit Wischen */
  const lightbox = $('#Lightbox');
  if (lightbox && lightbox.showModal) {
    const track = $('.lightbox__track', lightbox);
    document.addEventListener('click', (e) => {
      const slide = e.target.closest('.gallery__slide');
      if (!slide) return;
      const slides = $$('.gallery__slide');
      track.innerHTML = slides.map((s) => { const i = $('img', s); return i ? `<div class="lightbox__slide"><img src="${esc(i.currentSrc || i.src)}" alt="${esc(i.alt)}"></div>` : ''; }).join('');
      lightbox.showModal();
      const index = slides.indexOf(slide);
      requestAnimationFrame(() => { track.scrollLeft = index * track.clientWidth; });
    });
  }

  /* Bilder auf Produktkarten: Wischen (Touch) und Maus-Scrubbing (Desktop) */
  document.addEventListener('scroll', (e) => {
    const t = e.target;
    if (!(t instanceof Element) || !t.classList.contains('card__slides')) return;
    const i = Math.round(t.scrollLeft / t.clientWidth);
    $$('.card__dots i', t.parentElement).forEach((d, n) => d.classList.toggle('is-on', n === i));
  }, { capture: true, passive: true });
  if (fine) {
    document.addEventListener('pointermove', (e) => {
      const track = e.target.closest && e.target.closest('.card__slides');
      if (!track) return;
      const n = track.children.length;
      const r = track.getBoundingClientRect();
      const i = Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * n)));
      track.scrollLeft = i * track.clientWidth;
    }, { passive: true });
  }

  /* Zurück nach oben */
  const up = document.createElement('button');
  up.type = 'button';
  up.className = 'to-top';
  up.setAttribute('aria-label', 'Nach oben');
  up.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>';
  document.body.appendChild(up);
  window.addEventListener('scroll', () => up.classList.toggle('is-visible', window.scrollY > window.innerHeight * 2), { passive: true });
  up.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* Suchverlauf und Suchvorschläge im leeren Suchfeld */
  const HKEY = 'kw-suchen';
  $$('[data-predictive]').forEach((form) => {
    const input = $('input[type="search"]', form);
    if (!input) return;
    const suggest = (form.dataset.suggest || '').split(',').map((s) => s.trim()).filter(Boolean);
    const panel = document.createElement('div');
    panel.className = 'search-hints';
    panel.hidden = true;
    form.appendChild(panel);
    const chips = (list) => `<div class="hint-chips">${list.map((q) => `<button type="button" class="chip" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>`;
    const show = () => {
      const hist = store.get(HKEY, []);
      if (input.value.trim() || (!hist.length && !suggest.length)) { panel.hidden = true; return; }
      panel.innerHTML = (hist.length ? `<p>Zuletzt gesucht</p>${chips(hist)}` : '') + (suggest.length ? `<p>Vorschläge</p>${chips(suggest)}` : '');
      panel.hidden = false;
    };
    const save = () => {
      const q = input.value.trim();
      if (q.length < 2) return;
      store.set(HKEY, [q, ...store.get(HKEY, []).filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 5));
    };
    input.addEventListener('focus', show);
    input.addEventListener('input', show);
    panel.addEventListener('click', (e) => {
      const c = e.target.closest('[data-q]');
      if (!c) return;
      input.value = c.dataset.q;
      panel.hidden = true;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
    });
    form.addEventListener('submit', save);
    form.addEventListener('click', (e) => { if (e.target.closest('.predictive a')) save(); });
    document.addEventListener('click', (e) => { if (!form.contains(e.target)) panel.hidden = true; });
  });

  /* Warenkorb-Erinnerung beim Verlassen (Verlustaversion, nur mit echtem Aktionsende) */
  document.addEventListener('mouseout', (e) => {
    if (e.relatedTarget || e.clientY > 8 || sess.get('kw-exit-cart')) return;
    const counter = $('[data-cart-count]') || $('[data-demo-count]');
    if (!counter || !Number(counter.dataset.count)) return;
    sess.set('kw-exit-cart', '1');
    const bar = document.createElement('div');
    bar.className = 'exit-cart';
    bar.setAttribute('role', 'status');
    bar.innerHTML = `<p><strong>Dein Warenkorb ist gespeichert.</strong>${CFG.promoEnd ? ` Das Einführungsangebot endet in <span data-promo-end="${esc(CFG.promoEnd)}"><b data-countdown></b></span>.` : ''}</p>`
      + '<a class="btn btn--sm" href="/cart" data-drawer-open="CartDrawer" data-demo-open>Zum Warenkorb</a><button type="button" class="icon-btn exit-cart__close" aria-label="Schließen">×</button>';
    document.body.appendChild(bar);
    bar.addEventListener('click', (ev) => { if (ev.target.closest('.exit-cart__close') || ev.target.closest('[data-demo-open]')) bar.remove(); });
    tick();
  });

  /* Bottom-Navigation: Suche fokussieren */
  document.addEventListener('click', (e) => {
    const f = e.target.closest('[data-focus-search]');
    if (!f) return;
    e.preventDefault();
    const input = $('#HeaderSearch');
    if (input) { input.scrollIntoView({ block: 'center', behavior: 'smooth' }); input.focus(); }
  });
})();
