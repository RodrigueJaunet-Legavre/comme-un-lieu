// ═══════════════════════════════════════════
// ANIMATIONS — Comme un Lieu
// ═══════════════════════════════════════════
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ═══════════════════════════════════════════
// PRELOADER — logo en fondu, sans rideau
// ═══════════════════════════════════════════
function runPreloader() {
  const preloader = document.querySelector('.preloader');
  const preloaderLogo = document.querySelector('.preloader__logo');
  document.documentElement.style.overflow = 'hidden';

  if (!preloader || !preloaderLogo || prefersReducedMotion || typeof gsap === 'undefined') {
    if (preloader) preloader.remove();
    document.documentElement.style.overflow = '';
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const tl = gsap.timeline({
      defaults: { ease: 'power2.out' },
      onComplete: () => {
        preloader.remove();
        document.documentElement.style.overflow = '';
        resolve();
      }
    });

    tl.to(preloaderLogo, { opacity: 1, scale: 1, duration: 0.9 })
      .to(preloaderLogo, { duration: 0.5 }) // pause, le temps de "voir" le logo
      .to(preloader, {
        opacity: 0,
        duration: 0.8,
        ease: 'power2.inOut'
      });
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
      function raf(time) {
        lenisInstance.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
      lenisInstance.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenisInstance.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
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
        .from('.hero-logo', { y: 30, opacity: 0, duration: 0.8 })
        .from('.hero-tagline', { y: 20, opacity: 0, duration: 0.7 }, '-=0.4')
        .from('.hero-cta', { y: 20, opacity: 0, duration: 0.7 }, '-=0.4');
      gsap.to('.hero-bg', { scale: 1.05, duration: 9, ease: 'power1.out' });
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

// ─── Hero parallax ───
function initParallax() {
  const heroImg = document.getElementById('heroImg');
  if (!heroImg) return;
  window.addEventListener('scroll', () => {
    heroImg.style.transform = `translateY(${window.scrollY * 0.3}px)`;
  }, { passive: true });
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
    tag: "Rénovation complète",
    image: "images/realisations/appartement-paris-16/ilot-apres.png",
    lien: "realisations/appartement-paris-16.html"
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
  initParallax();
  initFadeIn();
  initMobileMenu();
  initHeroScroll();
  renderProjets();
  initLightbox();
});
