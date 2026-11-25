/* ==========================================================================
   NEXUS DESIGN — motor de animação
   GSAP + ScrollTrigger + Lenis
   ========================================================================== */
(function () {
    'use strict';

    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
    const root = document.documentElement;
    const body = document.body;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const hasGsap = !!(window.gsap && window.ScrollTrigger);
    const success = body.dataset.success === '1';
    const intro = $('#intro');

    /* ---------- sem GSAP ou com movimento reduzido: versão estática ---------- */
    if (!hasGsap || reduce) {
        root.classList.remove('cinema');
        if (intro) {
            intro.style.transition = 'opacity .5s';
            intro.style.opacity = '0';
            setTimeout(() => intro.remove(), 500);
        }
        $$('.manifesto-text').forEach(el => el.style.opacity = 1);
        $$('.step').forEach(el => el.classList.add('is-lit'));
        initLightbox(null);
        initForm();
        initMenu(null);
        return;
    }

    root.classList.add('cinema');
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    /* ======================================================================
       SCROLL SUAVE (Lenis)
       ====================================================================== */
    let lenis = null;
    if (window.Lenis) {
        lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95 });
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(t => lenis.raf(t * 1000));
        gsap.ticker.lagSmoothing(0);
    }
    const lockScroll = (on) => {
        body.classList.toggle('is-locked', on);
        if (lenis) on ? lenis.stop() : lenis.start();
    };
    const scrollTo = (target, opts = {}) => {
        if (lenis) lenis.scrollTo(target, Object.assign({ duration: 1.6, easing: t => 1 - Math.pow(1 - t, 4) }, opts));
        else {
            const el = typeof target === 'string' ? $(target) : target;
            if (typeof target === 'number') window.scrollTo({ top: target, behavior: opts.immediate ? 'auto' : 'smooth' });
            else if (el) el.scrollIntoView({ behavior: opts.immediate ? 'auto' : 'smooth' });
        }
    };

    /* ======================================================================
       UTILITÁRIOS
       ====================================================================== */
    function splitChars(el) {
        const text = el.textContent;
        el.textContent = '';
        const chars = [];
        text.split(' ').forEach((word, wi, arr) => {
            const wd = document.createElement('span');
            wd.className = 'wd';
            for (const ch of word) {
                const s = document.createElement('span');
                s.className = 'ch';
                s.textContent = ch;
                wd.appendChild(s);
                chars.push(s);
            }
            el.appendChild(wd);
            if (wi < arr.length - 1) el.appendChild(document.createTextNode(' '));
        });
        return chars;
    }

    function splitWords(el) {
        const out = [];
        const walk = (node, hl) => {
            Array.from(node.childNodes).forEach(n => {
                if (n.nodeType === 3) {
                    const parts = n.textContent.split(/(\s+)/);
                    const frag = document.createDocumentFragment();
                    parts.forEach(p => {
                        if (!p) return;
                        if (!p.trim()) { frag.appendChild(document.createTextNode(' ')); return; }
                        const w = document.createElement('span');
                        w.className = 'w' + (hl ? ' hl' : '');
                        w.textContent = p;
                        frag.appendChild(w);
                        out.push(w);
                    });
                    n.replaceWith(frag);
                } else if (n.nodeType === 1) {
                    walk(n, hl || n.tagName === 'STRONG');
                }
            });
        };
        walk(el, false);
        return out;
    }

    const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>_-+=*';
    function scramble(el, duration = 900) {
        const final = el.dataset.final || el.textContent;
        el.dataset.final = final;
        const start = performance.now();
        const step = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const reveal = Math.floor(p * final.length);
            let out = '';
            for (let i = 0; i < final.length; i++) {
                const c = final[i];
                out += (i < reveal || c === ' ') ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
            }
            el.textContent = out;
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    /* ======================================================================
       CURSOR + ÍMANES + FOCO DE LUZ
       ====================================================================== */
    const mouse = { x: innerWidth / 2, y: innerHeight / 2, nx: 0, ny: 0 };
    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX; mouse.y = e.clientY;
        mouse.nx = e.clientX / innerWidth - 0.5;
        mouse.ny = e.clientY / innerHeight - 0.5;
    }, { passive: true });

    if (finePointer) {
        body.classList.add('has-cursor');
        const dot = $('.cur-dot'), ring = $('.cur-ring'), label = $('.cur-label');
        const dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
        const dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
        const rx = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' });
        const ry = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });
        window.addEventListener('mousemove', e => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });
        document.addEventListener('mouseover', e => {
            const t = e.target.closest('a, button, [role="button"], [data-cursor], input, textarea');
            ring.classList.remove('is-hover', 'is-label');
            if (!t) return;
            if (t.dataset.cursor) { label.textContent = t.dataset.cursor; ring.classList.add('is-label'); }
            else ring.classList.add('is-hover');
        });
        document.addEventListener('mouseleave', () => gsap.to([dot, ring], { opacity: 0, duration: 0.3 }));
        document.addEventListener('mouseenter', () => gsap.to([dot, ring], { opacity: 1, duration: 0.3 }));

        $$('[data-magnetic]').forEach(el => {
            const qx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
            const qy = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
            el.addEventListener('mousemove', e => {
                const r = el.getBoundingClientRect();
                qx((e.clientX - r.left - r.width / 2) * 0.28);
                qy((e.clientY - r.top - r.height / 2) * 0.38);
            });
            el.addEventListener('mouseleave', () => { qx(0); qy(0); });
        });

        $$('.svc').forEach(card => {
            card.addEventListener('mousemove', e => {
                const r = card.getBoundingClientRect();
                card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
                card.style.setProperty('--my', (e.clientY - r.top) + 'px');
            });
        });
    }

    /* ======================================================================
       HERO — grelha de luz em perspetiva (canvas)
       ====================================================================== */
    const heroCanvas = (() => {
        const c = $('.hero-canvas');
        const hero = $('.hero');
        if (!c) return { start() {} };
        const ctx = c.getContext('2d');
        let w = 0, h = 0, dpr = 1, running = false, visible = true, t = 0, intensity = 0;
        let mx = 0.5, my = 0.5;
        const parts = [];

        function size() {
            dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            w = c.clientWidth; h = c.clientHeight;
            c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            parts.length = 0;
            const n = Math.min(160, Math.round((w * h) / 12000));
            for (let i = 0; i < n; i++) {
                parts.push({ x: Math.random() * w, y: Math.random() * h, z: Math.random(), v: 0.08 + Math.random() * 0.35 });
            }
        }

        function frame() {
            if (!running) return;
            requestAnimationFrame(frame);
            if (!visible || document.hidden) return;
            t += 1 / 60;
            mx += ((mouse.x / innerWidth) - mx) * 0.04;
            my += ((mouse.y / innerHeight) - my) * 0.04;

            const L = '216,255,60';
            const hz = h * (0.6 + (my - 0.5) * 0.05);
            const vx = w * (0.5 + (mx - 0.5) * 0.3);
            ctx.clearRect(0, 0, w, h);

            // brilho do horizonte
            let g = ctx.createRadialGradient(vx, hz, 0, vx, hz, Math.max(w, h) * 0.65);
            g.addColorStop(0, `rgba(${L},${0.26 * intensity})`);
            g.addColorStop(0.3, `rgba(${L},${0.07 * intensity})`);
            g.addColorStop(1, `rgba(${L},0)`);
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);

            // poeira de luz
            for (const p of parts) {
                p.y -= p.v * (0.4 + p.z);
                if (p.y < -4) { p.y = h + 4; p.x = Math.random() * w; }
                const d = Math.hypot(p.x - mouse.x, p.y - mouse.y);
                const near = Math.max(0, 1 - d / 220);
                const a = (0.12 + p.z * 0.45 + near * 0.6) * intensity;
                ctx.fillStyle = near > 0.05 ? `rgba(${L},${a})` : `rgba(230,236,226,${a * 0.7})`;
                const s = 0.6 + p.z * 1.6 + near * 1.5;
                ctx.fillRect(p.x, p.y, s, s);
            }

            // grelha do chão
            ctx.lineWidth = 1;
            const cols = 26;
            for (let i = -cols; i <= cols; i++) {
                const a = Math.max(0, 0.28 - (Math.abs(i) / cols) * 0.22) * intensity;
                ctx.strokeStyle = `rgba(${L},${a})`;
                ctx.beginPath();
                ctx.moveTo(vx + i * 6, hz);
                ctx.lineTo(vx + i * (w / cols) * 1.9, h + 10);
                ctx.stroke();
            }
            const rows = 16, off = (t * 0.35) % 1;
            for (let k = 0; k < rows; k++) {
                const p = (k + off) / rows;
                const y = hz + (h - hz) * Math.pow(p, 2.3);
                ctx.strokeStyle = `rgba(${L},${p * 0.4 * intensity})`;
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
            }
            // desvanecer junto ao horizonte
            g = ctx.createLinearGradient(0, hz, 0, hz + (h - hz) * 0.45);
            g.addColorStop(0, 'rgba(6,8,10,1)');
            g.addColorStop(1, 'rgba(6,8,10,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, hz - 1, w, (h - hz) * 0.45 + 1);

            // linha do horizonte
            g = ctx.createLinearGradient(0, 0, w, 0);
            g.addColorStop(0, `rgba(${L},0)`);
            g.addColorStop(vx / w, `rgba(${L},${0.95 * intensity})`);
            g.addColorStop(1, `rgba(${L},0)`);
            ctx.save();
            ctx.shadowColor = `rgba(${L},1)`;
            ctx.shadowBlur = 24;
            ctx.fillStyle = g;
            ctx.fillRect(0, hz - 1, w, 2);
            ctx.restore();

            // pilar de luz
            g = ctx.createLinearGradient(vx - 120, 0, vx + 120, 0);
            g.addColorStop(0, `rgba(${L},0)`);
            g.addColorStop(0.5, `rgba(${L},${0.06 * intensity})`);
            g.addColorStop(1, `rgba(${L},0)`);
            ctx.fillStyle = g;
            ctx.fillRect(vx - 120, 0, 240, hz);
        }

        size();
        window.addEventListener('resize', size);
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(es => es.forEach(e => visible = e.isIntersecting)).observe(c);
        }
        hero.addEventListener('mousemove', e => {
            const r = hero.getBoundingClientRect();
            hero.style.setProperty('--mx', (e.clientX - r.left) + 'px');
            hero.style.setProperty('--my', (e.clientY - r.top) + 'px');
        });
        return {
            start() {
                if (running) return;
                running = true;
                frame();
                const o = { v: 0 };
                gsap.to(o, { v: 1, duration: 2.4, ease: 'power2.out', onUpdate: () => intensity = o.v });
            }
        };
    })();

    /* ======================================================================
       ESTADOS INICIAIS DO HERO
       ====================================================================== */
    const heroChars = [];
    $$('.hero-title .split').forEach(el => heroChars.push(...splitChars(el)));
    gsap.set(heroChars, { yPercent: 118, rotateX: -85, opacity: 0 });
    gsap.set('.hero-arrow', { scale: 0, rotate: -45, transformOrigin: '0% 100%' });
    gsap.set(['.hero-kicker', '.hero-side > *', '.hero-foot > *'], { y: 30, opacity: 0 });
    gsap.set('.hdr', { yPercent: -120 });
    gsap.set('.hud, .progress', { opacity: 0 });

    function heroIn(fast) {
        heroCanvas.start();
        const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
        tl.to('.hdr', { yPercent: 0, duration: 1.2 }, 0)
          .to(heroChars, { yPercent: 0, rotateX: 0, opacity: 1, duration: fast ? 1 : 1.5, stagger: fast ? 0.012 : 0.028 }, 0.05)
          .to('.hero-arrow', { scale: 1, rotate: 0, duration: 1.2, ease: 'back.out(2)' }, fast ? 0.4 : 0.8)
          .to('.hero-kicker', { y: 0, opacity: 1, duration: 1, onStart: () => $$('.hero-kicker [data-scramble]').forEach(el => scramble(el, 1000)) }, 0.3)
          .to('.hero-side > *', { y: 0, opacity: 1, duration: 1.2, stagger: 0.1 }, fast ? 0.3 : 0.6)
          .to('.hero-foot > *', { y: 0, opacity: 1, duration: 1.2, stagger: 0.08 }, fast ? 0.4 : 0.8)
          .to('.hud, .progress', { opacity: 1, duration: 1 }, 1)
          .add(() => $$('.hero-title .line').forEach(l => l.classList.add('is-open')));
        return tl;
    }

    /* ======================================================================
       PORTA DE ENTRADA
       ====================================================================== */
    function runIntro() {
        intro.style.animation = 'none';
        lockScroll(true);
        let seen = false;
        try { seen = sessionStorage.getItem('nx-intro') === '1'; } catch (e) { /* ignorar */ }
        const D = seen ? 0.9 : 2.6;

        const frame = $('.il-frame', intro), n = $('.il-n', intro);
        [frame, n].forEach(p => {
            const len = p.getTotalLength ? p.getTotalLength() : 600;
            gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
        });
        const word = $('.intro-nexus', intro);
        const num = $('.intro-num', intro);
        const logs = $$('.intro-log li', intro);
        const counter = { v: 0 };
        let entered = false, autoTimer = null;

        gsap.set('.intro-logo', { scale: 0.6, opacity: 0 });
        gsap.set('.intro-design', { opacity: 0, letterSpacing: '0.2em' });

        const tl = gsap.timeline();
        tl.to('.intro-logo', { scale: 1, opacity: 1, duration: 0.8, ease: 'expo.out' }, 0)
          .to(frame, { strokeDashoffset: 0, duration: D * 0.45, ease: 'power2.inOut' }, 0.1)
          .to(n, { strokeDashoffset: 0, duration: D * 0.4, ease: 'power3.inOut' }, 0.1 + D * 0.25)
          .add(() => { scramble(word, D * 600); word.classList.add('is-glitch'); setTimeout(() => word.classList.remove('is-glitch'), 380); }, 0.15)
          .to('.intro-design', { opacity: 1, letterSpacing: '0.9em', duration: 1.4, ease: 'expo.out' }, 0.4)
          .to(counter, {
              v: 100, duration: D, ease: 'power2.inOut',
              onUpdate: () => {
                  const v = Math.round(counter.v);
                  num.textContent = String(v).padStart(3, '0');
                  gsap.set('.intro-bar i', { scaleX: counter.v / 100 });
                  logs.forEach((li, i) => { if (v >= [2, 30, 55, 80, 99][i] && !li.dataset.on) { li.dataset.on = 1; gsap.to(li, { opacity: 1, duration: 0.2 }); } });
              }
          }, 0)
          // o "N" acende: quadrado lima com N negro, como na marca
          .to(frame, { attr: { 'fill-opacity': 1 }, duration: 0.25, ease: 'steps(3)' }, D)
          .to(n, { attr: { stroke: '#06080a' }, duration: 0.25, ease: 'steps(3)' }, D)
          .to('.intro-logo', { filter: 'drop-shadow(0 0 40px rgba(216,255,60,.75))', scale: 1.06, duration: 0.5, ease: 'back.out(3)' }, D)
          .add(() => {
              word.classList.add('is-glitch');
              setTimeout(() => word.classList.remove('is-glitch'), 250);
              if (seen) { enter(); return; }
              gsap.to('.intro-enter', { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out' });
              gsap.to('.intro-hint', { opacity: 1, duration: 0.8, delay: 0.3 });
              $('.intro-enter', intro).focus({ preventScroll: true });
              autoTimer = setTimeout(enter, 4200);
          }, D + 0.25);
        gsap.set('.intro-enter', { y: 16 });

        function enter() {
            if (entered) return;
            entered = true;
            clearTimeout(autoTimer);
            try { sessionStorage.setItem('nx-intro', '1'); } catch (e) { /* ignorar */ }
            document.removeEventListener('keydown', onKey);
            const out = gsap.timeline({
                onComplete: () => { intro.remove(); lockScroll(false); ScrollTrigger.refresh(); }
            });
            out.to('.intro-center', { scale: 1.15, opacity: 0, filter: 'blur(12px)', duration: 0.6, ease: 'power3.in' }, 0)
               .to(['.intro-log', '.intro-count', '.intro-bar', '.intro-hud', '.intro-grid', '.intro-scan'], { opacity: 0, duration: 0.4 }, 0)
               .to('.intro-beam', { scaleX: 1, duration: 0.55, ease: 'expo.inOut' }, 0.35)
               .to('.intro-door--top', { yPercent: -100, duration: 1.25, ease: 'expo.inOut' }, 0.85)
               .to('.intro-door--bot', { yPercent: 100, duration: 1.25, ease: 'expo.inOut' }, 0.85)
               .to('.intro-beam', { scaleY: 40, opacity: 0, duration: 0.9, ease: 'expo.out' }, 0.9)
               .add(() => heroIn(false), 1.05);
        }
        function onKey(e) { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); if (!entered && tl.progress() > 0.85) enter(); } }
        document.addEventListener('keydown', onKey);
        $('.intro-enter', intro).addEventListener('click', enter);
        intro.addEventListener('click', e => { if (tl.progress() >= 1 && !e.target.closest('.intro-enter')) enter(); });
    }

    /* ======================================================================
       CENAS DE SCROLL
       ====================================================================== */

    /* --- hero a dissolver-se --- */
    gsap.to('.hero-inner', {
        yPercent: -18, opacity: 0, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 15%', scrub: true }
    });
    gsap.to('.hero-canvas', {
        scale: 1.25, opacity: 0.2, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });

    /* --- portal: voo através das letras NEXUS --- */
    (() => {
        const portal = $('.portal');
        if (!portal) return;
        const mask = $('.portal-mask', portal), x = $('.pm-x', portal), word = $('.pm-word', portal);
        const setOrigin = () => {
            const ox = word.offsetLeft + x.offsetLeft + x.offsetWidth / 2;
            const oy = word.offsetTop + x.offsetTop + x.offsetHeight * 0.56;
            gsap.set(mask, { transformOrigin: `${ox}px ${oy}px` });
        };
        setOrigin();
        ScrollTrigger.addEventListener('refreshInit', setOrigin);

        gsap.set('.portal-copy .pl > span', { yPercent: 110 });
        const tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: { trigger: portal, start: 'top top', end: '+=220%', pin: true, scrub: 1 }
        });
        tl.fromTo('.portal-img', { scale: 1.6, xPercent: -6 }, { scale: 1.12, xPercent: 0, duration: 1.3 }, 0)
          .to('.portal-pre--top', { yPercent: -160, opacity: 0, duration: 0.6, ease: 'power2.in' }, 0.35)
          .to('.portal-pre--bot', { yPercent: 160, opacity: 0, duration: 0.6, ease: 'power2.in' }, 0.35)
          .to(mask, { scale: 46, duration: 1.1, ease: 'power3.in' }, 0.35)
          .to(mask, { opacity: 0, duration: 0.35 }, 1.1)
          .to('.portal-img', { scale: 1, duration: 0.9 }, 1.3)
          .to('.portal-shade', { opacity: 1, duration: 0.4 }, 1.35)
          .to('.portal-sweep', { xPercent: 320, duration: 0.9, ease: 'power1.inOut' }, 1.4)
          .to('.portal-hud', { opacity: 1, duration: 0.3 }, 1.5)
          .to('.portal-copy-k', { opacity: 1, duration: 0.3 }, 1.6)
          .to('.portal-copy .pl > span', { yPercent: 0, duration: 0.5, stagger: 0.12, ease: 'expo.out' }, 1.65)
          .to({}, { duration: 0.4 });
    })();

    /* --- manifesto: palavras que se acendem --- */
    (() => {
        const el = $('.manifesto-text');
        if (!el) return;
        const words = splitWords(el);
        gsap.fromTo(words, { opacity: 0.13 }, {
            opacity: 1, stagger: 0.08, ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 45%', scrub: true }
        });
        gsap.from(el, {
            y: 80, ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 40%', scrub: true }
        });
    })();

    /* --- marquee reativo à velocidade do scroll --- */
    let velocity = 0;
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: s => { velocity = s.getVelocity(); } });
    (() => {
        const rows = $$('.mq-row');
        if (!rows.length) return;
        const state = rows.map((row, i) => ({ row, x: 0, dir: i % 2 ? 1 : -1, skew: gsap.quickTo(row, 'skewX', { duration: 0.5, ease: 'power3' }) }));
        let sign = 1;
        gsap.ticker.add(() => {
            if (Math.abs(velocity) > 20) sign = velocity > 0 ? 1 : -1;
            const boost = Math.min(Math.abs(velocity) * 0.006, 22);
            velocity *= 0.92;
            state.forEach(s => {
                const half = s.row.scrollWidth / 2;
                if (!half) return;
                s.x += s.dir * sign * (1.1 + boost);
                if (s.x <= -half) s.x += half;
                if (s.x > 0) s.x -= half;
                gsap.set(s.row, { x: s.x });
                s.skew(gsap.utils.clamp(-14, 14, -s.dir * sign * boost * 0.8));
            });
        });
    })();

    /* --- PROJETOS: showroom com câmara --- */
    (() => {
        const show = $('.show');
        if (!show) return;
        const stage = $('.show-stage', show);
        const niches = $$('.niche', show);
        const infos = $$('.show-info', show);
        const reflects = $$('.reflect', show);
        const dots = $$('.show-dots i', show);
        const n = niches.length;
        const CY = 680;
        const center = i => ({ x: 200 + i * 960 + 440, y: CY });
        const OVER = { x: (200 + (n - 1) * 960 + 880 + 200) / 2, y: 820 };
        const cam = { fx: OVER.x, fy: OVER.y, k: 0 };
        let S0, S1, A0, A1, vw, vh;
        const stageW = 200 + (n - 1) * 960 + 880 + 200;

        function layout() {
            vw = show.clientWidth; vh = show.clientHeight;
            const mobile = vw < 900;
            S0 = mobile ? (vw * 1.18) / stageW : Math.min((vw * 0.96) / stageW, (vh * 0.56) / 1500);
            A0 = { x: vw / 2, y: mobile ? vh * 0.56 : vh * 0.64 };
            S1 = mobile ? Math.min((vw * 0.94) / 880, (vh * 0.44) / 880) : Math.min((vw * 0.55) / 880, (vh * 0.82) / 880);
            A1 = mobile ? { x: vw / 2, y: vh * 0.31 } : { x: vw * 0.655, y: vh * 0.53 };
            render();
        }
        const par = { x: 0, y: 0 };
        function render() {
            if (!S0) return;
            const k = cam.k;
            const s = S0 * Math.pow(S1 / S0, k);
            const ax = A0.x + (A1.x - A0.x) * k + par.x;
            const ay = A0.y + (A1.y - A0.y) * k + par.y;
            stage.style.transform = `translate3d(${(ax - cam.fx * s).toFixed(2)}px, ${(ay - cam.fy * s).toFixed(2)}px, 0) scale(${s.toFixed(5)})`;
        }
        if (finePointer) {
            gsap.ticker.add(() => {
                par.x += (-mouse.nx * 26 - par.x) * 0.05;
                par.y += (-mouse.ny * 16 - par.y) * 0.05;
                if (Math.abs(par.x) > 0.01) render();
            });
        }
        layout();
        window.addEventListener('resize', layout);
        ScrollTrigger.addEventListener('refreshInit', layout);

        const sel = (i, s) => $(s, niches[i]);
        const HOLD = 1.9, START = 1.7;
        const tl = gsap.timeline({ defaults: { ease: 'none' } });

        // 1) as luzes acendem, uma a uma
        niches.forEach((nc, i) => {
            const at = 0.15 + i * 0.38;
            tl.to(sel(i, '.niche-fixture'), { opacity: 1, duration: 0.05 }, at)
              .to(sel(i, '.niche-cone'), { keyframes: { opacity: [0, 0.85, 0.1, 0.6, 0.05, 1] }, duration: 0.45 }, at)
              .to(sel(i, '.niche-pool'), { opacity: 0.85, duration: 0.3 }, at + 0.2)
              .to(sel(i, '.niche-screen'), { filter: 'brightness(1) saturate(1)', duration: 0.4 }, at + 0.15)
              .to(reflects[i], { opacity: 0.3, duration: 0.4 }, at + 0.2);
        });
        tl.to('.show-head', { opacity: 0, y: -60, duration: 0.5, ease: 'power2.in' }, START - 0.35)
          .to('.show-shade', { opacity: 1, duration: 0.8 }, START + 0.2);

        // 2) a câmara viaja de nicho em nicho
        niches.forEach((nc, i) => {
            const base = START + i * HOLD;
            const c = center(i);
            tl.to(cam, { fx: c.x, fy: c.y, duration: 1, ease: 'power2.inOut', onUpdate: render }, base);
            if (i === 0) tl.to(cam, { k: 1, duration: 1, ease: 'power2.inOut', onUpdate: render }, base);
            else tl.to(cam, { keyframes: [{ k: 0.62, duration: 0.5, ease: 'power2.in' }, { k: 1, duration: 0.5, ease: 'power2.out' }], onUpdate: render }, base);
            niches.forEach((other, j) => {
                tl.to($('.niche-dark', other), { opacity: j === i ? 0 : 0.82, duration: 0.6 }, base + 0.2);
            });
            tl.to(sel(i, '.ns-glare'), { xPercent: 260, duration: 0.7, ease: 'power1.inOut' }, base + 0.75)
              .fromTo(infos[i], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, base + 0.7)
              .fromTo(infos[i].children, { y: 50, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, duration: 0.4, ease: 'power3.out' }, base + 0.7)
              .to(infos[i].children, { y: -40, opacity: 0, stagger: 0.03, duration: 0.3, ease: 'power2.in' }, base + HOLD - 0.35)
              .to(infos[i], { autoAlpha: 0, duration: 0.01 }, base + HOLD - 0.02);
        });

        // 3) recuo final + convite
        const END = START + n * HOLD;
        tl.to(cam, { fx: OVER.x, fy: OVER.y, k: 0, duration: 1.1, ease: 'power2.inOut', onUpdate: render }, END - 0.2)
          .to($$('.niche-dark', show), { opacity: 0.55, duration: 0.6 }, END)
          .to('.show-shade', { opacity: 0, duration: 0.6 }, END)
          .fromTo('.show-end', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, END + 0.5)
          .from('.show-end > *', { y: 60, opacity: 0, stagger: 0.08, duration: 0.5, ease: 'power3.out' }, END + 0.5)
          .to({}, { duration: 0.6 });

        ScrollTrigger.create({
            trigger: show,
            start: 'top top',
            end: () => '+=' + Math.round(tl.duration() * innerHeight * 0.55),
            pin: true,
            scrub: 1,
            animation: tl,
            invalidateOnRefresh: true,
            onUpdate: self => {
                gsap.set('.work-progress i', { scaleX: self.progress });
                const t = tl.time();
                const idx = t < START + 0.5 || t > END ? -1 : Math.min(n - 1, Math.floor((t - START - 0.5) / HOLD + 0.0));
                dots.forEach((d, i) => d.classList.toggle('on', i === idx));
            }
        });

        // as ligações só ficam focáveis quando visíveis
        infos.forEach(info => {
            new MutationObserver(() => {
                const on = info.style.visibility !== 'hidden' && parseFloat(info.style.opacity || 0) > 0.5;
                $$('a, button', info).forEach(a => a.tabIndex = on ? 0 : -1);
            }).observe(info, { attributes: true, attributeFilter: ['style'] });
        });
    })();

    /* --- serviços --- */
    gsap.from('.svc', {
        y: 140, rotateX: -18, opacity: 0, transformPerspective: 1200, transformOrigin: '50% 100%',
        stagger: 0.14, duration: 1.4, ease: 'expo.out',
        scrollTrigger: { trigger: '.svc-grid', start: 'top 82%' }
    });

    /* --- processo: feixe de luz --- */
    (() => {
        const steps = $('.steps');
        if (!steps) return;
        gsap.fromTo('.beam-fill', { height: '0%' }, {
            height: '100%', ease: 'none',
            scrollTrigger: { trigger: steps, start: 'top 60%', end: 'bottom 62%', scrub: true }
        });
        $$('.step').forEach(st => {
            ScrollTrigger.create({
                trigger: st, start: 'top 62%',
                onEnter: () => st.classList.add('is-lit'),
                onLeaveBack: () => st.classList.remove('is-lit')
            });
            gsap.from($('h3', st), { x: 60, ease: 'none', scrollTrigger: { trigger: st, start: 'top bottom', end: 'top 55%', scrub: true } });
        });
    })();

    /* --- CTA: letras que se enchem de luz --- */
    gsap.fromTo('.cta-line', { backgroundPosition: '100% 0' }, {
        backgroundPosition: '0% 0', stagger: 0.25, ease: 'none',
        scrollTrigger: {
            trigger: '.cta-big', start: 'top 80%', end: 'bottom 45%', scrub: true,
            onLeave: () => $('.cta-big').classList.add('is-lit'),
            onEnterBack: () => $('.cta-big').classList.remove('is-lit')
        }
    });
    gsap.from('.cta-line', {
        xPercent: i => (i % 2 ? 12 : -12), ease: 'none',
        scrollTrigger: { trigger: '.cta-big', start: 'top bottom', end: 'bottom 50%', scrub: true }
    });
    gsap.from(['.contact-info', '.form-wrap'], {
        y: 80, opacity: 0, stagger: 0.15, duration: 1.3, ease: 'expo.out',
        scrollTrigger: { trigger: '.contact-grid', start: 'top 80%' }
    });

    /* --- rodapé: NEXUS gigante a nascer --- */
    gsap.from('.footer-mark span', {
        yPercent: 105, ease: 'none', stagger: 0.08,
        scrollTrigger: { trigger: '.footer', start: 'top 85%', end: 'bottom bottom', scrub: true }
    });
    gsap.from('.footer-glow', {
        opacity: 0, scale: 0.6, ease: 'none',
        scrollTrigger: { trigger: '.footer', start: 'top 70%', end: 'bottom bottom', scrub: true }
    });

    /* --- revelações genéricas --- */
    $$('[data-reveal]').forEach(el => {
        gsap.from(el, { y: 70, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 86%' } });
    });
    $$('[data-scramble]').forEach(el => {
        if (el.closest('.hero')) return;
        ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => scramble(el, 800) });
    });

    /* --- header, barra de progresso, HUD --- */
    (() => {
        const hdr = $('.hdr'), bar = $('.progress i'), pct = $('.hud-pct'), sec = $('.hud-sec');
        ScrollTrigger.create({
            start: 0, end: 'max',
            onUpdate: s => {
                const y = s.scroll();
                hdr.classList.toggle('is-scrolled', y > 40);
                hdr.classList.toggle('is-hidden', s.direction === 1 && y > 500 && !body.classList.contains('menu-open'));
                gsap.set(bar, { scaleX: s.progress });
                pct.textContent = String(Math.round(s.progress * 100)).padStart(3, '0');
            }
        });
        $$('[data-hud]').forEach(el => {
            ScrollTrigger.create({
                trigger: el, start: 'top 50%', end: 'bottom 50%',
                onToggle: s => { if (s.isActive && sec.dataset.final !== el.dataset.hud) { sec.dataset.final = el.dataset.hud; scramble(sec, 500); } }
            });
        });
    })();

    /* ======================================================================
       MENU, ÂNCORAS, LIGHTBOX
       ====================================================================== */
    initMenu(lenis);
    initLightbox(lenis);
    initForm();

    $$('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const id = a.getAttribute('href');
            if (id.length < 2 && id !== '#') return;
            const target = id === '#' || id === '#topo' ? 0 : $(id);
            if (target === null) return;
            e.preventDefault();
            body.classList.remove('menu-open');
            scrollTo(target, { offset: id === '#contacto' ? -20 : 0 });
        });
    });

    /* ======================================================================
       ARRANQUE
       ====================================================================== */
    ScrollTrigger.sort();
    const refresh = () => ScrollTrigger.refresh();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
    window.addEventListener('load', refresh);

    if (intro && !success) {
        runIntro();
    } else {
        if (intro) intro.remove();
        heroIn(true);
        if (success) {
            // depois de enviar o formulário: esperar pelo layout final (pins, fontes) e ir ao contacto
            if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
            const goContact = () => {
                ScrollTrigger.refresh();
                const y = $('.form-wrap').getBoundingClientRect().top + window.scrollY - 140;
                if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
                window.scrollTo(0, y);
                ScrollTrigger.update();
            };
            const loaded = new Promise(r => document.readyState === 'complete' ? r() : window.addEventListener('load', r));
            const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
            Promise.all([loaded, fonts]).then(() => setTimeout(goContact, 60));
        }
    }

    /* ---------- funções partilhadas ---------- */
    function initMenu(lenisRef) {
        const btn = $('.menu-btn');
        if (!btn) return;
        btn.addEventListener('click', () => {
            const open = !body.classList.contains('menu-open');
            body.classList.toggle('menu-open', open);
            btn.setAttribute('aria-expanded', open);
            $('.mnav').setAttribute('aria-hidden', !open);
            if (lenisRef) open ? lenisRef.stop() : lenisRef.start();
        });
        $$('.mnav a').forEach(a => a.addEventListener('click', () => {
            body.classList.remove('menu-open');
            btn.setAttribute('aria-expanded', 'false');
            if (lenisRef) lenisRef.start();
        }));
    }

    function initLightbox(lenisRef) {
        const lb = $('.lightbox');
        if (!lb) return;
        const img = $('img', lb);
        let last = null;
        const open = (src, alt, from) => {
            last = from;
            img.src = src; img.alt = alt || '';
            lb.classList.add('is-open');
            lb.setAttribute('aria-hidden', 'false');
            if (lenisRef) lenisRef.stop();
            $('.lb-close', lb).focus({ preventScroll: true });
        };
        const close = () => {
            lb.classList.remove('is-open');
            lb.setAttribute('aria-hidden', 'true');
            if (lenisRef) lenisRef.start();
            if (last) last.focus({ preventScroll: true });
        };
        document.addEventListener('click', e => {
            const t = e.target.closest('[data-zoom]');
            if (t) { e.preventDefault(); open(t.dataset.zoom, t.dataset.alt, t); }
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && lb.classList.contains('is-open')) close();
            const t = document.activeElement && document.activeElement.closest && document.activeElement.closest('[data-zoom][role="button"]');
            if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(t.dataset.zoom, t.dataset.alt, t); }
        });
        lb.addEventListener('click', e => { if (e.target === lb || e.target.closest('.lb-close')) close(); });
    }

    function initForm() {
        const form = document.querySelector('form[data-web3forms]');
        if (!form) return;
        const box = form.parentElement.querySelector('.form-success[hidden], .form-success.js-msg') || null;
        const msg = (text, isError) => {
            if (!box) return;
            box.classList.add('js-msg');
            box.hidden = false;
            box.classList.toggle('is-error', !!isError);
            box.querySelector('.fs-icon').textContent = isError ? '!' : '✓';
            box.querySelector('p').textContent = text;
        };
        if (new URLSearchParams(location.search).get('enviado') === '1') {
            msg('Obrigado! Recebemos o seu pedido e a equipa da Nexus Design entrará em contacto dentro de 24 horas.');
        }
        form.addEventListener('submit', async e => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(form).entries());
            const nome = (data.nome || '').trim();
            const ok = 'Obrigado' + (nome ? ', ' + nome : '') + '! Recebemos o seu pedido e a equipa da Nexus Design entrará em contacto dentro de 24 horas.';
            if (data.botcheck) { msg(ok); form.reset(); return; }
            if (!data.access_key) {
                msg('O formulário está temporariamente indisponível. Por favor tente mais tarde.', true);
                return;
            }
            delete data.redirect;
            delete data.botcheck;
            data.name = nome;
            const btn = form.querySelector('button[type="submit"]');
            const label = btn.querySelector('span');
            const old = label.textContent;
            btn.disabled = true;
            label.textContent = 'A enviar…';
            try {
                const res = await fetch(form.action, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify(data)
                });
                const json = await res.json().catch(() => ({}));
                if (res.ok && json.success) { msg(ok); form.reset(); }
                else msg('Não foi possível enviar a mensagem. Por favor tente novamente dentro de momentos.', true);
            } catch (err) {
                msg('Sem ligação de momento. Verifique a internet e tente novamente.', true);
            } finally {
                btn.disabled = false;
                label.textContent = old;
            }
        });
    }
})();
