/* ─────────────────────────────────────────────
   DIGITAL VESAK ZONE 2026
   Premium JavaScript — Router · Audio · Particles
   ─────────────────────────────────────────────  */

'use strict';

/* ════════════════════════════════════════════
   1.  PARTICLE CANVAS  (stars + sparkles)
   ════════════════════════════════════════════ */
const ParticleSystem = (() => {
  const canvas  = document.getElementById('particle-canvas');
  const ctx     = canvas.getContext('2d');
  let   W, H, particles = [], raf;

  function resize () {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function createParticle () {
    const isGold = Math.random() < 0.25;
    return {
      x:     Math.random() * W,
      y:     Math.random() * H,
      r:     Math.random() * (isGold ? 1.8 : 1.2) + 0.3,
      alpha: Math.random() * 0.7 + 0.1,
      speed: Math.random() * 0.15 + 0.03,
      drift: (Math.random() - 0.5) * 0.08,
      phase: Math.random() * Math.PI * 2,
      gold:  isGold,
    };
  }

  function init () {
    resize();
    particles = Array.from({ length: 180 }, createParticle);
    window.addEventListener('resize', resize);
    loop();
  }

  function loop () {
    raf = requestAnimationFrame(loop);
    ctx.clearRect(0, 0, W, H);

    const t = Date.now() / 1000;

    particles.forEach(p => {
      // Gentle twinkle
      const twinkle = Math.sin(t * 1.4 + p.phase) * 0.3 + 0.7;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.gold
        ? `rgba(255,195,0,${p.alpha * twinkle})`
        : `rgba(240,230,255,${p.alpha * twinkle})`;
      ctx.fill();

      // Drift upward slowly
      p.y     -= p.speed;
      p.x     += p.drift;

      // Wrap
      if (p.y < -4)       { p.y = H + 4; p.x = Math.random() * W; }
      if (p.x < -4)       { p.x = W + 4; }
      if (p.x > W + 4)    { p.x = -4; }
    });
  }

  return { init };
})();


/* ════════════════════════════════════════════
   2.  FLOATING LANTERNS  (landing screen only)
   ════════════════════════════════════════════ */
const LanternSystem = (() => {
  const container = document.getElementById('lanterns-layer');
  let   interval;

  // Warm glow palette
  const COLORS = [
    'rgba(255,195,0,0.85)',
    'rgba(255,160,30,0.8)',
    'rgba(255,210,80,0.75)',
    'rgba(240,130,10,0.7)',
    'rgba(255,240,150,0.65)',
  ];

  function spawn () {
    if (!container) return;

    const el   = document.createElement('div');
    const size = 8 + Math.random() * 14;      // 8–22 px
    const dur  = 12 + Math.random() * 14;     // 12–26 s
    const left = Math.random() * 100;         // 0–100 vw
    const drift= (Math.random() - 0.5) * 120; // -60 to +60 px horizontal

    el.classList.add('lantern');
    Object.assign(el.style, {
      width:   size + 'px',
      height:  size * 1.45 + 'px',
      left:    left + '%',
      background: `radial-gradient(circle at 50% 40%, #fffadf, ${COLORS[Math.floor(Math.random() * COLORS.length)]})`,
      boxShadow: `0 0 ${size * 2}px ${size * 1.5}px ${COLORS[Math.floor(Math.random() * COLORS.length)]}`,
      borderRadius: '50% 50% 40% 40%',
      '--drift-x': drift + 'px',
      animationDuration: dur + 's',
      animationDelay: '0s',
    });

    container.appendChild(el);
    setTimeout(() => el.remove(), dur * 1000);
  }

  function start () {
    // Initial burst
    for (let i = 0; i < 12; i++) {
      setTimeout(spawn, Math.random() * 6000);
    }
    interval = setInterval(spawn, 1400);
  }

  function stop () {
    clearInterval(interval);
  }

  return { start, stop };
})();


/* ════════════════════════════════════════════
   3.  AUDIO MANAGER
   ════════════════════════════════════════════ */
const AudioManager = (() => {
  const cache  = {};
  let   muted  = false;
  let   current= null;
  let   endedCallback = null;

  function get (src) {
    if (!cache[src]) {
      const a = new Audio(src);
      a.loop  = true;
      a.volume= 0.72;
      a.addEventListener('ended', () => {
        // Only trigger callback if this audio is the currently active playing one
        if (a === current && endedCallback) {
          endedCallback();
        }
      });
      cache[src] = a;
    }
    return cache[src];
  }

  function fadeOut (audio, cb) {
    if (!audio) { cb && cb(); return; }
    let vol = audio.volume;
    const step = setInterval(() => {
      vol = Math.max(0, vol - 0.06);
      audio.volume = vol;
      if (vol <= 0) {
        clearInterval(step);
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 0.72;
        cb && cb();
      }
    }, 35);
  }

  function fadeIn (audio) {
    audio.volume = 0;
    audio.muted  = muted;
    audio.play().catch(() => {});
    let vol = 0;
    const step = setInterval(() => {
      vol = Math.min(0.72, vol + 0.04);
      audio.volume = vol;
      if (vol >= 0.72) clearInterval(step);
    }, 35);
  }

  function play (src, loop = true, onEnded = null) {
    endedCallback = null; // Clear immediately to prevent race conditions
    const next = get(src);
    next.loop = loop;
    endedCallback = onEnded;

    if (next === current) {
      next.currentTime = 0;
      next.play().catch(() => {});
      return;
    }

    const prev = current;
    current = next;

    fadeOut(prev, () => fadeIn(next));
  }

  function stop () {
    endedCallback = null; // Clear immediately
    fadeOut(current, () => { current = null; });
  }

  function toggleMute () {
    muted = !muted;
    Object.values(cache).forEach(a => { a.muted = muted; });

    // Update UI
    const btn      = document.getElementById('audio-toggle');
    const iconOn   = document.getElementById('icon-sound-on');
    const iconOff  = document.getElementById('icon-sound-off');
    const label    = document.getElementById('audio-label');
    const ring     = document.querySelector('.audio-ring');

    if (muted) {
      iconOn.style.display  = 'none';
      iconOff.style.display = '';
      label.textContent     = 'නිහඬ';
      ring.style.animationPlayState = 'paused';
    } else {
      iconOn.style.display  = '';
      iconOff.style.display = 'none';
      label.textContent     = 'සංගීතය';
      ring.style.animationPlayState = 'running';
    }
  }

  return { play, stop, toggleMute };
})();


/* ════════════════════════════════════════════
   4.  THORANA LIGHT BULBS & SEQUENCE ENGINE
   ════════════════════════════════════════════ */
const ThoranaSystem = (() => {
  const stage = document.getElementById('thorana-stage');
  const SHOW_SEQUENCE = ['screen2', 'screen3', 'screen4'];
  let currentPattern = 'chase';
  let showTimeout = null;
  let isShowPlaying = false;
  let activeIndex = -1;

  function initBulbs() {
    if (!stage) return;

    stage.querySelectorAll('.panel-bulbs').forEach(container => {
      const count = parseInt(container.dataset.bulbs) || 16;
      const radius = parseFloat(container.dataset.radius) || 70;
      for (let i = 0; i < count; i++) {
        const b = document.createElement('span');
        b.classList.add('bulb');
        const angle = (i / count) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        Object.assign(b.style, {
          left: `calc(50% + ${x.toFixed(1)}px)`,
          top: `calc(50% + ${y.toFixed(1)}px)`,
          animationDelay: `${(i * 0.07).toFixed(2)}s`
        });
        container.appendChild(b);
      }
    });

    stage.querySelectorAll('[data-bulbs-curve]').forEach(container => {
      const count = parseInt(container.dataset.bulbsCurve) || 30;
      const radius = parseFloat(container.dataset.radius) || 200;
      const startAngle = parseFloat(container.dataset.startAngle) || 180;
      const endAngle = parseFloat(container.dataset.endAngle) || 360;
      const angleRange = (endAngle - startAngle) * (Math.PI / 180);
      const startRad = startAngle * (Math.PI / 180);

      for (let i = 0; i < count; i++) {
        const b = document.createElement('span');
        b.classList.add('bulb');
        const angle = startRad + (i / (count - 1)) * angleRange;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        Object.assign(b.style, {
          left: `calc(50% + ${x.toFixed(1)}px)`,
          top: `calc(100% + ${y.toFixed(1)}px)`,
          animationDelay: `${(i * 0.05).toFixed(2)}s`
        });
        container.appendChild(b);
      }
    });

    stage.querySelectorAll('[data-bulbs-line]').forEach(container => {
      const count = parseInt(container.dataset.bulbsLine) || 12;
      const isVertical = container.dataset.direction === 'vertical';
      for (let i = 0; i < count; i++) {
        const b = document.createElement('span');
        b.classList.add('bulb');
        const percent = (i / (count - 1)) * 100;
        Object.assign(b.style, {
          left: isVertical ? '50%' : `${percent.toFixed(1)}%`,
          top: isVertical ? `${percent.toFixed(1)}%` : '50%',
          animationDelay: `${(i * 0.08).toFixed(2)}s`
        });
        container.appendChild(b);
      }
    });
  }

  function setPattern(patternName) {
    if (!stage) return;
    stage.classList.remove('pattern-chase', 'pattern-alternate', 'pattern-wave', 'pattern-twinkle');
    stage.classList.add(`pattern-${patternName}`);
    currentPattern = patternName;
    document.querySelectorAll('.pattern-btn').forEach(btn => {
      if (btn.dataset.pattern === patternName) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  }

  function update(screenKey) {
    if (!stage) return;
    stage.className = 'thorana-stage';
    stage.classList.add(`pattern-${currentPattern}`);
    if (screenKey === 'screen-landing') {
      document.body.classList.remove('in-app');
    } else {
      document.body.classList.add('in-app');
      stage.classList.add('active');
      if (screenKey === 'startscreen') stage.classList.add('layout-center');
      else stage.classList.add('layout-aside', `focus-${screenKey}`);
    }
  }

  function isPlaying() { return isShowPlaying; }

  function playNextStep() {
    if (!isShowPlaying) return;
    if (activeIndex >= SHOW_SEQUENCE.length - 1) {
      stopShow();
      Router.go('startscreen');
      return;
    }
    activeIndex++;
    const targetScreen = SHOW_SEQUENCE[activeIndex];
    Router.go(targetScreen);
    const src = Router.AUDIO_MAP[targetScreen];
    if (src) {
      AudioManager.play(src, false, () => {
        showTimeout = setTimeout(playNextStep, 1500);
      });
    } else {
      showTimeout = setTimeout(playNextStep, 10000);
    }
  }

  function playShow() {
    if (isShowPlaying) { stopShow(); return; }
    isShowPlaying = true;
    activeIndex = -1;
    const playBtn = document.getElementById('play-show-btn');
    if (playBtn) {
      playBtn.classList.add('active');
      playBtn.querySelector('.btn-text').textContent = 'සංදර්ශනය නවත්වන්න (Stop Show)';
    }

    let step = 0;
    const patterns = ['chase', 'alternate', 'wave', 'twinkle'];
    const lightShowInterval = setInterval(() => {
      if (!isShowPlaying) { clearInterval(lightShowInterval); return; }
      setPattern(patterns[step % patterns.length]);
      step++;
    }, 1500);

    Router.go('startscreen');
    
    // Play the startscreen audio fully (loop = false), and on end, transition to the next step
    AudioManager.play('assets/Paramitha-bala.mp3', false, () => {
      clearInterval(lightShowInterval);
      setPattern('chase');
      if (!isShowPlaying) return;
      playNextStep();
    });
  }

  function stopShow() {
    isShowPlaying = false;
    if (showTimeout) clearTimeout(showTimeout);
    const playBtn = document.getElementById('play-show-btn');
    if (playBtn) {
      playBtn.classList.remove('active');
      playBtn.querySelector('.btn-text').textContent = 'සංදර්ශනය ක්‍රියාත්මක කරන්න (Light & Sound Show)';
    }
    setPattern('chase');
    AudioManager.stop();
  }

  function init() {
    initBulbs();
    setPattern('chase');
    document.querySelectorAll('.pattern-btn').forEach(btn => {
      btn.addEventListener('click', () => { if (isShowPlaying) stopShow(); setPattern(btn.dataset.pattern); });
    });
    const playBtn = document.getElementById('play-show-btn');
    if (playBtn) playBtn.addEventListener('click', playShow);
  }

  return { 
    init, 
    update, 
    setPattern, 
    playShow, 
    stopShow, 
    isPlaying, 
    playNextStep,
    SHOW_SEQUENCE,
    setActiveIndex: (idx) => { activeIndex = idx; },
    setSubsequentTimeout: (timeoutId) => {
      if (showTimeout) clearTimeout(showTimeout);
      showTimeout = timeoutId;
    }
  };
})();


/* ════════════════════════════════════════════
   5.  SCREEN ROUTER
   ════════════════════════════════════════════ */
const Router = (() => {
  const veil = document.getElementById('veil');
  let   current = 'screen-landing';

  const AUDIO_MAP = {
    'screen-landing':    null,
    'startscreen':       'assets/Paramitha-bala.mp3',
    'screen2':           'assets/videoplayback-2-(1).mp3',
    'screen3':           'assets/videoplayback-1.mp3',
    'screen4':           'assets/Sambuddha-Parinirvanaya-Massanne.mp3',
  };

  const ROUTE_MAP = {
    'landing_btn': 'startscreen',
    'button1': 'screen2', 'button2': 'screen3', 'button3': 'screen4',
    'button7': 'screen2', 'button8': 'screen3', 'button9': 'screen4', 'button16': 'startscreen',
    'button10': 'screen2', 'button11': 'screen3', 'button12': 'screen4', 'button17': 'startscreen',
    'button13': 'screen2', 'button14': 'screen3', 'button15': 'screen4', 'button18': 'startscreen',
  };

  function resolveEl (screenKey) {
    return document.getElementById(screenKey) || document.querySelector(`[data-screen="${screenKey}"]`);
  }

  function go (screenKey, isManual = false) {
    if (screenKey === current) return;
    if (screenKey === 'screen-landing' && ThoranaSystem.isPlaying()) {
      ThoranaSystem.stopShow();
    }

    if (veil) veil.classList.add('flash');
    setTimeout(() => {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      const target = resolveEl(screenKey);
      if (target) {
        target.classList.add('active');
        target.scrollTop = 0;
      }
      current = screenKey;

      const src = AUDIO_MAP[screenKey];
      if (ThoranaSystem.isPlaying()) {
        const seqIndex = ThoranaSystem.SHOW_SEQUENCE.indexOf(screenKey);
        ThoranaSystem.setActiveIndex(screenKey === 'startscreen' ? -1 : seqIndex);
        if (src) {
          AudioManager.play(src, false, () => {
            ThoranaSystem.setSubsequentTimeout(setTimeout(ThoranaSystem.playNextStep, 1500));
          });
        } else {
          AudioManager.stop();
        }
      } else {
        if (src) AudioManager.play(src, true);
        else AudioManager.stop();
      }

      if (screenKey === 'screen-landing') LanternSystem.start();
      else LanternSystem.stop();

      ThoranaSystem.update(screenKey);
      if (veil) veil.classList.remove('flash');
    }, 220);
  }

  function init () {
    Object.entries(ROUTE_MAP).forEach(([btnId, target]) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.addEventListener('click', () => {
          if (btnId === 'landing_btn') {
            ThoranaSystem.playShow();
          } else {
            go(target, true);
          }
        });
      }
    });
  }

  return { init, go, AUDIO_MAP };
})();


/* ════════════════════════════════════════════
   6.  CARD GLOW
   ════════════════════════════════════════════ */
function initCardGlow () {
  document.querySelectorAll('.thorana-panel').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect  = card.getBoundingClientRect();
      const x     = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1);
      const y     = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
      card.style.setProperty('--glow-x', `${x}%`);
      card.style.setProperty('--glow-y', `${y}%`);
    });
  });
}


/* ════════════════════════════════════════════
   7.  RIPPLE EFFECT
   ════════════════════════════════════════════ */
function initRipple () {
  document.querySelectorAll('.cta-btn, .detail-nav__btn, .detail-nav__home, .console-btn, .pattern-btn, .thorana-panel').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const r    = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.5;
      Object.assign(r.style, {
        position: 'absolute', width: size + 'px', height: size + 'px',
        left: (e.clientX - rect.left - size / 2) + 'px', top: (e.clientY - rect.top  - size / 2) + 'px',
        background: 'rgba(255,255,255,0.18)', borderRadius: '50%',
        transform: 'scale(0)', animation: 'rippleBurst 0.55s ease-out forwards',
        pointerEvents:'none', zIndex: 10,
      });
      this.style.position = 'relative'; this.style.overflow  = 'hidden';
      this.appendChild(r);
      setTimeout(() => r.remove(), 600);
    });
  });
  if (!document.getElementById('ripple-style')) {
    const s = document.createElement('style');
    s.id = 'ripple-style';
    s.textContent = `@keyframes rippleBurst { to { transform: scale(1); opacity: 0; } }`;
    document.head.appendChild(s);
  }
}


/* ════════════════════════════════════════════
   8.  ENTRANCE STAGGER
   ════════════════════════════════════════════ */
function initStaggeredEntrance () {
  document.querySelectorAll('.thorana-panel').forEach((card, i) => {
    card.style.opacity   = '0';
    card.style.transform = 'scale(0.8) translateY(28px)';
    card.style.animation = 'none';
    setTimeout(() => {
      card.style.transition = `opacity 0.55s ${i * 0.12}s cubic-bezier(0.19,1,0.22,1), transform 0.55s ${i * 0.12}s cubic-bezier(0.19,1,0.22,1)`;
      card.style.opacity   = '1';
      card.style.transform = card.id === 'button2' ? 'translate(-50%, -50%) scale(1)' : 'translateY(-50%) scale(1)';
      setTimeout(() => {
        card.style.opacity = ''; card.style.transform = ''; card.style.transition = ''; card.style.animation = '';
      }, 550 + (i * 120) + 100);
    }, 80);
  });
}


/* ════════════════════════════════════════════
   9.  AUDIO TOGGLE
   ════════════════════════════════════════════ */
function initAudioToggle () {
  const btn = document.getElementById('audio-toggle');
  if (btn) btn.addEventListener('click', AudioManager.toggleMute);
}


/* ════════════════════════════════════════════
   10. BOOT
   ════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  ParticleSystem.init();
  LanternSystem.start();
  ThoranaSystem.init();
  Router.init();
  initAudioToggle();
  initCardGlow();
  initRipple();

  const dashScreen = document.querySelector('[data-screen="startscreen"]');
  if (dashScreen) {
    const mo = new MutationObserver(mutations => {
      mutations.forEach(m => {
        if (m.type === 'attributes' && dashScreen.classList.contains('active')) initStaggeredEntrance();
      });
    });
    mo.observe(dashScreen, { attributes: true, attributeFilter: ['class'] });
  }
});
