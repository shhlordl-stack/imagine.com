/* ============================================================
   松绑 UNCLENCH · 交互脚本
   原则：所有数据只留在内存里，不写 localStorage、不发请求
   ============================================================ */

(function () {
  'use strict';

  /* ---------- 滚动进度 ---------- */
  const fill = document.getElementById('readbarFill');
  function onScroll() {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const p = h > 0 ? (window.scrollY / h) * 100 : 0;
    fill.style.width = p.toFixed(2) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 进场动画 ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  /* ---------- 导航高亮 ---------- */
  const navLinks = Array.from(document.querySelectorAll('[data-nav]'));
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => a.classList.remove('active'));
        const link = navLinks.find((a) => a.getAttribute('href') === '#' + entry.target.id);
        if (link) link.classList.add('active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
  }

  /* ============================================================
     自测
     ============================================================ */
  const DIMS = [
    { id: 'info',  label: '信息', name: '信息错位' },
    { id: 'time',  label: '时间', name: '时间错位' },
    { id: 'lang',  label: '语言', name: '语言缺失' },
    { id: 'perf',  label: '表现', name: '表现焦虑' },
    { id: 'shame', label: '羞耻', name: '羞耻沉默' }
  ];

  const QUESTIONS = [
    { dim: 'info',  text: '我对身体的了解，主要来自网络内容，而不是系统的科普或课程。' },
    { dim: 'info',  rev: true, text: '遇到具体的困惑时，我知道该去哪里查可靠的信息。' },
    { dim: 'time',  text: '我会因为“还没有经历”而觉得自己落后于同龄人。' },
    { dim: 'time',  text: '我觉得现在这段时间只是“过渡”，真正的生活还没开始。' },
    { dim: 'lang',  text: '真到需要表达的时候，我常常只会说“随便”或者“都行”。' },
    { dim: 'lang',  rev: true, text: '我能比较清楚地说出“我想要什么”和“我不想要什么”。' },
    { dim: 'perf',  text: '我会一边经历，一边在心里给自己打分。' },
    { dim: 'perf',  text: '“我怕自己不够好”这个念头，会让我更紧张。' },
    { dim: 'shame', text: '提到这件事，我第一反应是尴尬，或者想换个话题。' },
    { dim: 'shame', text: '有些困惑我宁愿自己扛着，也不想让任何人知道。' }
  ];

  const OPTIONS = [
    { v: 1, label: '几乎不符合' },
    { v: 2, label: '有点符合' },
    { v: 3, label: '比较符合' },
    { v: 4, label: '非常符合' }
  ];

  const RX = {
    info: {
      title: '换一个信息源',
      body: '今晚花 10 分钟，去看一份有出处的科普——医院公众号、疾控中心页面、正规教材都行。只解决一个具体问题，不要一次补完整个知识体系。'
    },
    time: {
      title: '把“过渡期”这个词删掉',
      body: '写下你现在生活里已经成立的三件事：一份工作或学业、几个真实的关系、你照顾自己的方式。它们不是等待，是正在进行。'
    },
    lang: {
      title: '练一句边界句',
      body: '对着镜子说三遍：“我现在不想，但我可以告诉你为什么。”不用真的用上，先让嘴熟悉这个句型。语言是练出来的，不是等出来的。'
    },
    perf: {
      title: '把评分员请出去',
      body: '紧张的时候，把注意力放到一个具体的触感上——温度、压力、呼吸的进出。注意力有地方去，就不会跑回天花板继续打分。'
    },
    shame: {
      title: '找一个低风险的人',
      body: '选一个会保密、不急着给建议的人，只说一句：“我最近有件事一直放不下。”不用一次说完，说出口本身就已经在拆锁。'
    }
  };

  const answers = new Array(QUESTIONS.length).fill(0);
  const quizList = document.getElementById('quizList');
  const quizProgress = document.getElementById('quizProgress');
  const quizSubmit = document.getElementById('quizSubmit');
  const quizReset = document.getElementById('quizReset');
  const quizResult = document.getElementById('quizResult');

  function renderQuiz() {
    quizList.innerHTML = QUESTIONS.map((q, i) => `
      <div class="q" data-i="${i}">
        <span class="q-no">${String(i + 1).padStart(2, '0')}</span>
        <div>
          <p class="q-text">${q.text}</p>
          <div class="q-opts">
            ${OPTIONS.map((o) => `<button class="opt" data-v="${o.v}" data-q="${i}">${o.label}</button>`).join('')}
          </div>
        </div>
      </div>`).join('');
  }

  function updateProgress() {
    const done = answers.filter((v) => v > 0).length;
    quizProgress.textContent = `${done} / ${QUESTIONS.length} 已作答`;
    quizSubmit.disabled = done < QUESTIONS.length;
  }

  quizList.addEventListener('click', (e) => {
    const btn = e.target.closest('.opt');
    if (!btn) return;
    const qi = Number(btn.dataset.q);
    const v = Number(btn.dataset.v);
    answers[qi] = v;
    btn.parentElement.querySelectorAll('.opt').forEach((b) => b.classList.remove('on'));
    btn.classList.add('on');
    updateProgress();
  });

  quizReset.addEventListener('click', () => {
    answers.fill(0);
    quizList.querySelectorAll('.opt').forEach((b) => b.classList.remove('on'));
    quizResult.classList.remove('show');
    quizResult.innerHTML = '';
    updateProgress();
    document.getElementById('quiz').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  quizSubmit.addEventListener('click', () => {
    const scores = {};
    DIMS.forEach((d) => { scores[d.id] = 0; });
    QUESTIONS.forEach((q, i) => {
      const raw = answers[i] || 0;
      const v = q.rev ? 5 - raw : raw;
      scores[q.dim] += v;
    });

    const rows = DIMS.map((d) => {
      const pct = Math.round(((scores[d.id] - 2) / 6) * 100);
      return { ...d, pct: Math.max(0, Math.min(100, pct)) };
    }).sort((a, b) => b.pct - a.pct);

    const overall = Math.round(rows.reduce((s, r) => s + r.pct, 0) / rows.length);
    const top = rows[0];
    const second = rows[1];

    let headline;
    if (overall >= 70) headline = '压力正在持续占用你的注意力';
    else if (overall >= 45) headline = '有几处明显的紧绷';
    else headline = '整体还算稳，但有一处值得留意';

    const leadMap = {
      info: '你的压力主要来自信息缺口——不是你想太多，而是你手里没有可靠的地图。这类压力最容易解决，因为它只需要一次查找。',
      time: '你的压力主要来自“进度感”——把别人的时间表当成了自己的标准。这类压力不会因为更努力而减轻，只会因为换参照系而减轻。',
      lang: '你的压力主要来自说不出口——需求、边界、困惑都卡在表达这一关。这类压力最值得投入练习，因为它是可训练的。',
      perf: '你的压力主要来自被评价的恐惧——你把自己放在了考官的位置上。这类压力通常不是“能力问题”，而是注意力放错了地方。',
      shame: '你的压力主要来自沉默本身——不敢说，于是以为只有自己这样，于是更不敢说。这类压力的解法不是想通，而是找到第一个可以说话的人。'
    };

    const rx = [RX[top.id], RX[second.id], {
      title: '先让身体降下来',
      body: '不管压力来自哪一格，身体都是入口。做一轮 90 秒呼吸（工具箱第 01 件），再回来看这份结果。'
    }];

    quizResult.innerHTML = `
      <div class="qr-head">
        <h3>${headline}</h3>
        <span>压力读数 ${overall} / 100</span>
      </div>
      <p class="qr-lead">${leadMap[top.id]}</p>
      <div class="qr-bars">
        ${rows.map((r) => `
          <div class="qr-bar ${r.id === top.id ? 'hot' : ''}">
            <span>${r.name}</span>
            <div class="qr-track"><i data-w="${r.pct}"></i></div>
            <span class="qr-val">${r.pct}</span>
          </div>`).join('')}
      </div>
      <div class="rx-grid">
        ${rx.map((item, i) => `<div class="rx"><span>处方 ${String(i + 1).padStart(2, '0')}</span><b>${item.title}</b><p>${item.body}</p></div>`).join('')}
      </div>
      <p class="qr-foot">
        这不是诊断。分数高不代表你有问题，只代表这件事最近占用了你比较多注意力。
        如果你希望有人陪着一起看，第 06 节有可以直接用的求助路径。
      </p>`;

    quizResult.classList.add('show');
    requestAnimationFrame(() => {
      quizResult.querySelectorAll('.qr-track i').forEach((bar) => {
        bar.style.width = bar.dataset.w + '%';
      });
    });
    setTimeout(() => {
      quizResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
  });

  renderQuiz();
  updateProgress();

  /* ============================================================
     工具 01 · 呼吸
     ============================================================ */
  const ring = document.getElementById('breathRing');
  const bLabel = document.getElementById('breathLabel');
  const bBtn = document.getElementById('breathBtn');
  const bCount = document.getElementById('breathCount');

  const PHASES = [
    { key: 'inhale', ms: 4000, label: '吸气', sub: '4 秒' },
    { key: 'hold',   ms: 2000, label: '停住', sub: '2 秒' },
    { key: 'exhale', ms: 6000, label: '呼气', sub: '6 秒' }
  ];

  let bRunning = false;
  let bPhase = 0;
  let bCycles = 0;
  let bElapsed = 0;
  let bTimeout = null;
  let bInterval = null;

  function setLabel(main, sub) {
    bLabel.innerHTML = `${main}<small>${sub}</small>`;
  }

  function runPhase(index) {
    if (!bRunning) return;
    const p = PHASES[index % PHASES.length];
    if (index % PHASES.length === 0 && index > 0) {
      bCycles += 1;
      bCount.textContent = bCycles + ' 轮';
    }
    ring.classList.remove('inhale', 'exhale');
    if (p.key === 'inhale') ring.classList.add('inhale');
    if (p.key === 'exhale') ring.classList.add('exhale');

    let remain = Math.round(p.ms / 1000);
    setLabel(p.label, remain + ' 秒');
    clearInterval(bInterval);
    bInterval = setInterval(() => {
      remain -= 1;
      if (remain > 0) setLabel(p.label, remain + ' 秒');
    }, 1000);

    bTimeout = setTimeout(() => {
      clearInterval(bInterval);
      bElapsed += p.ms;
      if (bElapsed >= 90000) {
        finishBreath();
        return;
      }
      runPhase(index + 1);
    }, p.ms);
  }

  function finishBreath() {
    bRunning = false;
    ring.classList.remove('inhale', 'exhale');
    setLabel('结束了', `${bCycles} 轮 · 90 秒`);
    bBtn.textContent = '再来一次';
  }

  bBtn.addEventListener('click', () => {
    if (bRunning) {
      bRunning = false;
      clearTimeout(bTimeout);
      clearInterval(bInterval);
      ring.classList.remove('inhale', 'exhale');
      setLabel('暂停了', '随时可以继续');
      bBtn.textContent = '继续';
      return;
    }
    if (bElapsed >= 90000) {
      bElapsed = 0;
      bCycles = 0;
      bPhase = 0;
      bCount.textContent = '0 轮';
    }
    bRunning = true;
    bBtn.textContent = '暂停';
    runPhase(Math.floor(bElapsed / 12000));
  });

  /* ============================================================
     工具 02 · 换句卡
     ============================================================ */
  const SWAPS = [
    {
      old: '我这么大了还什么都没经历过，我是不是有问题。',
      tag: '换一个归因',
      new: '经历的时间点没有统一时刻表。我现在的困惑是真实的，但它不是“我有缺陷”的证据。'
    },
    {
      old: '我总在想这件事，太不正经了。',
      tag: '换一个判断',
      new: '念头本身没有道德属性。重要的是我拿它做了什么，而不是它有没有出现过。'
    },
    {
      old: '我怕我说不，对方会失望，会觉得我不爱他。',
      tag: '换一个责任',
      new: '能承接我的“不”的关系，才承接得住我的“好”。失望是对方的情绪，不是我的过错。'
    },
    {
      old: '我表现得很差，我不配。',
      tag: '换一个解释',
      new: '一次体验里有很多变量：疲惫、紧张、环境、关系。把它全部归到“我不行”，是一种归因上的偷懒。'
    },
    {
      old: '只有我这样，别人都很正常。',
      tag: '换一个样本',
      new: '沉默会制造“只有我”的错觉。真正聊开之后，你会发现样本比你想象的大得多。'
    },
    {
      old: '等我有对象、结婚了，这些问题自然就解决了。',
      tag: '换一个期待',
      new: '关系不会自动修复沟通能力。说不出口的话，进入关系之后只会更难说。'
    }
  ];

  const swapGrid = document.getElementById('swapGrid');
  swapGrid.innerHTML = SWAPS.map((s) => `
    <div class="swap" role="button" tabindex="0">
      <p class="old">${s.old}</p>
      <div class="new"><b>${s.tag}</b>${s.new}</div>
    </div>`).join('');

  function toggleSwap(el) {
    el.classList.toggle('open');
  }
  swapGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.swap');
    if (card) toggleSwap(card);
  });
  swapGrid.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.swap');
    if (card) {
      e.preventDefault();
      toggleSwap(card);
    }
  });

  /* ============================================================
     工具 03 · 写下来然后撕掉
     ============================================================ */
  const paper = document.getElementById('paper');
  const paperText = document.getElementById('paperText');
  const paperBurn = document.getElementById('paperBurn');
  const paperDone = document.getElementById('paperDone');
  let burning = false;

  paperBurn.addEventListener('click', () => {
    if (burning) return;
    if (!paperText.value.trim()) {
      const old = paperBurn.textContent;
      paperBurn.textContent = '先写一句吧';
      setTimeout(() => { paperBurn.textContent = old; }, 1800);
      return;
    }
    burning = true;
    paper.classList.add('burning');
    setTimeout(() => {
      paperText.value = '';
      paper.classList.add('done');
      paperDone.hidden = false;
    }, 1080);
    setTimeout(() => {
      paper.classList.remove('burning', 'done');
      paperDone.hidden = true;
      burning = false;
    }, 4400);
  });

  /* ============================================================
     工具 04 · 担忧窗口
     ============================================================ */
  const worryClock = document.getElementById('worryClock');
  const worryBtn = document.getElementById('worryBtn');
  const worryReset = document.getElementById('worryReset');
  const WORRY_TOTAL = 300;
  let worryLeft = WORRY_TOTAL;
  let worryTimer = null;
  let worryRunning = false;

  function paintWorry() {
    const m = String(Math.floor(worryLeft / 60)).padStart(2, '0');
    const s = String(worryLeft % 60).padStart(2, '0');
    worryClock.textContent = `${m}:${s}`;
  }

  function stopWorry() {
    worryRunning = false;
    clearInterval(worryTimer);
    worryBtn.textContent = worryLeft === 0 ? '再来一次' : '继续';
  }

  worryBtn.addEventListener('click', () => {
    if (worryRunning) {
      stopWorry();
      return;
    }
    if (worryLeft <= 0) {
      worryLeft = WORRY_TOTAL;
      paintWorry();
    }
    worryRunning = true;
    worryBtn.textContent = '暂停';
    worryTimer = setInterval(() => {
      worryLeft -= 1;
      paintWorry();
      if (worryLeft <= 0) {
        clearInterval(worryTimer);
        worryRunning = false;
        worryClock.textContent = '00:00';
        worryBtn.textContent = '再来一次';
        worryClock.style.color = 'var(--sage)';
      }
    }, 1000);
  });

  worryReset.addEventListener('click', () => {
    clearInterval(worryTimer);
    worryRunning = false;
    worryLeft = WORRY_TOTAL;
    worryClock.style.color = '';
    worryBtn.textContent = '开始 5 分钟';
    paintWorry();
  });

  paintWorry();
})();
