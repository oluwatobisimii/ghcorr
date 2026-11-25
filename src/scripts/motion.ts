/* Reveal-on-scroll, hero entrances, parallax, count-ups, scroll progress.
   Skipped for reduced motion and for pages loaded in a hidden tab. */
type Reveal = 'up' | 'zoom' | 'left' | 'right' | 'img' | 'pop';

export function initMotion() {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window) || document.visibilityState === 'hidden') return;
  document.documentElement.classList.add('anim');

  const tag = (sel: string, type: Reveal = 'up', step = 0.08, base = 0) => {
    document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
      if (el.hasAttribute('data-r')) return;
      const sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.setAttribute('data-r', type);
      el.style.setProperty('--d', `${(base + Math.min(sib, 7) * step).toFixed(2)}s`);
    });
  };
  // Hero entrances
  tag('.hero-copy > *', 'up', 0.1, 0.1);
  tag('.collage .frame', 'zoom', 0.15, 0.35);
  tag('.collage .sticker', 'pop', 0, 0.9);
  tag('.a-hero .wrap > div:first-child > *', 'up', 0.1, 0.1);
  tag('.a-hero .vid', 'zoom', 0, 0.4);
  tag('.page-hero .wrap > *', 'up', 0.1, 0.1);
  tag('.dp-intro > *', 'up', 0.08, 0.1);
  tag('.maker', 'zoom', 0, 0.25);
  tag('.nextbar .wrap > *', 'up', 0.1, 0.2);
  // Section content
  tag('.sec-head > *, .sec-head > div > *', 'up', 0.1);
  tag('.welcome .pic, .pastors .portrait, .player, .promo, .map, .word .mark, .s-video', 'img');
  tag('.welcome .wrap > div:last-child > *, .message .wrap > div:last-child > *, .pastors .wrap > div:last-child > *, .venue .wrap > div:first-child > *, .word .wrap > div > *, .s-body > *', 'up', 0.08);
  tag('.facts > div', 'up', 0.1);
  tag('.step, .grid6 > *, .sched > *, .mgrid > *, .involve > *, .posters > *, .duo .wrap > *, .fgrid > *, .s-grid > *, .e-grid > *', 'up', 0.09);
  tag('.years img, .strip img', 'up', 0.07);
  tag('.vm > article', 'up', 0.12);
  tag('.float-head > *', 'up', 0.1);
  tag('.values > article', 'up', 0.1);
  tag('.prog-chips, .filters', 'up', 0, 0.2);
  tag('.legal', 'up', 0);

  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  // Programme cards are rendered by script a moment later
  setTimeout(() => {
    tag('.prog', 'right', 0.1);
    document.querySelectorAll('[data-r]').forEach((el) => io.observe(el));
  }, 50);
  // Never leave anything hidden
  setTimeout(() => {
    document.querySelectorAll('[data-r]:not(.in)').forEach((el) => {
      if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in');
    });
  }, 2500);

  // Count-ups on .facts numbers (skips years)
  document.querySelectorAll<HTMLElement>('.facts strong').forEach((el) => {
    const m = (el.textContent ?? '').match(/^(\d+)(\D*)$/);
    if (!m || +m[1] > 999) return;
    const target = +m[1];
    const suffix = m[2];
    el.textContent = `0${suffix}`;
    const o = new IntersectionObserver(
      (es) => {
        if (!es[0].isIntersecting) return;
        o.disconnect();
        const t0 = performance.now();
        const step = (t: number) => {
          const p = Math.min(1, (t - t0) / 1100);
          el.textContent = `${Math.round(target * (1 - Math.pow(1 - p, 3)))}${suffix}`;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.6 },
    );
    o.observe(el);
  });

  // Countdown digits drop in when they change
  document.querySelectorAll<HTMLElement>('[data-countdown] span, #count span').forEach((sp) => {
    let last = sp.textContent;
    new MutationObserver(() => {
      if (sp.textContent === last) return;
      last = sp.textContent;
      sp.classList.remove('tick');
      void sp.offsetWidth;
      sp.classList.add('tick');
    }).observe(sp, { childList: true, characterData: true, subtree: true });
  });

  // Scroll progress bar + gentle hero parallax
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.appendChild(bar);
  const frames = document.querySelectorAll<HTMLElement>('.collage .frame');
  const vid = document.querySelector<HTMLElement>('.a-hero .vid');
  const speeds = [-0.06, 0.08, -0.12];
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
      if (innerWidth > 1024 && y < innerHeight * 1.2) {
        frames.forEach((f, i) => { f.style.translate = `0 ${(y * speeds[i % 3]).toFixed(1)}px`; });
        if (vid) vid.style.translate = `0 ${(y * -0.06).toFixed(1)}px`;
      }
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
