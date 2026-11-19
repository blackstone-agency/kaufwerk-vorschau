/* KaufWerk – Effekte: Showroom, Story, Kipp-Karten, Galerie-Lupe, Liefertermin. Ohne Abhängigkeiten. */
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Showroom: Produkt-Bühne mit Auto-Wechsel, Wischen und Maus-Parallaxe */
  document.querySelectorAll('[data-showroom]').forEach((root) => {
    const slides = [...root.querySelectorAll('[data-slide]')];
    const thumbs = [...root.querySelectorAll('[data-go]')];
    const interval = (Number(root.dataset.interval) || 7) * 1000;
    root.style.setProperty('--sr-duration', `${interval}ms`);
    let index = 0;
    let timer = null;
    let paused = false;

    const tick = () => {
      clearTimeout(timer);
      root.classList.remove('is-ticking');
      if (reduce || paused || slides.length < 2) return;
      void root.offsetWidth;
      root.classList.add('is-ticking');
      timer = setTimeout(() => show(index + 1), interval);
    };
    const show = (i) => {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, n) => {
        const on = n === index;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', String(!on));
        s.inert = !on;
      });
      thumbs.forEach((t, n) => {
        t.classList.toggle('is-active', n === index);
        t.setAttribute('aria-current', String(n === index));
      });
      tick();
    };
    const pause = () => { paused = true; tick(); };
    const resume = () => { paused = false; tick(); };

    thumbs.forEach((t) => t.addEventListener('click', () => show(Number(t.dataset.go))));
    root.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') pause(); });
    root.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') resume(); });
    root.addEventListener('focusin', pause);
    root.addEventListener('focusout', (e) => { if (!root.contains(e.relatedTarget)) resume(); });
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') show(index + 1);
      if (e.key === 'ArrowLeft') show(index - 1);
    });

    let startX = null;
    root.addEventListener('pointerdown', (e) => { startX = e.clientX; });
    root.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    });

    if (fine && !reduce) {
      root.addEventListener('pointermove', (e) => {
        const r = root.getBoundingClientRect();
        root.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        root.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
      }, { passive: true });
    }
    show(0);
  });

  /* Story: Bild reagiert auf den aktiven Abschnitt */
  if ('IntersectionObserver' in window) {
    document.querySelectorAll('[data-story]').forEach((root) => {
      const steps = [...root.querySelectorAll('[data-step]')];
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const i = steps.indexOf(en.target);
          root.dataset.active = String(i);
          root.style.setProperty('--story-progress', ((i + 1) / steps.length).toFixed(3));
          steps.forEach((s, n) => s.classList.toggle('is-active', n === i));
        });
      }, { rootMargin: '-45% 0px -45% 0px' });
      steps.forEach((s) => io.observe(s));
    });
  }

  /* Karten neigen sich zur Maus */
  if (fine && !reduce) {
    document.addEventListener('pointermove', (e) => {
      const card = e.target.closest('[data-tilt]');
      if (!card) return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--rx', `${((0.5 - py) * 7).toFixed(2)}deg`);
      card.style.setProperty('--ry', `${((px - 0.5) * 9).toFixed(2)}deg`);
      card.style.setProperty('--px', `${(px * 100).toFixed(1)}%`);
      card.style.setProperty('--py', `${(py * 100).toFixed(1)}%`);
    }, { passive: true });
    document.addEventListener('pointerout', (e) => {
      const card = e.target.closest('[data-tilt]');
      if (card && !card.contains(e.relatedTarget)) {
        card.style.removeProperty('--rx');
        card.style.removeProperty('--ry');
      }
    });
  }

  /* Galerie-Lupe */
  if (fine) {
    document.querySelectorAll('.gallery__slide').forEach((slide) => {
      const img = slide.querySelector('img');
      if (!img) return;
      slide.addEventListener('pointermove', (e) => {
        const r = slide.getBoundingClientRect();
        img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
        slide.classList.add('is-zoom');
      });
      slide.addEventListener('pointerleave', () => slide.classList.remove('is-zoom'));
    });
  }

})();
