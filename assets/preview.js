(() => {
  const toast = document.createElement('div');
  toast.className = 'kw-toast'; toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);
  let timer;
  const show = (msg) => { toast.textContent = msg; toast.classList.add('is-visible'); clearTimeout(timer); timer = setTimeout(() => toast.classList.remove('is-visible'), 2800); };
  const goTo = (id) => { const s = document.getElementById(id); if (!s) return; const t = s.parentElement; t.scrollTo({ left: s.offsetLeft - t.offsetLeft, behavior: 'smooth' });
    document.querySelectorAll('[data-thumb]').forEach((b) => b.setAttribute('aria-current', String(b.dataset.thumb === id))); };
  document.addEventListener('click', (e) => {
    const d = e.target.closest('[data-demo]'); if (d) { e.preventDefault(); show(d.dataset.demo); return; }
    const th = e.target.closest('[data-thumb]'); if (th) goTo(th.dataset.thumb);
  });
  document.addEventListener('change', (e) => {
    const r = e.target.closest('.option input'); if (!r) return;
    const l = r.closest('fieldset').querySelector('legend span'); if (l) l.textContent = r.value;
    if (r.dataset.slide) goTo(r.dataset.slide);
  });
  const h = document.querySelector('.site-header');
  if (h) { const f = () => h.classList.toggle('is-scrolled', window.scrollY > 8); window.addEventListener('scroll', f, { passive: true }); f(); }
})();
