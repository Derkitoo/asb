/* ASB — interactions partagées */
(function () {
  // --- Nav scroll state ---
  const nav = document.querySelector('.nav');
  const onNav = () => { if (nav) nav.classList.toggle('scrolled', window.scrollY > 20); };

  // --- Mobile menu ---
  const menu = document.querySelector('.mobile-menu');
  const openBtn = document.querySelector('[data-menu-open]');
  const closeBtn = document.querySelector('[data-menu-close]');
  const toggle = (v) => menu && menu.classList.toggle('open', v);
  openBtn && openBtn.addEventListener('click', () => toggle(true));
  closeBtn && closeBtn.addEventListener('click', () => toggle(false));
  menu && menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggle(false)));

  // --- Duplicate marquee content for seamless loop ---
  document.querySelectorAll('.marquee-track').forEach(track => {
    track.innerHTML += track.innerHTML;
  });

  // --- FAQ fluid accordion ---
  document.querySelectorAll('details.qa').forEach(el => {
    const summary = el.querySelector('summary');
    const body = el.querySelector('.qa-body');
    if (!summary || !body) return;
    let animating = false;

    summary.addEventListener('click', (e) => {
      e.preventDefault();
      if (animating) return;
      animating = true;

      const isOpen = el.hasAttribute('open');
      if (!isOpen) {
        // Open
        el.setAttribute('open', '');
        const startH = summary.offsetHeight;
        const endH = el.scrollHeight;
        el.style.height = startH + 'px';
        el.style.overflow = 'hidden';
        const anim = el.animate({
          height: [startH + 'px', endH + 'px']
        }, { duration: 320, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
        
        anim.onfinish = () => {
          el.style.height = '';
          el.style.overflow = '';
          animating = false;
        };
      } else {
        // Close
        const startH = el.scrollHeight;
        const endH = summary.offsetHeight;
        el.style.height = startH + 'px';
        el.style.overflow = 'hidden';
        const anim = el.animate({
          height: [startH + 'px', endH + 'px']
        }, { duration: 280, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
        
        anim.onfinish = () => {
          el.removeAttribute('open');
          el.style.height = '';
          el.style.overflow = '';
          animating = false;
        };
      }
    });
  });

  // --- Scroll reveal (rAF + scroll, robust everywhere) ---
  const items = Array.from(document.querySelectorAll('.reveal, .stat, [data-count]'));
  function commit(el) {
    // self-healing: guarantee final visible state even if transitions don't composite
    el.style.transition = 'none';
    el.style.opacity = '1';
    el.style.transform = 'none';
  }
  function reveal() {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    for (let i = items.length - 1; i >= 0; i--) {
      const el = items[i];
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) {
        el.classList.add('reveal-in');
        if (el.dataset.count !== undefined) animateCount(el);
        setTimeout(() => commit(el), 850);
        items.splice(i, 1);
      }
    }
  }

  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const dur = 1500;
    const dec = (el.dataset.count.indexOf('.') > -1) ? 1 : 0;
    const start = performance.now();
    const numEl = el.querySelector('.cnum') || el;
    const finalStr = target.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      numEl.textContent = (target * eased).toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
      if (p < 1) requestAnimationFrame(tick);
      else numEl.textContent = finalStr;
    }
    requestAnimationFrame(tick);
    setTimeout(() => { numEl.textContent = finalStr; }, 1700); // safety
  }

  let ticking = false;
  function onScroll() {
    onNav();
    if (!ticking) { requestAnimationFrame(() => { reveal(); ticking = false; }); ticking = true; }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', reveal, { passive: true });
  window.addEventListener('load', reveal);
  onNav();
  reveal();
  // safety passes for late layout/fonts
  setTimeout(reveal, 120);
  setTimeout(reveal, 500);
  // --- Scrollspy for floating nav links ---
  const sections = document.querySelectorAll('section[id], header[id]');
  const navLinks = document.querySelectorAll('.nav-links a, .mobile-menu nav a');
  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          const href = link.getAttribute('href');
          link.classList.toggle('active', href === `#${id}`);
        });
      }
    });
  }, {
    root: null,
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0
  });
  sections.forEach(section => spyObserver.observe(section));
})();
