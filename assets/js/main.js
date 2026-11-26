/* SWAIS COEUS · interactions */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;

  /* ---------- Loader ---------- */
  const loader = $('#loader');
  const minTime = reduce ? 0 : 1900;
  const start = performance.now();
  const finish = () => {
    const wait = Math.max(0, minTime - (performance.now() - start));
    setTimeout(() => {
      loader.classList.add('done');
      body.classList.remove('is-loading');
      setTimeout(() => body.classList.add('ready'), 250);
      setTimeout(() => loader.remove(), 1300);
    }, wait);
  };
  if (document.readyState === 'complete') finish();
  else window.addEventListener('load', finish, { once: true });
  setTimeout(() => { if (document.contains(loader)) finish(); }, 4500); // safety

  /* ---------- Nav: scrolled state, hide on scroll down, progress ---------- */
  const nav = $('#nav');
  const prog = $('#progress');
  let lastY = 0, ticking = false;
  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle('scrolled', y > 20);
    nav.classList.toggle('hide', y > lastY && y > 500 && !body.classList.contains('menu-open'));
    lastY = y;
    const h = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    updateTimeline();
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });

  /* ---------- Mobile menu ---------- */
  const burger = $('#burger');
  const toggleMenu = (open) => {
    body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  burger.addEventListener('click', () => toggleMenu(!body.classList.contains('menu-open')));
  $$('#mobileMenu a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(false); });

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      en.target.querySelectorAll('[data-count]').forEach(countUp);
      if (en.target.matches('[data-count]')) countUp(en.target);
      io.unobserve(en.target);
    });
  }, { threshold: .15, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal, .steps').forEach(el => io.observe(el));

  /* ---------- Count up ---------- */
  function countUp(el) {
    if (el.dataset.done) return;
    el.dataset.done = 1;
    const end = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.dec || 0, 10);
    if (reduce) { el.textContent = end.toFixed(dec); return; }
    const dur = 1800, t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 4);
      el.textContent = (end * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Role tabs ---------- */
  const tabs = $$('.role-tab');
  const views = $$('.role-view');
  const setRole = (i) => {
    tabs.forEach((t, j) => { t.classList.toggle('active', i === j); t.setAttribute('aria-selected', i === j); });
    views.forEach((v, j) => v.classList.toggle('active', i === j));
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => { setRole(i); t.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); });
    t.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); const n = (i + 1) % tabs.length; tabs[n].focus(); setRole(n); }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); const n = (i - 1 + tabs.length) % tabs.length; tabs[n].focus(); setRole(n); }
    });
  });

  /* ---------- Timeline progress ---------- */
  const tl = $('#timeline'), bar = $('#tlBar'), counter = $('#whyCount');
  const reasons = $$('.reason');
  function updateTimeline() {
    if (!tl) return;
    const r = tl.getBoundingClientRect();
    const mid = innerHeight * .55;
    const p = Math.min(1, Math.max(0, (mid - r.top) / r.height));
    bar.style.height = (p * (r.height - 16)) + 'px';
    let active = 0;
    reasons.forEach((el, i) => {
      const on = el.getBoundingClientRect().top < mid;
      el.classList.toggle('on', on);
      if (on) active = i;
    });
    const txt = String(active + 1).padStart(2, '0');
    if (counter && counter.textContent !== txt) counter.textContent = txt;
  }

  /* ---------- Card spotlight ---------- */
  $$('.card').forEach(c => c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));

  /* ---------- Magnetic buttons (desktop only) ---------- */
  if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.magnetic').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px, ${(e.clientY - r.top - r.height / 2) * .28}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });

    /* subtle parallax on hero orbit */
    const orbit = $('.orbit-wrap');
    addEventListener('pointermove', e => {
      if (scrollY > innerHeight) return;
      const x = (e.clientX / innerWidth - .5) * 14, y = (e.clientY / innerHeight - .5) * 14;
      orbit.style.translate = `${x}px ${y}px`;
    }, { passive: true });
  }

  /* ---------- Contact form → mailto (no data stored) ---------- */
  const form = $('#contactForm');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const bad = ['name', 'email', 'message'].filter(k => !String(d[k] || '').trim());
    if (bad.length || !/^\S+@\S+\.\S+$/.test(d.email)) {
      const first = form.querySelector(`[name="${bad[0] || 'email'}"]`);
      first.focus(); first.parentElement.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 300 });
      return;
    }
    const subject = `SWAIS COEUS enquiry from ${d.name}${d.org ? ' (' + d.org + ')' : ''}`;
    const text = `${d.message}\n\n${d.name}\n${d.org || ''}\n${d.email}`;
    location.href = `mailto:prompt@swais.in?cc=murty.varanasi@swais.in&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  });

  $('#yr').textContent = new Date().getFullYear();
  onScroll();
})();
