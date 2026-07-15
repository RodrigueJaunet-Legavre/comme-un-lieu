// ═══════════════════════════════════════════
// ANIMATIONS — Comme un Lieu
// ═══════════════════════════════════════════
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let lenisInstance = null;

// ── Garde-fou contextes WebGL ──
const MAX_GL_CONTEXTS = 8;
let activeGLContexts = 0;
function canCreateGLContext() {
  return GLEngine.supportsWebGL && activeGLContexts < MAX_GL_CONTEXTS;
}

// ── Attend que toutes les images de la page soient chargées ──
function waitForImages() {
  const images = Array.from(document.querySelectorAll('img'));
  return Promise.all(images.map((img) => {
    if (img.complete && img.naturalWidth) return Promise.resolve();
    return new Promise((resolve) => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    });
  }));
}

if (!prefersReducedMotion) {
  gsap.registerPlugin(ScrollTrigger);

  // ── Smooth scroll avec fallback sécurisé ──
  if (typeof Lenis !== 'undefined') {
    try {
      lenisInstance = new Lenis({
        duration: 1.1,
        easing: (t) => 1 - Math.pow(1 - t, 3),
        orientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
      });
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

  // Hero timeline (index.html)
  if (document.querySelector('.hero-timeline')) {
    gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.2 })
      .from('.hero-logo', { y: 30, opacity: 0, duration: 0.8 })
      .from('.hero-tagline', { y: 20, opacity: 0, duration: 0.7 }, '-=0.4')
      .from('.hero-cta', { y: 20, opacity: 0, duration: 0.7 }, '-=0.4');
    gsap.to('.hero-bg', { scale: 1.05, duration: 9, ease: 'power1.out' });
  }

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
  gsap.fromTo(transitionEl, { y: '0%' }, { y: '100%', duration: 0.5, ease: 'power3.inOut' });
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

// ─── Distorsion liquide au survol (images de galerie) ───
function initHoverDistortion(selector = '.gl-hover-wrapper') {
  if (!GLEngine.supportsWebGL) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover)').matches) return;

  document.querySelectorAll(selector).forEach((wrapper) => {
    const img = wrapper.querySelector('img');
    if (!img) return;
    if (!canCreateGLContext()) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'gl-canvas';
    wrapper.appendChild(canvas);
    const gl = canvas.getContext('webgl', { alpha: false });
    if (!gl) return;
    const program = GLEngine.createProgram(gl, GLEngine.VERT_SRC, GLEngine.HOVER_FRAG_SRC);
    if (!program) return;
    activeGLContexts++;
    gl.useProgram(program);
    GLEngine.createQuad(gl, program);

    const uMouse = gl.getUniformLocation(program, 'uMouse');
    const uHover = gl.getUniformLocation(program, 'uHover');
    const uTime = gl.getUniformLocation(program, 'uTime');

    let texture = null, hoverAmount = 0, targetHover = 0, mouse = { x: 0.5, y: 0.5 }, raf = null;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, GLEngine.DPR_CAP);
      canvas.width = wrapper.clientWidth * dpr;
      canvas.height = wrapper.clientHeight * dpr;
      canvas.style.width = wrapper.clientWidth + 'px';
      canvas.style.height = wrapper.clientHeight + 'px';
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function setup() {
      if (img.complete && img.naturalWidth) {
        texture = GLEngine.loadTexture(gl, img);
        resize();
        canvas.style.opacity = '1';
      } else {
        img.addEventListener('load', setup, { once: true });
      }
    }
    setup();

    function render(time) {
      if (!texture) { raf = requestAnimationFrame(render); return; }
      hoverAmount += (targetHover - hoverAmount) * 0.08;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uHover, hoverAmount);
      gl.uniform1f(uTime, time * 0.001);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !raf) raf = requestAnimationFrame(render);
        if (!entry.isIntersecting && raf) { cancelAnimationFrame(raf); raf = null; }
      });
    }, { threshold: 0.05 });
    io.observe(wrapper);

    wrapper.addEventListener('mouseenter', () => { targetHover = 1; });
    wrapper.addEventListener('mouseleave', () => { targetHover = 0; });
    wrapper.addEventListener('mousemove', (e) => {
      const rect = wrapper.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left) / rect.width;
      mouse.y = 1 - (e.clientY - rect.top) / rect.height;
    });
    window.addEventListener('resize', resize);
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      activeGLContexts--;
      canvas.style.opacity = '0';
      if (raf) cancelAnimationFrame(raf);
    });
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
        <div class="projet-card-img reveal-image gl-hover-wrapper">
          <img src="${p.image}" alt="${p.titre}" loading="lazy">
        </div>
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

// ── BEFORE/AFTER SLIDER — transition liquide WebGL (Pointer Events — souris + tactile + clavier) ──
function initLiquidSliders(selector = '.ba-slider') {
  document.querySelectorAll(selector).forEach((slider) => {
    const beforeImg = slider.querySelector('.ba-slider__before');
    const afterImg = slider.querySelector('.ba-slider__after');
    const beforeWrap = slider.querySelector('.ba-slider__before-wrap');
    const handle = slider.querySelector('.ba-slider__handle');
    if (!beforeImg || !afterImg) return;

    let useGL = canCreateGLContext() && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let canvas, gl, program, uProgress, texA, texB, raf = null;
    let current = 50, target = 50;
    let visible = true;

    function setBeforeWidth() {
      beforeImg.style.setProperty('--ba-width', slider.offsetWidth + 'px');
    }

    function domFallback(pct) {
      if (beforeWrap) beforeWrap.style.width = pct + '%';
    }

    function resize() {
      setBeforeWidth();
      if (!useGL) return;
      const dpr = Math.min(window.devicePixelRatio || 1, GLEngine.DPR_CAP);
      canvas.width = slider.clientWidth * dpr;
      canvas.height = slider.clientHeight * dpr;
      canvas.style.width = slider.clientWidth + 'px';
      canvas.style.height = slider.clientHeight + 'px';
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function render() {
      current += (target - current) * 0.15;
      if (useGL) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(uProgress, current / 100);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texA);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texB);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      } else {
        domFallback(current);
      }
      handle.style.left = current + '%';
      slider.setAttribute('aria-valuenow', Math.round(current));
      raf = (visible && Math.abs(target - current) > 0.05) ? requestAnimationFrame(render) : null;
    }

    function setupGL() {
      canvas = document.createElement('canvas');
      canvas.className = 'gl-canvas ba-slider__canvas';
      slider.appendChild(canvas);
      gl = canvas.getContext('webgl', { alpha: false });
      program = gl && GLEngine.createProgram(gl, GLEngine.VERT_SRC, GLEngine.DISSOLVE_FRAG_SRC);
      if (!gl || !program) { useGL = false; return; }
      activeGLContexts++;
      gl.useProgram(program);
      GLEngine.createQuad(gl, program);
      uProgress = gl.getUniformLocation(program, 'uProgress');
      gl.uniform1i(gl.getUniformLocation(program, 'uTextureA'), 0);
      gl.uniform1i(gl.getUniformLocation(program, 'uTextureB'), 1);
      texA = GLEngine.loadTexture(gl, beforeImg);
      texB = GLEngine.loadTexture(gl, afterImg);
      resize();
      beforeImg.style.visibility = 'hidden';
      afterImg.style.visibility = 'hidden';
      canvas.style.opacity = '1';
      canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault(); useGL = false; activeGLContexts--; canvas.style.opacity = '0';
        beforeImg.style.visibility = 'visible'; afterImg.style.visibility = 'visible';
      });
      window.addEventListener('resize', resize);
    }

    setBeforeWidth();
    if (useGL) {
      if (beforeImg.complete && afterImg.complete) setupGL();
      else {
        let loaded = 0;
        const onLoad = () => { if (++loaded === 2) setupGL(); };
        beforeImg.addEventListener('load', onLoad, { once: true });
        afterImg.addEventListener('load', onLoad, { once: true });
      }
    }

    function updateFromClientX(clientX) {
      const rect = slider.getBoundingClientRect();
      target = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      if (!raf) raf = requestAnimationFrame(render);
    }

    let dragging = false;
    slider.addEventListener('pointerdown', (e) => { dragging = true; slider.setPointerCapture(e.pointerId); updateFromClientX(e.clientX); });
    slider.addEventListener('pointermove', (e) => { if (dragging) updateFromClientX(e.clientX); });
    slider.addEventListener('pointerup', () => { dragging = false; });
    slider.addEventListener('pointercancel', () => { dragging = false; });
    slider.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { target = Math.max(0, target - 5); if (!raf) raf = requestAnimationFrame(render); }
      if (e.key === 'ArrowRight') { target = Math.min(100, target + 5); if (!raf) raf = requestAnimationFrame(render); }
    });

    // Coupe le rendu quand le slider sort du viewport (perf)
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        visible = entry.isIntersecting;
        if (visible && Math.abs(target - current) > 0.05 && !raf) raf = requestAnimationFrame(render);
        if (!visible && raf) { cancelAnimationFrame(raf); raf = null; }
      });
    }, { threshold: 0.05 });
    io.observe(slider);

    // Reveal scroll-driven (dévoile la transformation en scrollant) — scrub désactivé sous 769px (perf mobile)
    // et pour prefers-reduced-motion (ScrollTrigger n'est enregistré que dans ce cas)
    if (!prefersReducedMotion) {
      gsap.matchMedia().add('(min-width: 769px)', () => {
        const st = ScrollTrigger.create({
          trigger: slider, start: 'top 70%', end: 'top 20%', scrub: 0.6,
          onUpdate: (self) => { target = Math.max(50, 100 - self.progress * 100); if (!raf) raf = requestAnimationFrame(render); }
        });
        return () => st.kill();
      });
    }

    window.addEventListener('resize', setBeforeWidth);
  });
}

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
  initLiquidSliders();

  waitForImages().then(() => {
    if (!prefersReducedMotion) ScrollTrigger.refresh();
    initHoverDistortion();
  });
});
