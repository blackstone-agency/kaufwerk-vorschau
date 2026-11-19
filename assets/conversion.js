/* KaufWerk – Verkaufspsychologie: Merkliste, Zuletzt angesehen, Live-Suche, Liefertermine, Versand-Countdown,
   Willkommensrabatt, Teilen, Dialoge, Fly-to-Cart, Bestätigung, Passt-dazu, Mehr laden, Kauf-Impuls. Ohne Abhängigkeiten. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CFG = window.KW_SETTINGS || {};
  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v === null ? d : v; } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { /* privater Modus */ } }
  };
  const session = {
    get(k) { try { return sessionStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (_) { /* privater Modus */ } }
  };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const euro = (n) => Number(n).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  const mini = (p) => `<a class="mini" href="${esc(p.url)}"><span class="mini__img">${p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy">` : ''}</span>`
    + `<span class="mini__text"><span class="mini__vendor">${esc(p.vendor)}</span><span class="mini__title">${esc(p.title)}</span><span class="mini__price">${esc(p.price)}</span></span></a>`;

  let toastEl = $('.kw-toast');
  const toast = (msg) => {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'kw-toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => toastEl.classList.remove('is-visible'), 2600);
  };

  /* Liefertermine (Certainty-Effekt) – auch für nachgeladene Inhalte */
  const fmt = new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
  const addWorkdays = (n) => {
    const d = new Date();
    let left = n;
    while (left > 0) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) left -= 1; }
    return d;
  };
  const delivery = () => $$('[data-delivery]:not([data-done])').forEach((el) => {
    const min = Number(el.dataset.min || CFG.deliveryMin);
    const max = Number(el.dataset.max || CFG.deliveryMax);
    if (!min || !max || max < min) return;
    el.dataset.done = '1';
    el.textContent = el.hasAttribute('data-short')
      ? `Lieferbar · bei dir bis ${fmt.format(addWorkdays(max))}`
      : `Lieferung voraussichtlich ${fmt.format(addWorkdays(min))} – ${fmt.format(addWorkdays(max))}`;
  });
  delivery();
  new MutationObserver(delivery).observe(document.body, { childList: true, subtree: true });

  /* Versand-Countdown bis Annahmeschluss (echte, zeitliche Dringlichkeit) */
  const cutoffText = (h) => {
    const now = new Date();
    const workday = now.getDay() >= 1 && now.getDay() <= 5;
    if (workday && now.getHours() < h) {
      const end = new Date(now);
      end.setHours(h, 0, 0, 0);
      const m = Math.max(1, Math.round((end - now) / 60000));
      return `Bestellst du in den nächsten <strong>${Math.floor(m / 60)} Std. ${m % 60} Min.</strong>, geht dein Paket heute raus.`;
    }
    const next = new Date(now);
    do { next.setDate(next.getDate() + 1); } while (next.getDay() === 0 || next.getDay() === 6);
    return `Heute bestellt, Versand am <strong>${next.toLocaleDateString('de-DE', { weekday: 'long' })}</strong>.`;
  };
  $$('[data-cutoff]').forEach((el) => {
    const h = Number(el.dataset.cutoff);
    if (!h) return;
    const update = () => { el.querySelector('span').innerHTML = cutoffText(h); el.hidden = false; };
    update();
    setInterval(update, 60000);
  });

  /* Merkliste (Endowment-Effekt) */
  const WKEY = 'kw-merkliste';
  const wishlist = () => store.get(WKEY, []);
  const syncWish = () => {
    const list = wishlist();
    const handles = new Set(list.map((p) => p.handle));
    $$('[data-wish-handle]').forEach((b) => {
      const on = handles.has(b.dataset.wishHandle);
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    $$('[data-wish-count]').forEach((c) => { c.textContent = list.length ? String(list.length) : ''; c.dataset.count = String(list.length); });
    $$('[data-wishlist-grid]').forEach((g) => {
      g.innerHTML = list.length
        ? list.map((p) => `<li class="wish-item">${mini(p)}<button type="button" class="wish-item__remove" data-wish-remove="${esc(p.handle)}">Entfernen</button></li>`).join('')
        : `<li class="muted">${esc(g.dataset.empty || 'Noch nichts gemerkt.')}</li>`;
    });
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-wish-handle]');
    if (b) {
      e.preventDefault();
      const d = b.dataset;
      const list = wishlist();
      const i = list.findIndex((p) => p.handle === d.wishHandle);
      if (i > -1) list.splice(i, 1);
      else list.unshift({ handle: d.wishHandle, title: d.wishTitle, url: d.wishUrl, image: d.wishImage, price: d.wishPrice, vendor: d.wishVendor });
      store.set(WKEY, list.slice(0, 60));
      syncWish();
      toast(i > -1 ? 'Von der Merkliste entfernt' : 'Auf deiner Merkliste gespeichert ♥');
      return;
    }
    const r = e.target.closest('[data-wish-remove]');
    if (r) { store.set(WKEY, wishlist().filter((p) => p.handle !== r.dataset.wishRemove)); syncWish(); }
  });
  syncWish();

  /* Zuletzt angesehen (Mere-Exposure) + Willkommen zurück (Personalisierung) */
  const RKEY = 'kw-zuletzt';
  const summaryEl = $('script[data-product-summary]');
  let current = null;
  try { current = summaryEl ? JSON.parse(summaryEl.textContent) : null; } catch (_) { current = null; }
  const before = store.get(RKEY, []);
  if (current) store.set(RKEY, [current, ...before.filter((p) => p.handle !== current.handle)].slice(0, 12));
  $$('[data-recent]').forEach((box) => {
    const list = store.get(RKEY, []).filter((p) => !current || p.handle !== current.handle).slice(0, 6);
    const section = box.closest('section');
    if (!list.length) { if (section) section.hidden = true; return; }
    box.innerHTML = list.map((p) => `<li>${mini(p)}</li>`).join('');
    if (section) section.hidden = false;
  });
  if (!session.get('kw-session')) { session.set('kw-session', '1'); store.set('kw-besuche', store.get('kw-besuche', 0) + 1); }
  const bar = $('[data-returning]');
  const last = before[0];
  if (bar && last && store.get('kw-besuche', 0) > 1 && (!current || last.handle !== current.handle) && !session.get('kw-returning-zu')) {
    bar.innerHTML = `<div class="container returning__inner"><span>Willkommen zurück! Zuletzt angesehen: <a href="${esc(last.url)}">${esc(last.title)}</a></span>`
      + '<button type="button" class="returning__close" aria-label="Hinweis schließen">×</button></div>';
    bar.hidden = false;
    bar.addEventListener('click', (e) => { if (e.target.closest('.returning__close')) { bar.hidden = true; session.set('kw-returning-zu', '1'); } });
  }

  /* Live-Suche (Hick's Law: weniger Schritte bis zum Produkt) */
  $$('[data-predictive]').forEach((form) => {
    const input = $('input[type="search"]', form);
    if (!input) return;
    const box = document.createElement('div');
    box.className = 'predictive';
    box.hidden = true;
    form.appendChild(box);
    let timer;
    let ctrl;
    const render = (items, q) => {
      box.innerHTML = items.length
        ? `<ul>${items.map((p) => `<li>${mini(p)}</li>`).join('')}</ul><a class="predictive__all" href="${esc(form.getAttribute('action') || '/search')}?q=${encodeURIComponent(q)}">Alle Ergebnisse für „${esc(q)}“</a>`
        : `<p class="predictive__empty">Keine Treffer für „${esc(q)}“. Versuch es mit einer Marke.</p>`;
      box.hidden = false;
    };
    input.addEventListener('input', () => {
      clearTimeout(timer);
      const q = input.value.trim();
      if (q.length < 2) { box.hidden = true; return; }
      timer = setTimeout(async () => {
        if (window.KW_PRODUCTS) {
          const s = q.toLowerCase();
          render(window.KW_PRODUCTS.filter((p) => `${p.title} ${p.vendor}`.toLowerCase().includes(s)).slice(0, 6), q);
          return;
        }
        if (ctrl) ctrl.abort();
        ctrl = new AbortController();
        try {
          const res = await fetch(`/search/suggest.json?q=${encodeURIComponent(q)}&resources[type]=product&resources[limit]=6`, { signal: ctrl.signal });
          const data = await res.json();
          const products = (data.resources && data.resources.results && data.resources.results.products) || [];
          render(products.map((p) => ({ title: p.title, url: p.url, image: (p.featured_image && p.featured_image.url) || p.image, price: euro(p.price), vendor: p.vendor })), q);
        } catch (_) { /* abgebrochen */ }
      }, 180);
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') box.hidden = true; });
    document.addEventListener('click', (e) => { if (!form.contains(e.target)) box.hidden = true; });
  });

  /* Dialoge (Größenberater, Willkommensrabatt), Kopieren, Teilen */
  document.addEventListener('click', async (e) => {
    const open = e.target.closest('[data-dialog-open]');
    if (open) { const d = document.getElementById(open.dataset.dialogOpen); if (d && d.showModal) d.showModal(); return; }
    const close = e.target.closest('[data-dialog-close]');
    if (close) { const d = close.closest('dialog'); if (d) d.close(); return; }
    const copy = e.target.closest('[data-copy]');
    if (copy) { try { await navigator.clipboard.writeText(copy.dataset.copy); copy.textContent = 'Code kopiert ✓'; } catch (_) { toast(`Dein Code: ${copy.dataset.copy}`); } return; }
    const share = e.target.closest('[data-share]');
    if (share) {
      const data = { title: share.dataset.shareTitle || document.title, url: share.dataset.shareUrl || window.location.href };
      if (navigator.share) { try { await navigator.share(data); } catch (_) { /* abgebrochen */ } }
      else window.open(`https://wa.me/?text=${encodeURIComponent(`${data.title} ${data.url}`)}`, '_blank', 'noopener');
    }
  });
  $$('dialog').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));

  /* Willkommensrabatt (Reziprozität): einmalig, zeitverzögert oder beim Verlassen */
  const popup = $('[data-popup]');
  if (popup && popup.showModal && !store.get('kw-popup', false) && !/\/(cart|checkouts?)/.test(window.location.pathname)) {
    const show = () => { if (popup.open || store.get('kw-popup', false)) return; store.set('kw-popup', true); popup.showModal(); };
    setTimeout(show, (Number(popup.dataset.delay) || 25) * 1000);
    document.addEventListener('mouseout', (e) => { if (!e.relatedTarget && e.clientY < 8) show(); });
  }

  /* Frage zum Produkt: Kontaktformular vorausfüllen */
  const asked = new URLSearchParams(window.location.search).get('produkt');
  const body = $('#ContactBody');
  if (asked && body && !body.value) body.value = `Frage zu: ${asked}\n\n`;

  /* Fly-to-Cart (direktes Feedback) */
  const fly = (img) => {
    const target = $('[data-cart-icon]');
    if (!img || !target || reduce) return;
    const a = img.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const c = img.cloneNode();
    c.className = 'fly';
    Object.assign(c.style, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` });
    document.body.appendChild(c);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    c.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(0.08)`, opacity: 0.5 }],
      { duration: 720, easing: 'cubic-bezier(.6,0,.2,1)' }).onfinish = () => {
      c.remove();
      target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 320 });
    };
  };
  const flyFrom = (el) => fly((el.closest('[data-product]') || el.closest('.card') || document).querySelector('.gallery__slide img, .card__media img'));
  document.addEventListener('submit', (e) => { const f = e.target.closest('form[data-ajax-cart]'); if (f) flyFrom(f); }, true);
  document.addEventListener('click', (e) => { const d = e.target.closest('[data-demo-add]'); if (d) flyFrom(d); }, true);

  /* Nach dem Hinzufügen: Bestätigung mit Liefertermin (Peak-End) + „Passt dazu“ (Cross-Selling) */
  document.addEventListener('kw:added', async (e) => {
    const bodyEl = $('#CartDrawer .drawer__body');
    if (!bodyEl) return;
    const note = document.createElement('div');
    note.className = 'added';
    note.innerHTML = `<strong>✓ Gute Wahl!</strong> Liegt im Warenkorb. <span data-delivery data-min="${CFG.deliveryMin || ''}" data-max="${CFG.deliveryMax || ''}"></span>`;
    bodyEl.prepend(note);
    const id = e.detail && e.detail.product_id;
    if (!id) return;
    try {
      const res = await fetch(`/recommendations/products.json?product_id=${id}&limit=3`);
      const data = await res.json();
      if (!data.products || !data.products.length) return;
      const box = document.createElement('div');
      box.className = 'xsell';
      box.innerHTML = `<p class="xsell__title">Passt dazu</p><ul>${data.products.map((p) => `<li>${mini({ title: p.title, url: p.url, image: p.featured_image, price: euro(p.price / 100), vendor: p.vendor })}</li>`).join('')}</ul>`;
      bodyEl.appendChild(box);
    } catch (_) { /* ohne Vorschläge */ }
  });

  /* Mehr laden statt Seitenwechsel */
  document.addEventListener('click', async (e) => {
    const more = e.target.closest('[data-load-more]');
    if (!more) return;
    e.preventDefault();
    more.classList.add('is-loading');
    try {
      const doc = new DOMParser().parseFromString(await (await fetch(more.href)).text(), 'text/html');
      const grid = $('[data-grid]');
      doc.querySelectorAll('[data-grid] > li').forEach((li) => grid.appendChild(li));
      const next = doc.querySelector('[data-load-more]');
      if (next) { more.href = next.href; more.textContent = next.textContent; more.classList.remove('is-loading'); } else more.remove();
      syncWish();
    } catch (_) { window.location.href = more.href; }
  });

  /* Kauf-Impuls nach Zögern (Aufmerksamkeit) */
  const buy = $('[data-main-buy] [data-buy-button]');
  if (buy && !reduce) {
    let t = setTimeout(() => buy.classList.add('is-nudge'), 9000);
    ['scroll', 'pointerdown', 'keydown'].forEach((ev) => window.addEventListener(ev, () => {
      clearTimeout(t);
      if (!buy.classList.contains('is-nudge')) t = setTimeout(() => buy.classList.add('is-nudge'), 9000);
    }, { passive: true }));
  }

  /* Hinweisleiste: auf dem Handy rotieren die Vorteile */
  $$('.announcement__list').forEach((list) => {
    const items = $$('li', list);
    if (items.length < 2) return;
    let i = 0;
    setInterval(() => {
      if (window.matchMedia('(min-width: 768px)').matches) return;
      items[i].classList.remove('is-current');
      i = (i + 1) % items.length;
      items[i].classList.add('is-current');
    }, 4000);
  });
})();
