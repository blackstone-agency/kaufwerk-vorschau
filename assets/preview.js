(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const toast = (msg) => { let t = $('.kw-toast'); if (!t) { t = document.createElement('div'); t.className = 'kw-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('is-visible'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('is-visible'), 2800); };
  const euro = (n) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const cart = [];
  const drawer = $('#DemoCart');
  const render = (added) => {
    const total = cart.reduce((s, p) => s + p.priceValue * p.qty, 0);
    const free = window.KW_FREE || 0;
    const progress = Math.min(1, total / free);
    const xsell = window.KW_PRODUCTS.filter((p) => !cart.some((c) => c.handle === p.handle)).sort(() => 0.5 - Math.random()).slice(0, 3);
    $('[data-demo-body]').innerHTML = (added ? '<div class="added"><strong>✓ Gute Wahl!</strong> Liegt im Warenkorb. <span data-delivery data-min="2" data-max="4"></span></div>' : '')
      + `<div class="ship-progress"><p>${total >= free ? '<strong>Kostenloser Versand</strong> – Grenze erreicht.' : `Noch <strong>${euro(free - total)}</strong> bis zum <strong>kostenlosen Versand</strong>`}</p>`
      + `<div class="ship-progress__bar"><span style="--p:${progress}"></span></div></div>`
      + (total < free ? `<div class="gap" data-gap="${Math.round((free - total) * 100)}" data-exclude="${cart.map((c) => c.handle).join(',')}" hidden></div>` : '')
      + cart.map((p) => `<div class="demo-line"><img src="${esc(p.image)}" alt=""><span><strong>${esc(p.vendor)}</strong><br>${esc(p.title)} × ${p.qty}</span><span class="demo-line__price"><s class="price__was">${euro(p.regular * p.qty)}</s><strong class="cart-line__price is-promo">${euro(p.priceValue * p.qty)}</strong></span></div>`).join('')
      + `<div class="xsell"><p class="xsell__title">Passt dazu</p><ul>${xsell.map((p) => `<li><a class="mini" href="${esc(p.url)}"><span class="mini__img"><img src="${esc(p.image)}" alt=""></span><span class="mini__text"><span class="mini__vendor">${esc(p.vendor)}</span><span class="mini__title">${esc(p.title)}</span><span class="mini__price">${esc(p.price)}</span></span></a></li>`).join('')}</ul></div>`;
    const saved = cart.reduce((s, p) => s + (p.regular - p.priceValue) * p.qty, 0);
    $('[data-demo-foot]').innerHTML = (saved > 0 ? `<p class="cart-saved">Durch Aktionen gespart: ${euro(saved)}</p>` : '') + `<div class="cart-summary"><div class="cart-summary__row"><span>Zwischensumme</span><span class="cart-summary__total">${euro(total)}</span></div>`
      + '<p class="cart-summary__note">inkl. MwSt., zzgl. Versandkosten.</p></div><label class="gift"><input type="checkbox"> Das ist ein Geschenk (ohne Preise im Paket)</label><button type="button" class="btn btn--block" data-demo="Vorschau: Hier geht es im Shop zur sicheren Shopify-Kasse.">Sicher zur Kasse</button>';
    document.querySelectorAll('[data-demo-count]').forEach((c) => { const n = cart.reduce((s, p) => s + p.qty, 0); c.textContent = n || ''; c.dataset.count = n; });
    if (window.KW_BOOST) window.KW_BOOST.fillGap();
  };
  const open = () => { drawer.classList.add('is-open'); drawer.setAttribute('aria-hidden', 'false'); document.body.classList.add('is-locked'); };
  const close = () => { drawer.classList.remove('is-open'); drawer.setAttribute('aria-hidden', 'true'); document.body.classList.remove('is-locked'); };
  const goTo = (id) => { const s = document.getElementById(id); if (!s) return; const t = s.parentElement; t.scrollTo({ left: s.offsetLeft - t.offsetLeft, behavior: 'smooth' });
    document.querySelectorAll('[data-thumb]').forEach((b) => b.setAttribute('aria-current', String(b.dataset.thumb === id))); };
  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-demo-add]');
    if (add) { const p = window.KW_PRODUCTS.find((x) => x.handle === add.dataset.demoAdd); if (p) { const c = cart.find((x) => x.handle === p.handle); if (c) c.qty += 1; else cart.push({ ...p, qty: 1 }); render(true); setTimeout(open, 650); } return; }
    if (e.target.closest('[data-demo-open]')) { e.preventDefault(); render(false); open(); return; }
    const chip = e.target.closest('[data-chip-vendor]');
    if (chip) { const on = !chip.classList.contains('is-on'); document.querySelectorAll('[data-chip-vendor]').forEach((c) => c.classList.remove('is-on')); chip.classList.toggle('is-on', on);
      document.querySelectorAll('li[data-vendor]').forEach((li) => { li.hidden = on && li.dataset.vendor !== chip.dataset.chipVendor; }); return; }
    if (e.target.closest('[data-demo-close]')) { close(); return; }
    const d = e.target.closest('[data-demo]'); if (d) { e.preventDefault(); toast(d.dataset.demo); return; }
    const th = e.target.closest('[data-thumb]'); if (th) goTo(th.dataset.thumb);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  document.addEventListener('change', (e) => { const r = e.target.closest('.option input'); if (r) { const l = r.closest('fieldset').querySelector('legend span'); if (l) l.textContent = r.value; } });
  const h = document.querySelector('.site-header');
  if (h) { const f = () => h.classList.toggle('is-scrolled', window.scrollY > 8); window.addEventListener('scroll', f, { passive: true }); f(); }
  const main = document.querySelector('[data-main-buy]'); const sticky = document.querySelector('[data-sticky-buy]');
  if (main && sticky && 'IntersectionObserver' in window) new IntersectionObserver(([en]) => sticky.classList.toggle('is-visible', !en.isIntersecting && en.boundingClientRect.top < 0)).observe(main);
})();
