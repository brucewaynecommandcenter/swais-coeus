/* SWAIS COEUS · interactions */
(() => {
  /* ---------- Lead delivery ----------
     Leave endpoint empty to fall back to the visitor's email app (mailto).
     To receive leads directly, set it, e.g. 'https://formsubmit.co/ajax/you@example.com'
     (the request is a JSON POST, so any JSON form endpoint works). */
  const LEAD = { endpoint: '', to: 'prompt@swais.in', cc: 'murty.varanasi@swais.in' };

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const body = document.body;
  const root = document.documentElement;
  const store = {
    get: (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- Loader ---------- */
  const loader = $('#loader');
  const minTime = reduce ? 0 : 1900;
  const start = performance.now();
  let finished = false;
  let readyAt = Infinity;
  const finish = () => {
    if (finished) return;
    finished = true;
    const wait = Math.max(0, minTime - (performance.now() - start));
    setTimeout(() => {
      loader && loader.classList.add('done');
      body.classList.remove('is-loading');
      setTimeout(() => { body.classList.add('ready'); readyAt = performance.now(); }, 250);
      setTimeout(() => loader && loader.remove(), 1300);
    }, wait);
  };
  if (document.readyState === 'complete') finish();
  else window.addEventListener('load', finish, { once: true });
  setTimeout(finish, 4500);

  /* ---------- Theme (light by default) ---------- */
  $('#themeToggle').addEventListener('click', () => {
    const t = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', t);
    try { sessionStorage.setItem('swais-theme-s', t); } catch (e) {}   // dark lasts only for this visit; every new visit opens light
  });

  /* ---------- Nav ---------- */
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
    const frac = h > 0 ? y / h : 0;
    prog.style.transform = `scaleX(${frac})`;
    let cur = null;
    sections.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * .4) cur = s.id; });
    navLinks.forEach(a => a.classList.toggle('current', a.getAttribute('href') === '#' + cur));
    updateTimeline();
    if (frac > .45) maybePopup('scroll');
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
  addEventListener('keydown', e => { if (e.key === 'Escape') { toggleMenu(false); toggleChat(false); closeModal(); } });

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

  /* ---------- Timeline ---------- */
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

  /* ---------- Card spotlight, magnetic buttons, parallax ---------- */
  $$('.card').forEach(c => c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));
  if (!reduce && finePointer) {
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

  /* =========================================================
     LEADS: one pipeline for the contact form, popup and chat
     ========================================================= */
  let leadSent = store.get('swais-lead') === '1';

  function submitLead(d) {
    const phone = d.phone ? `${d.cc || ''} ${d.phone}`.trim() : '';
    const lead = {
      name: d.name, email: d.email, phone, organisation: d.org || '',
      interest: d.interest || 'Book a demo', message: d.message || '',
      source: d.source, page: location.href.split('?')[0], submitted: new Date().toISOString()
    };
    leadSent = true; store.set('swais-lead', '1');
    if (LEAD.endpoint) {
      return fetch(LEAD.endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ _subject: `New SWAIS COEUS lead: ${lead.name} (${lead.interest})`, _template: 'table', _captcha: 'false', ...lead })
      }).then(r => { if (!r.ok) throw new Error('send failed'); return 'sent'; });
    }
    const subject = `SWAIS COEUS: ${lead.interest} request from ${lead.name}${lead.organisation ? ' (' + lead.organisation + ')' : ''}`;
    const text = [`Interest: ${lead.interest}`, `Name: ${lead.name}`, `Organisation: ${lead.organisation}`, `Email: ${lead.email}`, `Phone: ${lead.phone}`, '', lead.message].join('\n');
    location.href = `mailto:${LEAD.to}?cc=${LEAD.cc}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    return Promise.resolve('mailto');
  }
  const first = (n) => (n ? ', ' + String(n).trim().split(' ')[0] : '');
  const doneText = (how, name) => how === 'sent'
    ? `Thanks${first(name)}. Your request is in and our team will contact you within one working day.`
    : `Thanks${first(name)}. Your email app has opened with your request filled in. Just press send and our team will reply within one working day.`;

  const shake = (el) => el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 300 });
  const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());

  $$('.lead-form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form));
      if (d._honey) return;
      $$('.err', form).forEach(x => x.classList.remove('err'));
      const bad = [];
      if (!String(d.name || '').trim()) bad.push(form.querySelector('[name="name"]'));
      if (!validEmail(d.email || '')) bad.push(form.querySelector('[name="email"]'));
      const ph = String(d.phone || '').replace(/[\s\-()]/g, '');
      if (ph && !/^\+?\d{6,15}$/.test(ph)) bad.push(form.querySelector('[name="phone"]'));
      if (!d.consent) bad.push(form.querySelector('[name="consent"]'));
      if (bad.length) {
        bad.forEach(i => { const w = i.closest('.field, .consent'); w.classList.add('err'); shake(w); });
        bad[0].focus();
        return;
      }
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      const show = (how) => {
        const done = form.querySelector('.form-done');
        done.querySelector('.done-msg').textContent = doneText(how, d.name);
        done.hidden = false;
        form.classList.add('is-done');
      };
      submitLead({ ...d, source: form.dataset.source }).then(show).catch(() => {
        LEAD.endpoint = '';
        submitLead({ ...d, source: form.dataset.source }).then(show);
      });
    });
    form.addEventListener('input', e => { const w = e.target.closest('.err'); w && w.classList.remove('err'); });
  });

  /* CTA buttons preselect the interest on the main form */
  $$('[data-interest]').forEach(a => a.addEventListener('click', () => {
    const r = $(`#contactForm input[name="interest"][value="${a.dataset.interest}"]`);
    if (r) r.checked = true;
    if (finePointer) setTimeout(() => { const n = $('#f-name'); n && n.focus({ preventScroll: true }); }, 900);
  }));

  /* ---------- Popup: once per session, only after real interest ---------- */
  const modal = $('#leadModal');
  let popped = store.get('swais-pop') === '1';
  function maybePopup(reason) {
    if (popped || leadSent || !modal) return;
    const since = performance.now() - readyAt;
    if (since < 12000) return;                                   // never in the first 12 seconds
    if (reason === 'time' && since < 45000) return;              // timed trigger after 45 seconds
    if (body.classList.contains('chat-open') || body.classList.contains('menu-open')) return;
    const c = $('#contact').getBoundingClientRect();
    if (c.top < innerHeight && c.bottom > 0) return;             // not while the form is already on screen
    popped = true; store.set('swais-pop', '1');
    modal.hidden = false;
    body.style.overflow = 'hidden';
    if (finePointer) setTimeout(() => $('#m-name').focus(), 500);
  }
  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    body.style.overflow = '';
  }
  if (modal) {
    $$('[data-close]', modal).forEach(b => b.addEventListener('click', closeModal));
    setInterval(() => maybePopup('time'), 5000);
    document.addEventListener('mouseout', e => { if (!e.relatedTarget && e.clientY <= 0) maybePopup('exit'); });
  }

  /* =========================================================
     CHAT: Ask SWAIS (answers from site content + demo booking)
     ========================================================= */
  const chatEl = $('#chat'), fab = $('#chatFab'), bubble = $('#chatBubble');
  const chatBody = $('#chatBody'), chips = $('#chatChips'), chatForm = $('#chatForm'), chatInput = $('#chatInput');
  let greeted = false, asked = 0, flow = null;
  const KB = [
    { w: .4, k: ['coeus', 'swais', 'what do you do', 'who are you', 'about you', 'what is it'], a: 'SWAIS COEUS is the international brand of SWAIS, Saraf Worldsphere AI Services. We bring an AI learning and operations platform to schools, institutions and enterprises: a 24/7 AI tutor for every learner, real-time insight for leaders and less paperwork for teachers.' },
    { k: ['offline', 'internet', 'connect', 'edge', 'power', 'solar', 'cloud'], a: 'Yes. SWAIS runs on edge AI with full offline capability and no cloud dependency. It is solar compatible, so lessons continue through outages and poor connectivity.', go: '#edge' },
    { k: ['tutor', 'saraswati', 'student', 'learn', 'language', 'homework', 'doubt'], a: 'Our AI tutor, Ask SWAIS (Saraswati), is available 24/7, even offline. It explains concepts with real-world local examples in the student\'s own language, with personalised paths and weak-topic detection.' },
    { k: ['role', 'board', 'management', 'parent', 'teacher', 'faculty', 'admin', 'authorit', 'dashboard'], a: 'The platform has seven role-based workspaces: Board, School admin, Management, Faculty, Student, Parent and Authorities. Each gets its own AI capabilities, connected by real-time data.', go: '#platform' },
    { k: ['pilot', 'trial', 'start', 'test', 'try'], a: 'Most schools start with a three-month pilot: one class, one subject, one section of 30 to 40 students. We measure concept clarity, engagement and assessment outcomes before scaling.', go: '#pilot', offer: true },
    { k: ['industr', 'vertical', 'enterprise', 'logistic', 'manufactur', 'bank', 'health', 'warehouse', 'commerce', 'supply'], a: 'Beyond education, SWAIS serves ten verticals, including logistics, supply chain, warehousing, e-commerce, manufacturing, banking, healthcare and restaurant technology, with 99.7% model accuracy and 50ms average response.', go: '#enterprise' },
    { k: ['teachers', 'teacher', 'grading', 'paperwork', 'attendance', 'lesson'], a: 'Vision AI grading, instant lesson plans and reports, and automatic attendance save teachers 200+ hours a week across a school network.' },
    { k: ['dropout', 'risk', 'alert', 'predict'], a: 'Predictive analysis watches attendance, performance and engagement, and alerts teachers and administrators weeks before a dropout risk becomes reality.' },
    { k: ['saraf', 'heritage', 'founder', 'family', 'ashish', 'history', 'backed'], a: 'SWAIS is backed by the Saraf family\'s seven decades of industrial and philanthropic work. After five decades in ferro alloys manufacturing, Mr. Ashish Saraf took up AI and IT as a better way to serve society.', go: '#heritage' },
    { k: ['privacy', 'data', 'gdpr', 'secure', 'security'], a: 'Because SWAIS runs on edge AI, learning data can stay on site at the school. For your specific data protection requirements, our team will walk you through the setup on a call.', offer: true },
    { k: ['price', 'cost', 'pricing', 'fee', 'quote', 'how much'], a: 'Pricing depends on the number of schools and modules, so our team prepares a proposal for each institution.', offer: true },
    { book: true, k: ['demo', 'book', 'call', 'meeting', 'contact', 'talk', 'human', 'sales', 'interested'] },
    { k: ['hello', 'hi', 'hey', 'hallo', 'good morning'], a: 'Hello! What would you like to know about SWAIS COEUS?' }
  ];
  const CHIPS = ['Book a free demo', 'Does it work offline?', 'How does a pilot work?', 'What is SWAIS COEUS?', 'Which industries?'];
  const esc = (t) => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const bookBtn = ' <button type="button" class="link-btn" data-book>Book a free demo</button>';
  const add = (html, who) => {
    const m = document.createElement('div');
    m.className = 'msg ' + who;
    m.innerHTML = html;
    chatBody.appendChild(m);
    chatBody.scrollTop = chatBody.scrollHeight;
    m.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', () => toggleChat(false)));
    m.querySelectorAll('[data-book]').forEach(b => b.addEventListener('click', () => { add('Book a free demo', 'me'); startBooking(); }));
    return m;
  };
  const botSay = (html, then) => {
    const t = document.createElement('div');
    t.className = 'msg bot typing';
    t.innerHTML = '<i></i><i></i><i></i>';
    chatBody.appendChild(t);
    chatBody.scrollTop = chatBody.scrollHeight;
    setTimeout(() => { t.remove(); add(html, 'bot'); then && then(); }, reduce ? 50 : 600 + Math.min(900, html.length * 4));
  };
  const hit = (s, k) => k.length < 4 ? new RegExp('\\b' + k + '\\b').test(s) : s.includes(k);

  /* demo booking conversation */
  const STEPS = [
    { key: 'name', q: () => 'Great, let\'s set up your free demo. What\'s your name?' },
    { key: 'email', q: (d) => `Thanks${esc(first(d.name))}. What's your work email?`, check: validEmail, bad: 'That doesn\'t look like an email address. Could you check it?' },
    { key: 'phone', q: () => 'And a phone number we can reach you on? Include the country code, or type "skip".', check: (v) => /^skip$/i.test(v.trim()) || /^\+?[\d\s\-()]{6,20}$/.test(v.trim()), bad: 'Please type a phone number using digits, or "skip".' },
    { key: 'org', q: () => 'Last one: which school or organisation are you with?' }
  ];
  function startBooking() {
    if (leadSent) { botSay('You\'ve already sent us a request. Our team will be in touch within one working day.'); return; }
    flow = { i: 0, d: {} };
    chips.hidden = true;
    botSay(STEPS[0].q(flow.d));
  }
  function bookingStep(v) {
    const st = STEPS[flow.i];
    if (st.check && !st.check(v)) { botSay(st.bad); return; }
    flow.d[st.key] = /^skip$/i.test(v.trim()) ? '' : v.trim();
    flow.i++;
    if (flow.i < STEPS.length) { botSay(STEPS[flow.i].q(flow.d)); return; }
    const d = flow.d; flow = null; chips.hidden = false;
    botSay(`Perfect. Sending your demo request for ${esc(d.org || 'your organisation')}...`, () => {
      submitLead({ name: d.name, email: d.email, phone: d.phone, org: d.org, interest: 'Book a demo', message: 'Requested via the website chat.', source: 'Chat' })
        .then(how => botSay(how === 'sent' ? 'Done! Our team will contact you within one working day.' : 'Your email app has opened with your details filled in. Press send and our team will contact you within one working day.'))
        .catch(() => botSay('Something went wrong sending that. Please use the <a href="#contact">contact form</a> instead.'));
    });
  }
  const answer = (q) => {
    const s = q.toLowerCase();
    let best = null, score = 0;
    KB.forEach(item => {
      const n = item.k.reduce((acc, k) => acc + (hit(s, k) ? k.length : 0), 0) * (item.w || 1);
      if (n > score) { score = n; best = item; }
    });
    if (best && best.book) { startBooking(); return null; }
    if (!best) return 'Good question. Our team can answer that properly on a short call.' + bookBtn;
    asked++;
    const more = best.go ? ` <a href="${best.go}">Show me</a>` : '';
    return best.a + more + (best.offer || asked % 2 === 0 ? '<br><br>Want to see it with your own use case?' + bookBtn : '');
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
    if (flow) { bookingStep(q); return; }
    const a = answer(q);
    if (a) botSay(a);
  };
  const hideBubble = () => {
    if (!bubble || bubble.hidden) return;
    bubble.classList.add('out');
    setTimeout(() => { bubble.hidden = true; }, 350);
  };
  function toggleChat(open) {
    if (!chatEl) return;
    body.classList.toggle('chat-open', open);
    fab.setAttribute('aria-expanded', open);
    fab.setAttribute('aria-label', open ? 'Close chat' : 'Open chat');
    if (open) {
      body.classList.add('chat-seen');
      hideBubble();
      closeModal();
      if (!greeted) {
        greeted = true;
        renderChips();
        botSay('Hi, I\'m Ask SWAIS. I can tell you about the platform, offline edge AI and pilots, or set up a free demo for you. What would you like to know?');
      }
      if (finePointer) setTimeout(() => chatInput.focus(), 400);
    }
  }
  fab.addEventListener('click', () => toggleChat(!body.classList.contains('chat-open')));
  chatForm.addEventListener('submit', e => { e.preventDefault(); ask(chatInput.value); chatInput.value = ''; });

  /* "You have a new message." bubble */
  if (bubble) {
    const showBubble = () => {
      if (body.classList.contains('chat-seen') || store.get('swais-bubble') === 'x') return;
      bubble.hidden = false;
      setTimeout(() => bubble.classList.add('typed'), reduce ? 0 : 1400);
    };
    const waitReady = setInterval(() => {
      if (body.classList.contains('ready')) { clearInterval(waitReady); setTimeout(showBubble, 3500); }
    }, 200);
    bubble.addEventListener('click', e => {
      if (e.target.closest('.cb-close')) { store.set('swais-bubble', 'x'); hideBubble(); return; }
      toggleChat(true);
    });
  }

  $('#yr').textContent = new Date().getFullYear();
  onScroll();
})();
