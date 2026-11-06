// ═══════════════════════════════════════════
// ANIMATIONS — Comme un Lieu
// ═══════════════════════════════════════════
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Attend le chargement de toutes les images de la page (utile avant un ScrollTrigger.refresh())
function waitForImages() {
  const imgs = Array.from(document.images);
  return Promise.all(imgs.map((img) => {
    if (img.complete) return Promise.resolve();
    return new Promise((resolve) => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    });
  }));
}

// ═══════════════════════════════════════════
// PRELOADER — logo en fondu, sans rideau
// ═══════════════════════════════════════════
function runPreloader() {
  const preloader = document.querySelector('.preloader');
  const isHome = document.body.classList.contains('page-accueil') || location.pathname === '/' || location.pathname.endsWith('/index.html');
  const alreadyShown = sessionStorage.getItem('preloaderShown');

  if (!preloader) return Promise.resolve();

  if (!isHome || alreadyShown) {
    preloader.remove();
    return Promise.resolve();
  }

  sessionStorage.setItem('preloaderShown', '1');
  const preloaderLogo = document.querySelector('.preloader__logo');
  document.documentElement.style.overflow = 'hidden';

  if (!preloaderLogo || typeof gsap === 'undefined') {
    preloader.remove();
    document.documentElement.style.overflow = '';
    return Promise.resolve();
  }

  const navLogo = document.querySelector('.nav-logo__img');

  return new Promise((resolve) => {
    let released = false;
    const release = () => { if (!released) { released = true; resolve(); } };
    const finish = () => {
      preloader.remove();
      document.documentElement.style.overflow = '';
      gsap.from('.navbar .logo-sub, .navbar .navbar-nav, .navbar .burger', {
        opacity: 0, y: -6, duration: 0.7, stagger: 0.08, ease: 'power2.out', clearProps: 'all'
      });
      release();
    };

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' }, onComplete: finish });
    tl.to(preloaderLogo, { opacity: 1, scale: 1, duration: 1.4 })
      .to(preloaderLogo, { duration: 0.6 });

    if (navLogo) {
      let d = null;
      const measure = () => {
        const from = preloaderLogo.getBoundingClientRect();
        const to = navLogo.getBoundingClientRect();
        return {
          dx: (to.left + to.width / 2) - (from.left + from.width / 2),
          dy: (to.top + to.height / 2) - (from.top + from.height / 2),
          s: to.width / from.width
        };
      };
      tl.add('fly')
        .to(preloaderLogo, {
          x: () => (d = measure()).dx,
          y: () => d.dy,
          scale: () => d.s,
          duration: 1.3, ease: 'power3.inOut'
        }, 'fly')
        .to(preloader, { '--bg': 0, duration: 1, ease: 'power2.inOut' }, 'fly+=0.35')
        .call(release, null, 'fly+=0.7');
    } else {
      tl.to(preloaderLogo, { opacity: 0, duration: 0.8 })
        .to(preloader, { '--bg': 0, duration: 0.8, ease: 'power2.inOut' }, '<');
    }
  });
}

const preloaderPromise = runPreloader();

let lenisInstance = null;

if (!prefersReducedMotion) {
  gsap.registerPlugin(ScrollTrigger);

  // ── Smooth scroll avec fallback sécurisé ──
  if (typeof Lenis !== 'undefined') {
    try {
      // lenisInstance = new Lenis({
      //   duration: 1.1,
      //   easing: (t) => 1 - Math.pow(1 - t, 3),
      //   orientation: 'vertical',
      //   smoothWheel: true,
      //   wheelMultiplier: 1,
      //   touchMultiplier: 2,
      // });
      if (lenisInstance) {
        function raf(time) {
          lenisInstance.raf(time);
          requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
        lenisInstance.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => lenisInstance.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
      }
    } catch (e) {
      console.warn('Lenis a échoué à s\'initialiser, scroll natif utilisé.', e);
      lenisInstance = null;
    }
  } else {
    console.warn('Lenis non chargé (CDN indisponible), scroll natif utilisé.');
  }

  // Reveal texte (titres sans enfants HTML)
  document.querySelectorAll('.reveal-mask').forEach((el) => {
    const text = el.textContent;
    el.innerHTML = `<span class="reveal-line">${text}</span>`;
    gsap.to(el.querySelector('.reveal-line'), {
      y: '0%', duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });

  // Reveal images (galeries)
  document.querySelectorAll('.reveal-image').forEach((el) => {
    gsap.to(el, {
      clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'power3.inOut',
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });

  // Reveal slider avant/après au scroll
  document.querySelectorAll('.ba-slider').forEach((slider) => {
    gsap.fromTo(slider,
      { clipPath: 'inset(0 0 100% 0)' },
      {
        clipPath: 'inset(0 0 0% 0)', duration: 1.2, ease: 'power3.inOut',
        scrollTrigger: { trigger: slider, start: 'top 80%' }
      }
    );
  });

  // Hero timeline (index.html) — démarre après le preloader
  preloaderPromise.then(() => {
    if (document.querySelector('.hero-timeline')) {
      gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.2 })
        .to('.hero-cta', { y: 0, opacity: 1, duration: 0.7 });

      gsap.timeline({ scrollTrigger: { trigger: '.hero-intro__lead', start: 'top 90%' } })
        .from('.hero-intro__lead p', { y: 24, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.25 })
        .to('.hero-intro__cta-line__bar', { width: '100%', duration: 0.6, ease: 'power2.out' }, '-=0.2');

      gsap.to('.hero-intro__portrait', {
        y: -20, ease: 'none',
        scrollTrigger: { trigger: '.hero-intro', start: 'top top', end: 'bottom top', scrub: true }
      });
    }
  });

  // Transition entre pages
  const transitionEl = document.createElement('div');
  transitionEl.className = 'page-transition';
  document.body.appendChild(transitionEl);

  document.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('#') && !href.startsWith('http') && !href.startsWith('mailto') && !href.startsWith('tel')) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const failsafe = setTimeout(() => { window.location.href = href; }, 700);
        if (typeof gsap !== 'undefined' && document.querySelector('.page-transition')) {
          gsap.to('.page-transition', {
            y: '0%', duration: 0.4, ease: 'power3.inOut',
            onComplete: () => {
              clearTimeout(failsafe);
              window.location.href = href;
            }
          });
        }
      });
    }
  });
}

// ─── Navbar scroll behavior ───
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  if (navbar.classList.contains('transparent')) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 80) {
        navbar.classList.remove('transparent');
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.add('transparent');
        navbar.classList.remove('scrolled');
      }
    });
  }
}

// ─── Fade in au scroll (IntersectionObserver pour .fade-in) ───
function initFadeIn() {
  const elements = document.querySelectorAll('.fade-in');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  elements.forEach(el => observer.observe(el));
}

// ─── Mobile menu ───
function initMobileMenu() {
  const burger = document.getElementById('burger');
  const overlay = document.getElementById('mobileOverlay');
  const closeBtn = document.getElementById('overlayClose');
  if (!burger || !overlay) return;

  burger.addEventListener('click', () => overlay.classList.add('active'));
  closeBtn?.addEventListener('click', () => overlay.classList.remove('active'));
  overlay.querySelectorAll('.overlay-link').forEach(link => {
    link.addEventListener('click', () => overlay.classList.remove('active'));
  });
}

// ─── Hero scroll to réalisations ───
function initHeroScroll() {
  const heroCta = document.querySelector('.hero-cta[href="#realisations"]');
  if (!heroCta) return;
  heroCta.addEventListener('click', e => {
    e.preventDefault();
    const target = document.getElementById('realisations');
    if (!target) return;
    if (lenisInstance) {
      lenisInstance.scrollTo(target, { duration: 1.2 });
    } else {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

// ─── Projets data & rendering (réalisations page) ───
const projets = [
  {
    titre: "Appartement — Paris 16e",
    tag: "Agencement sur mesure",
    image: "images/realisations/appartement-paris-16/ilot-apres.jpg",
    lien: "realisations/appartement-paris-16.html"
  },
  {
    titre: "Square Tolstoï — Paris 16e",
    tag: "Rénovation complète",
    image: "images/realisations/square-tolstoi-paris-16/sdb-apres.jpg",
    lien: "realisations/square-tolstoi-paris-16.html"
  },
  {
    titre: "Faubourg Saint-Antoine — Paris 11e",
    tag: "Rénovation complète",
    image: "images/realisations/faubourg-saint-antoine-paris-11/sejour-apres-1.jpg",
    lien: "realisations/faubourg-saint-antoine-paris-11.html"
  },
  {
    titre: "Rue du Pavillon — Boulogne-Billancourt",
    tag: "Rénovation complète",
    image: "images/realisations/rue-du-pavillon-boulogne/sejour-apres-1.jpg",
    lien: "realisations/rue-du-pavillon-boulogne.html"
  }
];

function renderProjets() {
  const grid = document.getElementById('projets-grid');
  if (!grid) return;
  grid.innerHTML = projets.map(p => `
    <a href="${p.lien}" class="projet-card fade-in">
      <div class="projet-card-img-wrap">
        <img src="${p.image}" alt="${p.titre}" class="projet-card-img reveal-image">
      </div>
      <div class="projet-card-info">
        <span class="tag">${p.tag}</span>
        <h2 class="projet-card-titre reveal-mask">${p.titre}</h2>
      </div>
    </a>
  `).join('');
  initFadeIn();

  if (!prefersReducedMotion) {
    document.querySelectorAll('.projet-card .reveal-image').forEach((el) => {
      gsap.to(el, {
        clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'power3.inOut',
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
    });
    document.querySelectorAll('.projet-card .reveal-mask').forEach((el) => {
      const text = el.textContent;
      el.innerHTML = `<span class="reveal-line">${text}</span>`;
      gsap.to(el.querySelector('.reveal-line'), {
        y: '0%', duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
    });
  }
}

// ─── Projet en avant (carousel accueil) ───
function initFeaturedProjectCarousel() {
  const section = document.querySelector('.featured-project');
  if (!section) return;
  const img = section.querySelector('.featured-project__img');
  const title = section.querySelector('.featured-project__title');
  const tag = section.querySelector('.featured-project__tag');
  const link = section.querySelector('.featured-project__link');
  const prevBtn = section.querySelector('.featured-project__arrow--prev');
  const nextBtn = section.querySelector('.featured-project__arrow--next');
  let index = 0;
  let timer = null;

  function setContent(p) {
    img.src = p.image;
    img.alt = p.titre;
    title.textContent = p.titre;
    tag.textContent = p.tag;
    link.href = p.lien;
  }

  function render(i) {
    const p = projets[i];
    if (prefersReducedMotion || typeof gsap === 'undefined') {
      setContent(p);
      return;
    }
    gsap.to(img, {
      opacity: 0, duration: 0.4, onComplete: () => {
        setContent(p);
        gsap.to(img, { opacity: 1, duration: 0.4 });
      }
    });
  }

  function goTo(i) {
    index = (i + projets.length) % projets.length;
    render(index);
  }

  function startAutoplay() {
    clearInterval(timer);
    if (prefersReducedMotion || projets.length <= 1) return;
    timer = setInterval(() => goTo(index + 1), 5000);
  }

  render(index);
  startAutoplay();

  nextBtn.addEventListener('click', () => { goTo(index + 1); startAutoplay(); });
  prevBtn.addEventListener('click', () => { goTo(index - 1); startAutoplay(); });

  // Swipe tactile
  let touchStartX = 0;
  section.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  section.addEventListener('touchend', (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 40) {
      diff > 0 ? goTo(index - 1) : goTo(index + 1);
      startAutoplay();
    }
  }, { passive: true });
}

// ─── Slider "après" (hero, à côté du portrait) ───
function initHeroAfterSlider() {
  const wrap = document.querySelector('.hero-after-slider');
  const img = wrap?.querySelector('.hero-after-slider__img');
  if (!wrap || !img || projets.length === 0) return;
  let index = 0;

  function render(i) {
    const p = projets[i];
    if (prefersReducedMotion || typeof gsap === 'undefined') {
      img.src = p.image;
      img.alt = p.titre;
      return;
    }
    gsap.to(img, {
      opacity: 0, duration: 0.5, onComplete: () => {
        img.src = p.image;
        img.alt = p.titre;
        gsap.to(img, { opacity: 1, duration: 0.5 });
      }
    });
  }

  render(index);
  if (!prefersReducedMotion && projets.length > 1) {
    setInterval(() => {
      index = (index + 1) % projets.length;
      render(index);
    }, 4500);
  }
}

// ── BEFORE/AFTER SLIDER (Pointer Events — souris + tactile + clavier) ──
document.querySelectorAll('.ba-slider').forEach((slider) => {
  const beforeWrap = slider.querySelector('.ba-slider__before-wrap');
  const beforeImg = slider.querySelector('.ba-slider__before');
  const handle = slider.querySelector('.ba-slider__handle');
  let current = 50;
  let target = 50;
  let raf = null;

  function setWidth() {
    beforeImg.style.setProperty('--ba-width', slider.offsetWidth + 'px');
  }

  function render() {
    current += (target - current) * 0.18;
    if (Math.abs(target - current) < 0.05) current = target;
    beforeWrap.style.width = current + '%';
    handle.style.left = current + '%';
    slider.setAttribute('aria-valuenow', Math.round(current));
    if (current !== target) {
      raf = requestAnimationFrame(render);
    } else {
      raf = null;
    }
  }

  function updateFromClientX(clientX) {
    const rect = slider.getBoundingClientRect();
    target = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    if (!raf) raf = requestAnimationFrame(render);
  }

  // Init
  setWidth();
  beforeWrap.style.width = '50%';
  handle.style.left = '50%';

  let dragging = false;
  slider.addEventListener('pointerdown', (e) => {
    dragging = true;
    slider.setPointerCapture(e.pointerId);
    updateFromClientX(e.clientX);
  });
  slider.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    updateFromClientX(e.clientX);
  });
  slider.addEventListener('pointerup', () => { dragging = false; });
  slider.addEventListener('pointercancel', () => { dragging = false; });

  // Clavier (accessibilité)
  slider.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { target = Math.max(0, target - 5); if (!raf) raf = requestAnimationFrame(render); }
    if (e.key === 'ArrowRight') { target = Math.min(100, target + 5); if (!raf) raf = requestAnimationFrame(render); }
  });

  window.addEventListener('resize', setWidth);
});

// ─── Lightbox ───
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  if (!lightbox) return;

  document.querySelectorAll('.lightbox-trigger').forEach(img => {
    img.addEventListener('click', () => {
      lightboxImg.src = img.dataset.src || img.src;
      lightbox.classList.add('active');
    });
  });

  lightbox.addEventListener('click', () => lightbox.classList.remove('active'));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') lightbox.classList.remove('active');
  });
}

// ─── Init on DOM ready ───
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initFadeIn();
  initMobileMenu();
  initHeroScroll();
  renderProjets();
  initLightbox();
  initHeroAfterSlider();
  initHeroFull();

  waitForImages().then(() => {
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    initFeaturedProjectCarousel();
  });
});


// ── AVANT/APRÈS : indication + démo d'invitation ──
(function () {
  const sliders = document.querySelectorAll('.ba-slider');
  if (!sliders.length) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  sliders.forEach((slider) => {
    const beforeWrap = slider.querySelector('.ba-slider__before-wrap');
    const handle = slider.querySelector('.ba-slider__handle');
    if (!beforeWrap || !handle) return;

    const hint = document.createElement('div');
    hint.className = 'ba-slider__hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.innerHTML = '<span class="ba-slider__hint-arrow">‹</span><span>Faites glisser pour comparer l’avant et l’après</span><span class="ba-slider__hint-arrow">›</span>';
    slider.appendChild(hint);

    let touched = false;
    let demoRaf = null;

    function setPos(p) {
      beforeWrap.style.width = p + '%';
      handle.style.left = p + '%';
      slider.setAttribute('aria-valuenow', Math.round(p));
    }
    function stopDemo() {
      if (demoRaf) { cancelAnimationFrame(demoRaf); demoRaf = null; }
    }
    function markTouched() {
      if (touched) return;
      touched = true;
      stopDemo();
      slider.classList.add('is-touched');
      hint.classList.add('is-hidden');
    }
    ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => {
      slider.addEventListener(ev, markTouched, { passive: true });
    });

    if (reduce || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || touched) return;
        io.disconnect();
        const start = performance.now();
        const dur = 2600;
        function step(now) {
          if (touched) return;
          const t = Math.min(1, (now - start) / dur);
          setPos(50 + 25 * Math.sin(t * 2 * Math.PI));
          if (t < 1) demoRaf = requestAnimationFrame(step);
          else { setPos(50); demoRaf = null; }
        }
        setTimeout(() => { if (!touched) demoRaf = requestAnimationFrame(step); }, 600);
      });
    }, { threshold: 0.6 });
    io.observe(slider);
  });
})();


// ─── Hero plein écran : diaporama des réalisations (après) ───
function initHeroFull() {
  const hero = document.querySelector('.hero-full');
  if (!hero || typeof projets === 'undefined') return;
  const list = projets.filter((p) => p && p.image && p.hero !== false);
  if (!list.length) return;

  const veil = hero.querySelector('.hero-full__veil');
  const caption = hero.querySelector('.hero-full__caption');
  const capTag = hero.querySelector('.hero-full__caption-tag');
  const capTitle = hero.querySelector('.hero-full__caption-title');
  const dotsWrap = hero.querySelector('.hero-full__dots');

  const slides = list.map((p, i) => {
    const slide = document.createElement('div');
    slide.className = 'hero-full__slide';
    const img = document.createElement('img');
    img.src = p.image;
    img.alt = p.titre || '';
    img.decoding = 'async';
    if (i > 0) img.loading = 'lazy';
    slide.appendChild(img);
    hero.insertBefore(slide, veil);
    return slide;
  });

  let current = -1;
  let timer = null;

  function show(i) {
    if (i === current) return;
    const prev = current;
    current = i;
    slides.forEach((sl, k) => {
      sl.classList.toggle('is-active', k === i);
      if (k === prev) {
        sl.classList.add('is-leaving');
        setTimeout(() => sl.classList.remove('is-leaving'), 1800);
      }
    });
    dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
    const p = list[i];
    caption.style.opacity = '0';
    setTimeout(() => {
      capTag.textContent = p.tag || '';
      capTitle.textContent = p.titre || '';
      caption.setAttribute('href', p.lien || '#');
      caption.style.opacity = '1';
    }, prev === -1 ? 0 : 350);
  }

  function restart() {
    if (timer) clearInterval(timer);
    if (prefersReducedMotion || list.length < 2) return;
    timer = setInterval(() => show((current + 1) % list.length), 6500);
  }

  const dots = list.map((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'hero-full__dot';
    b.setAttribute('aria-label', p.titre || ('Réalisation ' + (i + 1)));
    b.addEventListener('click', () => { show(i); restart(); });
    dotsWrap.appendChild(b);
    return b;
  });

  show(0);
  restart();
}
