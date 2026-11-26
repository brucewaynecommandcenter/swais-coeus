/* SWAIS COEUS · interactions */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;
  const root = document.documentElement;

  /* ---------- Loader ---------- */
  const loader = $('#loader');
  const minTime = reduce ? 0 : 1900;
  const start = performance.now();
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    const wait = Math.max(0, minTime - (performance.now() - start));
    setTimeout(() => {
      loader && loader.classList.add('done');
      body.classList.remove('is-loading');
      setTimeout(() => body.classList.add('ready'), 250);
      setTimeout(() => loader && loader.remove(), 1300);
    }, wait);
  };
  if (document.readyState === 'complete') finish();
  else window.addEventListener('load', finish, { once: true });
  setTimeout(finish, 4500); // safety net

  /* ---------- Theme ---------- */
  const setTheme = (t) => {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('swais-theme', t); } catch (e) {}
  };
  $('#themeToggle').addEventListener('click', () => setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

  /* ---------- Nav: scrolled state, hide on scroll down, progress, current section ---------- */
  const nav = $('#nav');
  const prog = $('#progress');
  const navLinks = $$('.nav-links a');
  const sections = navLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
  let lastY = 0, ticking = false;
  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle('scrolled', y > 20);
    nav.classList.toggle('hide', y > lastY && y > 500 && !body.classList.contains('menu-open'));
    lastY = y;
    const h = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    let cur = null;
    sections.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * .4) cur = s.id; });
    navLinks.forEach(a => a.classList.toggle('current', a.getAttribute('href') === '#' + cur));
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
  addEventListener('keydown', e => { if (e.key === 'Escape') { toggleMenu(false); toggleChat(false); } });

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      en.target.querySelectorAll('[data-count]').forEach(countUp);
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
      el.textContent = (end * (1 - Math.pow(1 - p, 4))).toFixed(dec);
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
      const k = e.key;
      if (k === 'ArrowDown' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowLeft') {
        e.preventDefault();
        const n = (i + (k === 'ArrowDown' || k === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        tabs[n].focus(); setRole(n);
      }
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

  /* ---------- Magnetic buttons + hero parallax (desktop only) ---------- */
  if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.magnetic').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px, ${(e.clientY - r.top - r.height / 2) * .28}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
    const orbit = $('.orbit-wrap');
    addEventListener('pointermove', e => {
      if (scrollY > innerHeight) return;
      orbit.style.translate = `${(e.clientX / innerWidth - .5) * 14}px ${(e.clientY / innerHeight - .5) * 14}px`;
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
      first.focus();
      first.parentElement.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 300 });
      return;
    }
    const subject = `SWAIS COEUS enquiry from ${d.name}${d.org ? ' (' + d.org + ')' : ''}`;
    const text = `${d.message}\n\n${d.name}\n${d.org || ''}\n${d.email}`;
    location.href = `mailto:prompt@swais.in?cc=murty.varanasi@swais.in&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  });

  /* ---------- Chat: Ask SWAIS (answers from site content) ---------- */
  const chatEl = $('#chat'), panel = $('#chatPanel'), fab = $('#chatFab');
  const chatBody = $('#chatBody'), chips = $('#chatChips'), chatForm = $('#chatForm'), chatInput = $('#chatInput');
  let greeted = false;
  const KB = [
    { w: .4, k: ['coeus', 'swais', 'what do you do', 'who are you', 'about you', 'what is it'], a: 'SWAIS COEUS is the international brand of SWAIS, Saraf Worldsphere AI Services. We bring an AI learning and operations platform to schools, institutions and enterprises: a 24/7 AI tutor for every learner, real-time insight for leaders and less paperwork for teachers.' },
    { k: ['offline', 'internet', 'connect', 'edge', 'power', 'solar', 'cloud'], a: 'Yes. SWAIS runs on edge AI with full offline capability and no cloud dependency. It is solar compatible, so lessons continue through outages and poor connectivity.', go: '#edge' },
    { k: ['tutor', 'saraswati', 'student', 'learn', 'language', 'homework', 'doubt'], a: 'Our AI tutor, Ask SWAIS (Saraswati), is available 24/7, even offline. It explains concepts with real-world local examples in the student\'s own language, with personalised paths and weak-topic detection.' },
    { k: ['role', 'board', 'management', 'parent', 'teacher', 'faculty', 'admin', 'authorit', 'dashboard'], a: 'The platform has seven role-based workspaces: Board, School admin, Management, Faculty, Student, Parent and Authorities. Each gets its own AI capabilities, connected by real-time data.', go: '#platform' },
    { k: ['pilot', 'trial', 'start', 'test', 'try'], a: 'Most schools start with a three-month pilot: one class, one subject, one section of 30 to 40 students. We measure concept clarity, engagement and assessment outcomes before scaling.', go: '#pilot' },
    { k: ['industr', 'vertical', 'enterprise', 'logistic', 'manufactur', 'bank', 'health', 'warehouse', 'commerce', 'supply'], a: 'Beyond education, SWAIS serves ten verticals, including logistics, supply chain, warehousing, e-commerce, manufacturing, banking, healthcare and restaurant technology, with 99.7% model accuracy and 50ms average response.', go: '#enterprise' },
    { k: ['teachers', 'teacher', 'grading', 'paperwork', 'attendance', 'lesson'], a: 'Vision AI grading, instant lesson plans and reports, and automatic attendance save teachers 200+ hours a week across a school network.' },
    { k: ['dropout', 'risk', 'alert', 'predict'], a: 'Predictive analysis watches attendance, performance and engagement, and alerts teachers and administrators weeks before a dropout risk becomes reality.' },
    { k: ['saraf', 'heritage', 'founder', 'family', 'ashish', 'history', 'backed'], a: 'SWAIS is backed by the Saraf family\'s seven decades of industrial and philanthropic work. After five decades in ferro alloys manufacturing, Mr. Ashish Saraf took up AI and IT as a better way to serve society.', go: '#heritage' },
    { k: ['privacy', 'data', 'gdpr', 'secure', 'security'], a: 'Because SWAIS runs on edge AI, learning data can stay on site at the school. For your specific data protection requirements, our team will walk you through the setup on a call.' },
    { k: ['price', 'cost', 'pricing', 'fee', 'quote', 'how much'], a: 'Pricing depends on the number of schools and modules. Share a few details through the <a href="#contact">contact form</a> and our team will send a proposal.' },
    { k: ['demo', 'book', 'call', 'meeting', 'contact', 'email', 'phone', 'talk', 'human'], a: 'Happy to arrange a demo. Use the <a href="#contact">contact form</a>, or email <a href="mailto:murty.varanasi@swais.in">murty.varanasi@swais.in</a> (Murty Varanasi, CEO).', go: '#contact' },
    { k: ['hello', 'hi', 'hey', 'hallo', 'good morning'], a: 'Hello! What would you like to know about SWAIS COEUS?' }
  ];
  const CHIPS = ['What is SWAIS COEUS?', 'Does it work offline?', 'How does a pilot work?', 'Which industries?', 'Book a demo'];
  const esc = (t) => t.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const add = (html, who) => {
    const m = document.createElement('div');
    m.className = 'msg ' + who;
    m.innerHTML = html;
    chatBody.appendChild(m);
    chatBody.scrollTop = chatBody.scrollHeight;
    m.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', () => toggleChat(false)));
  };
  const botSay = (html) => {
    const t = document.createElement('div');
    t.className = 'msg bot typing';
    t.innerHTML = '<i></i><i></i><i></i>';
    chatBody.appendChild(t);
    chatBody.scrollTop = chatBody.scrollHeight;
    setTimeout(() => { t.remove(); add(html, 'bot'); }, reduce ? 50 : 650 + Math.min(900, html.length * 4));
  };
  const hit = (s, k) => k.length < 4 ? new RegExp('\\b' + k + '\\b').test(s) : s.includes(k);
  const answer = (q) => {
    const s = q.toLowerCase();
    let best = null, score = 0;
    KB.forEach(item => {
      const n = item.k.reduce((acc, k) => acc + (hit(s, k) ? k.length : 0), 0) * (item.w || 1);
      if (n > score) { score = n; best = item; }
    });
    if (!best) {
      const mail = `mailto:prompt@swais.in?subject=${encodeURIComponent('Question from the SWAIS COEUS website')}&body=${encodeURIComponent(q)}`;
      return `Good question. I don't have a confident answer to that one, but our team does. <a href="${mail}">Send it to us by email</a> and we'll get back to you.`;
    }
    return best.a + (best.go && !best.a.includes('href="#') ? ` <a href="${best.go}">Show me</a>` : '');
  };
  const renderChips = () => {
    chips.innerHTML = '';
    CHIPS.forEach(c => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = c;
      b.addEventListener('click', () => ask(c));
      chips.appendChild(b);
    });
  };
  const ask = (q) => {
    q = q.trim();
    if (!q) return;
    add(esc(q), 'me');
    botSay(answer(q));
  };
  function toggleChat(open) {
    if (!chatEl) return;
    body.classList.toggle('chat-open', open);
    fab.setAttribute('aria-expanded', open);
    fab.setAttribute('aria-label', open ? 'Close chat' : 'Open chat');
    if (open) {
      body.classList.add('chat-seen');
      if (!greeted) {
        greeted = true;
        renderChips();
        botSay('Hi, I\'m Ask SWAIS. I can tell you about the platform, offline edge AI, pilots or booking a demo. What would you like to know?');
      }
      if (matchMedia('(hover: hover)').matches) setTimeout(() => chatInput.focus(), 400);
    }
  }
  fab.addEventListener('click', () => toggleChat(!body.classList.contains('chat-open')));
  chatForm.addEventListener('submit', e => { e.preventDefault(); ask(chatInput.value); chatInput.value = ''; });

  $('#yr').textContent = new Date().getFullYear();
  onScroll();
})();
