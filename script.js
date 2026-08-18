document.addEventListener('DOMContentLoaded', () => {

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const header = document.getElementById('siteHeader');
  const progress = document.getElementById('scrollProgress');

  function onScroll(){
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 12);

    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docH > 0 ? (y / docH) * 100 : 0;
    progress.style.width = pct + '%';
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive:true });

  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');

  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    navToggle.classList.toggle('active', isOpen);
    navToggle.setAttribute('aria-expanded', isOpen);
    document.body.classList.toggle('menu-open', isOpen);
  });

  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      navToggle.classList.remove('active');
      document.body.classList.remove('menu-open');
    });
  });

  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('in-view');

        entry.target.querySelectorAll('.skill-bar').forEach(bar => bar.classList.add('filled'));

        io.unobserve(entry.target);
      }
    });
  }, { threshold:0.15 });
  revealEls.forEach(el => io.observe(el));

  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
      btn.classList.add('active'); btn.setAttribute('aria-selected','true');

      const target = btn.dataset.tab;
      tabPanels.forEach(p => p.classList.toggle('active', p.dataset.panel === target));

      if (target === 'skills'){
        document.querySelectorAll('#about .skill-bar').forEach(bar => bar.classList.add('filled'));
      }
    });
  });

  document.querySelectorAll('.project-thumb').forEach(thumb => {
    const mock = thumb.dataset.mock || '';
    const glyph = document.createElement('span');
    glyph.className = 'glyph';
    glyph.textContent = mock.slice(0,2).toUpperCase();
    thumb.appendChild(glyph);
  });

  const track = document.getElementById('projectTrack');
  const prevBtn = document.getElementById('prevProject');
  const nextBtn = document.getElementById('nextProject');
  const cards = track ? Array.from(track.children) : [];
  let index = 0;

  function visibleCount(){
    const w = window.innerWidth;
    if (w <= 720) return 1;
    if (w <= 980) return 2;
    return 3;
  }

  function update(){
    const vc = visibleCount();
    const maxIndex = Math.max(0, cards.length - vc);
    index = Math.min(index, maxIndex);
    const cardWidth = cards[0] ? cards[0].getBoundingClientRect().width : 0;
    const gap = 32;
    track.style.transform = `translateX(-${index * (cardWidth + gap)}px)`;
    prevBtn.disabled = index <= 0;
    nextBtn.disabled = index >= maxIndex;
  }

  if (track && cards.length){
    prevBtn.addEventListener('click', () => { index = Math.max(0, index - 1); update(); });
    nextBtn.addEventListener('click', () => {
      const maxIndex = Math.max(0, cards.length - visibleCount());
      index = Math.min(maxIndex, index + 1);
      update();
    });
    window.addEventListener('resize', update);
    // slight delay to ensure layout is settled
    setTimeout(update, 50);
  }

  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn){
    loadMoreBtn.addEventListener('click', () => {
      const hidden = document.querySelectorAll('#journalGrid .hidden-card:not(.show)');
      hidden.forEach(card => card.classList.add('show'));
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = 'All Articles Loaded';
      loadMoreBtn.classList.add('btn-outline');
    });
  }

  const form = document.getElementById('contactForm');
  const statusEl = document.getElementById('formStatus');
  const submitBtn = document.getElementById('submitBtn');

  function setError(field, msg){
    const errEl = form.querySelector(`.field-error[data-for="${field}"]`);
    if (errEl) errEl.textContent = msg || '';
  }

  function isValidEmail(v){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function sanitize(v){
    return v.replace(/[\r\n\t]+/g, ' ').replace(/[<>]/g, '').trim();
  }

  const RATE_LIMIT_MS = 30000; // one submission per 30s per browser
  const RATE_LIMIT_KEY = 'contactFormLastSubmit';

  if (form){
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;

      if (form.website && form.website.value.trim() !== ''){
        statusEl.classList.remove('error');
        statusEl.textContent = "Thanks — I'll get back to you shortly.";
        form.reset();
        return;
      }

      const last = Number(sessionStorage.getItem(RATE_LIMIT_KEY) || 0);
      if (Date.now() - last < RATE_LIMIT_MS){
        statusEl.classList.add('error');
        statusEl.textContent = 'Please wait a few seconds before sending another message.';
        return;
      }

      const name = sanitize(form.name.value).slice(0, 80);
      const email = sanitize(form.email.value).slice(0, 120);
      const phone = sanitize(form.phone.value).slice(0, 30);
      const message = sanitize(form.message.value).slice(0, 2000);

      setError('name',''); setError('email',''); setError('message','');

      if (!name){ setError('name','Please enter your name.'); valid = false; }
      if (!email){ setError('email','Please enter your email.'); valid = false; }
      else if (!isValidEmail(email)){ setError('email','Please enter a valid email.'); valid = false; }
      if (!message){ setError('message','Please add a short message.'); valid = false; }

      if (!valid){
        statusEl.textContent = '';
        return;
      }

      const subject = encodeURIComponent(`Portfolio contact from ${name}`);
      const bodyLines = [
        `Name: ${name}`,
        `Email: ${email}`,
        phone ? `Phone: ${phone}` : null,
        '',
        message
      ].filter(Boolean);
      const body = encodeURIComponent(bodyLines.join('\n'));

      submitBtn.disabled = true;
      submitBtn.textContent = 'Opening email…';

      window.location.href = `mailto:ajaz.saiyed2367@gmail.com?subject=${subject}&body=${body}`;
      sessionStorage.setItem(RATE_LIMIT_KEY, String(Date.now()));

      statusEl.classList.remove('error');
      statusEl.textContent = "Your email client should open with the message ready to send. Prefer not to? Email ajaz.saiyed2367@gmail.com directly.";

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      }, 1800);
    });
  }

});