/* ============================================================
   解构 · 3D肉蒲团 — interactions
   纯原生 JS，无依赖。所有媒体均为用户本地文件。
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 0. 配置 ---------- */
  // 若 Imagine 站点部署到自有域名，改这里即可（当前使用相对路径互链）
  var IMAGINE_BASE = '../index.html';

  /* ---------- 1. 滚动进度条 ---------- */
  var fill = document.getElementById('readbar-fill');
  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var p = max > 0 ? (h.scrollTop || document.body.scrollTop) / max : 0;
    if (fill) fill.style.width = (p * 100).toFixed(2) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 1.5 开场仪式（每次会话一次，可跳过） ---------- */
  var intro = document.getElementById('intro');
  var flashEl = document.getElementById('flash');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var introRunning = true;
  var pending = [];

  function afterIntro(fn) {
    if (introRunning) pending.push(fn); else fn();
  }

  function flashScreen() {
    if (!flashEl || reduced) return;
    flashEl.classList.remove('on');
    void flashEl.offsetWidth;
    flashEl.classList.add('on');
  }

  function endIntro() {
    introRunning = false;
    document.body.classList.remove('intro-active');
    if (intro) intro.style.display = 'none';
    pending.forEach(function (f) { try { f(); } catch (e) {} });
    pending = [];
  }

  function openCurtain() {
    if (!intro) { endIntro(); return; }
    intro.classList.add('stage-2');
    intro.classList.add('open');
    setTimeout(endIntro, 1150);
  }

  (function startIntro() {
    if (!intro) { endIntro(); return; }
    var seen = false;
    try { seen = sessionStorage.getItem('rz-intro') === '1'; } catch (e) {}

    if (seen || reduced) { endIntro(); return; }

    document.body.classList.add('intro-active');

    var n = 3;
    var countEl = document.getElementById('ciCount');
    var tick = setInterval(function () {
      n -= 1;
      if (n <= 0) { clearInterval(tick); return; }
      if (countEl) {
        countEl.textContent = String(n);
        countEl.classList.remove('pop');
        void countEl.offsetWidth;
        countEl.classList.add('pop');
      }
    }, 260);

    function skip() {
      clearInterval(tick);
      openCurtain();
    }

    setTimeout(function () { if (intro) intro.classList.add('stage-2'); }, 620);
    setTimeout(skip, 1650);
    intro.addEventListener('click', skip);
    document.addEventListener('keydown', function onEsc(e) {
      if (e.key === 'Escape') { skip(); document.removeEventListener('keydown', onEsc); }
    });

    try { sessionStorage.setItem('rz-intro', '1'); } catch (e) {}
  })();

  /* ---------- 1.6 视差 ---------- */
  var glowA = document.querySelector('.glow-a');
  var glowB = document.querySelector('.glow-b');
  window.addEventListener('scroll', function () {
    var y = window.pageYOffset || 0;
    if (y > 1400) return;
    if (glowA) glowA.style.transform = 'translate3d(0,' + (y * 0.13).toFixed(1) + 'px,0)';
    if (glowB) glowB.style.transform = 'translate3d(0,' + (y * -0.07).toFixed(1) + 'px,0)';
  }, { passive: true });

  /* ---------- 2. 入场动画 ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 4, 3) * 70 + 'ms';
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 3. 导航高亮 ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-nav]'));
  var sections = navLinks.map(function (a) {
    return document.querySelector(a.getAttribute('href'));
  }).filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- 4. 票房条形图 ---------- */
  var bars = document.querySelectorAll('.bar-fill');
  function runBars() {
    bars.forEach(function (b) {
      b.style.width = (b.getAttribute('data-w') || 0) + '%';
    });
  }
  if ('IntersectionObserver' in window && bars.length) {
    var barIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runBars(); barIO.disconnect(); }
      });
    }, { threshold: 0.35 });
    barIO.observe(bars[0].closest('.chart-card'));
  } else { runBars(); }

  /* ---------- 4.5 数字爆点 ---------- */
  var counters = Array.prototype.slice.call(document.querySelectorAll('.cnt'));

  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-to')) || 0;
    var finalText = to.toLocaleString('en-US');

    // 无动画偏好 / 动画不可用时，直接落终值
    if (reduced) { el.textContent = finalText; return; }

    el.textContent = '0';
    var dur = 1500;
    var t0 = null;

    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e).toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);

    // 兜底：即使 rAF 被节流，也保证最终数字正确
    setTimeout(function () { el.textContent = finalText; }, dur + 260);
  }

  function runCounters() {
    counters.forEach(function (el, i) {
      setTimeout(function () { countUp(el); }, i * 130);
    });
  }

  if (counters.length) {
    if ('IntersectionObserver' in window) {
      var cIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            cIO.disconnect();
            afterIntro(runCounters);
          }
        });
      }, { threshold: 0.25 });
      cIO.observe(counters[0].closest('.hero-card'));
    } else {
      afterIntro(runCounters);
    }
  }

  /* ---------- 5. 立体原理演示 ---------- */
  var stage = document.getElementById('stage');
  var anaBtn = document.getElementById('anaglyph-btn');
  if (anaBtn && stage) {
    anaBtn.addEventListener('click', function () {
      var on = stage.classList.toggle('anaglyph');
      anaBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      anaBtn.textContent = on ? '红蓝立体 开' : '红蓝立体 关';
      flashScreen();
    });
  }

  /* ---------- 6. 播放器 ---------- */
  var player = document.getElementById('player');
  var video = document.getElementById('video');
  var emptyBox = document.getElementById('player-empty');
  var ui = document.getElementById('player-ui');
  var dropMask = document.getElementById('player-drop');
  var fileInput = document.getElementById('file-input');

  if (!player || !video) return;

  var btnPlay = document.getElementById('btn-play');
  var iconPlay = document.getElementById('icon-play');
  var iconPause = document.getElementById('icon-pause');
  var btnMute = document.getElementById('btn-mute');
  var btnRate = document.getElementById('btn-rate');
  var btnAna = document.getElementById('btn-ana');
  var btnFs = document.getElementById('btn-fs');
  var seek = document.getElementById('seek');
  var vol = document.getElementById('vol');
  var tCur = document.getElementById('t-cur');
  var tDur = document.getElementById('t-dur');

  var objectUrl = null;
  var rates = [0.75, 1, 1.25, 1.5, 2];
  var rateIdx = 1;

  function fmt(s) {
    if (!isFinite(s) || s < 0) s = 0;
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    if (m >= 60) {
      var h = Math.floor(m / 60);
      return h + ':' + String(m % 60).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
    }
    return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
  }

  function loadFile(file) {
    if (!file || !/^video\//.test(file.type || '')) {
      if (file) alert('请选择视频文件（mp4 / webm 等）。');
      return;
    }
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;
    emptyBox.hidden = true;
    ui.hidden = false;
    ui.classList.add('show');
    video.load();
    video.play().catch(function () { /* 自动播放可能被拦截，忽略 */ });
  }

  fileInput && fileInput.addEventListener('change', function (e) {
    loadFile(e.target.files && e.target.files[0]);
    e.target.value = '';
  });

  // 拖拽：整个播放器区域
  ['dragenter', 'dragover'].forEach(function (t) {
    player.addEventListener(t, function (e) {
      e.preventDefault();
      dropMask.hidden = false;
    });
  });
  ['dragleave', 'drop'].forEach(function (t) {
    player.addEventListener(t, function (e) {
      e.preventDefault();
      if (t === 'dragleave' && e.target !== player) return;
      dropMask.hidden = true;
    });
  });
  player.addEventListener('drop', function (e) {
    var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    loadFile(f);
  });

  // 播放 / 暂停
  function syncPlayIcon() {
    var paused = video.paused;
    iconPlay.hidden = !paused;
    iconPause.hidden = paused;
  }
  btnPlay && btnPlay.addEventListener('click', function () {
    if (video.paused) video.play().catch(function () {}); else video.pause();
  });
  video.addEventListener('play', syncPlayIcon);
  video.addEventListener('pause', syncPlayIcon);

  // 时间
  video.addEventListener('timeupdate', function () {
    if (video.duration) {
      seek.value = String(Math.round((video.currentTime / video.duration) * 1000));
    }
    tCur.textContent = fmt(video.currentTime);
  });
  video.addEventListener('loadedmetadata', function () {
    tDur.textContent = fmt(video.duration);
    seek.value = '0';
  });
  video.addEventListener('volumechange', function () {
    vol.value = String(video.muted ? 0 : video.volume);
  });

  seek && seek.addEventListener('input', function () {
    if (video.duration) video.currentTime = (Number(seek.value) / 1000) * video.duration;
  });

  // 音量 / 静音
  vol && vol.addEventListener('input', function () {
    video.volume = Number(vol.value);
    video.muted = Number(vol.value) === 0;
  });
  btnMute && btnMute.addEventListener('click', function () {
    video.muted = !video.muted;
    btnMute.style.opacity = video.muted ? '.45' : '1';
  });

  // 倍速
  btnRate && btnRate.addEventListener('click', function () {
    rateIdx = (rateIdx + 1) % rates.length;
    video.playbackRate = rates[rateIdx];
    btnRate.textContent = rates[rateIdx] + '×';
  });

  // 红蓝立体
  btnAna && btnAna.addEventListener('click', function () {
    var on = video.classList.toggle('ana');
    btnAna.setAttribute('aria-pressed', on ? 'true' : 'false');
    flashScreen();
  });

  // 全屏
  btnFs && btnFs.addEventListener('click', function () {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (player.requestFullscreen) player.requestFullscreen();
  });

  // 键盘
  document.addEventListener('keydown', function (e) {
    if (!video.src) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;

    if (e.code === 'Space') {
      e.preventDefault();
      if (video.paused) video.play().catch(function () {}); else video.pause();
    } else if (e.code === 'ArrowRight') {
      video.currentTime = Math.min(video.duration || 0, video.currentTime + 5);
    } else if (e.code === 'ArrowLeft') {
      video.currentTime = Math.max(0, video.currentTime - 5);
    } else if (e.key === 'm' || e.key === 'M') {
      video.muted = !video.muted;
    }
  });

  // 控件常显（触摸设备无 hover）
  if ('ontouchstart' in window) ui.classList.add('show');

  // 清理内存
  window.addEventListener('beforeunload', function () {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  });

  /* ---------- 7. Imagine 链接统一入口 ---------- */
  document.querySelectorAll('a[href="../index.html"]').forEach(function (a) {
    a.setAttribute('href', IMAGINE_BASE);
  });
})();
