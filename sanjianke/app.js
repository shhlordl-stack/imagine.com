'use strict';
(() => {
  const content = window.SANJIANKE_CONTENT;
  if (!content || !Array.isArray(content.stories)) {
    document.getElementById('storyGrid').textContent = '故事暂未加载。请刷新页面检查本地资源是否完整。';
    return;
  }
  const eraLabels = { past: '过去', now: '现在', future: '未来' };
  const regionLabels = { china: '国内', world: '国外 / 国际' };
  const eraNotes = { past: '历史线索', now: '当下观察', future: '想象实验' };
  const state = { era: 'all', region: 'all', topic: 'all', search: '', limit: 6, journey: 'water', question: 0, answer: null, score: 0, currentStory: null };
  const grid = document.getElementById('storyGrid');
  const dialog = document.getElementById('storyDialog');
  const dialogContent = document.getElementById('dialogContent');
  const toast = document.getElementById('toast');
  let previousFocus = null;
  let toastTimer;
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const icon = (name, className = '') => `<svg class="${className}" viewBox="0 0 100 100" aria-hidden="true"><use href="#i-${escapeHtml(name)}"/></svg>`;
  const groups = ['past', 'now', 'future'].flatMap(era => ['china', 'world'].map(region => content.stories.filter(story => story.era === era && story.region === region)));
  const stories = [];
  for (let index = 0; index < Math.max(...groups.map(group => group.length)); index++) {
    groups.forEach(group => { if (group[index]) stories.push(group[index]); });
  }
  const findStory = id => stories.find(story => story.id === id);

  function message(text) {
    clearTimeout(toastTimer);
    toast.textContent = text;
    toast.classList.add('visible');
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 2800);
  }

  function matchingStories() {
    const query = state.search.trim().toLocaleLowerCase('zh-CN');
    return stories.filter(story => (state.era === 'all' || story.era === state.era)
      && (state.region === 'all' || story.region === state.region)
      && (state.topic === 'all' || story.topic === state.topic)
      && (!query || [story.title, story.subtitle, story.stamp, story.fact, story.topic, ...story.body].join(' ').toLocaleLowerCase('zh-CN').includes(query)));
  }

  function renderStories() {
    const matched = matchingStories();
    const visible = matched.slice(0, state.limit);
    document.getElementById('resultCount').textContent = `找到 ${matched.length} 个故事 · 当前展开 ${visible.length} 个`;
    document.getElementById('loadMore').hidden = matched.length <= state.limit;
    if (!visible.length) {
      grid.innerHTML = '<div class="empty-state"><h3>这个坐标，还没有故事。</h3><p>换一个时间、地域或主题。好奇心不必被一个搜索词困住。</p><button class="button outline" data-reset>重新看看全部故事</button></div>';
      return;
    }
    grid.innerHTML = visible.map(story => `<article class="story-card era-${story.era}"><div class="card-art"><span class="card-era">${eraLabels[story.era]} / ${eraNotes[story.era]}</span>${icon(story.icon)}<span class="card-spark" aria-hidden="true">✳</span><span class="card-index">STORY ${String(stories.indexOf(story) + 1).padStart(2, '0')}</span></div><div class="card-body"><div class="card-meta"><span>${regionLabels[story.region]}</span><span>${escapeHtml(story.topic)}</span></div><h3>${escapeHtml(story.title)}</h3><p>${escapeHtml(story.subtitle)}</p><div class="card-bottom"><span>${escapeHtml(story.stamp)}</span><button class="read-story" data-story="${story.id}" aria-label="读故事：${escapeHtml(story.title)}">读故事 ↗</button></div></div></article>`).join('');
  }

  function renderFilters() {
    [['eraFilters', 'era'], ['regionFilters', 'region'], ['topicFilters', 'topic']].forEach(([id, key]) => {
      document.getElementById(id).querySelectorAll('button').forEach(button => {
        const active = button.dataset[key] === state[key];
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    });
  }

  function reset() {
    state.era = state.region = state.topic = 'all';
    state.search = '';
    state.limit = 6;
    document.getElementById('storySearch').value = '';
    renderFilters();
    renderStories();
  }

  function renderJourney() {
    document.getElementById('journeyTabs').innerHTML = content.journeys.map(journey => `<button class="journey-tab ${journey.id === state.journey ? 'active' : ''}" data-journey="${journey.id}" aria-pressed="${journey.id === state.journey}">${escapeHtml(journey.title)}</button>`).join('');
    const journey = content.journeys.find(item => item.id === state.journey);
    document.getElementById('journeyTrack').innerHTML = journey.ids.map((id, index) => {
      const story = findStory(id);
      return `<article class="journey-step"><div class="step-top"><span>0${index + 1} / ${eraLabels[story.era]}</span>${icon(story.icon)}</div><h3>${escapeHtml(story.title)}</h3><p>${escapeHtml(story.fact)}</p><button class="read-story" data-story="${story.id}">打开这个时代 ↗</button></article>`;
    }).join('');
  }

  function renderQuiz() {
    const card = document.getElementById('quizCard');
    if (state.question >= content.quiz.length) {
      card.innerHTML = `<div class="quiz-end"><div class="quiz-progress">这一小段探索，完成了。</div><span class="quiz-mark" aria-hidden="true">✳</span><h3>不是为了满分，<br>是为了多一个问题。</h3><p>本轮答对 ${state.score} / ${content.quiz.length} 道。结果仅保留在本页内存，刷新即清空，不作任何用户评估。</p><div class="quiz-controls"><button class="button coral" data-restart>再玩一轮 ↺</button><button class="text-button" data-random>开一个新故事 ↗</button></div></div>`;
      return;
    }
    const question = content.quiz[state.question];
    const answered = state.answer !== null;
    card.innerHTML = `<div class="quiz-progress"><span>好奇心小测试 / ${state.question + 1} / ${content.quiz.length}</span><div class="progress-dots" aria-hidden="true">${content.quiz.map((item, index) => `<span class="${index <= state.question ? 'done' : ''}"></span>`).join('')}</div></div><h3>${escapeHtml(question.q)}</h3><div class="quiz-options">${question.choices.map((choice, index) => `<button class="quiz-option ${answered && index === question.correct ? 'correct' : answered && index === state.answer ? 'incorrect' : ''}" data-answer="${index}" ${answered ? 'disabled' : ''}><b>${String.fromCharCode(65 + index)}</b><span>${escapeHtml(choice)}</span></button>`).join('')}</div>${answered ? `<p class="quiz-feedback"><strong>${state.answer === question.correct ? '猜对了。' : '答案藏在另一个选项里。'}</strong> ${escapeHtml(question.why)}</p><div class="quiz-controls"><button class="text-button" data-story="${question.story}">看看背后的故事 ↗</button><button class="button coral" data-next-question>${state.question + 1 === content.quiz.length ? '收下这次探索' : '下一题'} →</button></div>` : ''}`;
  }

  function openStory(id, setHash = true) {
    const story = findStory(id);
    if (!story) return;
    const source = content.sources[story.source];
    state.currentStory = id;
    dialogContent.innerHTML = `<div class="dialog-inner"><div class="dialog-meta">${eraLabels[story.era]} · ${regionLabels[story.region]} · ${escapeHtml(story.topic)} / ${eraNotes[story.era]}</div><h2 id="dialogTitle">${escapeHtml(story.title)}</h2><p class="dialog-hook">${escapeHtml(story.hook)}</p><div class="fact-box"><strong>${story.era === 'future' ? '想象之前，先确认事实底座' : '先放下一条事实线索'}</strong><p>${escapeHtml(story.fact)}</p></div><div class="story-prose">${story.body.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('')}</div><div class="question-box"><span>把一个小问题带走 / 不用提交</span><p>${escapeHtml(story.prompt)}</p></div><div class="source-row"><span>${story.era === 'future' ? '下列来源支持事实底座，不为本文未来设想背书。' : '延伸阅读与事实线索；叙事比喻和练习由本站整理。'}</span><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.title)} ↗</a></div><div class="dialog-actions"><button class="button outline" data-copy-story>复制故事链接</button><button class="button coral" data-random>再遇见一个故事 ✦</button></div></div>`;
    if (!dialog.open) {
      previousFocus = document.activeElement;
      dialog.showModal();
      document.body.classList.add('dialog-open');
    }
    dialog.scrollTop = 0;
    if (setHash && window.location.hash !== `#story-${id}`) {
      history.replaceState(null, '', `#story-${id}`);
    }
    document.getElementById('closeStory').focus();
  }

  function closeStory() {
    if (dialog.open) dialog.close();
  }

  function randomStory() {
    const available = matchingStories();
    const pool = (available.length ? available : stories).filter(story => story.id !== state.currentStory);
    const candidates = pool.length ? pool : stories;
    openStory(candidates[Math.floor(Math.random() * candidates.length)].id);
  }

  async function copyStory() {
    if (!state.currentStory) return;
    const url = new URL(window.location.href);
    url.hash = `story-${state.currentStory}`;
    try {
      if (!navigator.clipboard) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(url.href);
      message('故事链接已复制。没有记录这次分享。');
    } catch {
      const input = document.createElement('input');
      input.value = url.href;
      input.setAttribute('readonly', '');
      input.style.width = '100%';
      input.setAttribute('aria-label', '故事链接，可手动复制');
      dialogContent.querySelector('.dialog-actions').append(input);
      input.focus();
      input.select();
      message('浏览器未允许复制，请手动复制选中的链接。');
    }
  }

  document.getElementById('eraFilters').addEventListener('click', event => {
    const button = event.target.closest('[data-era]');
    if (!button) return;
    state.era = button.dataset.era;
    state.limit = 6;
    renderFilters(); renderStories();
  });
  document.getElementById('regionFilters').addEventListener('click', event => {
    const button = event.target.closest('[data-region]');
    if (!button) return;
    state.region = button.dataset.region;
    state.limit = 6;
    renderFilters(); renderStories();
  });
  document.getElementById('topicFilters').addEventListener('click', event => {
    const button = event.target.closest('[data-topic]');
    if (!button) return;
    state.topic = button.dataset.topic;
    state.limit = 6;
    renderFilters(); renderStories();
  });
  document.getElementById('storySearch').addEventListener('input', event => {
    state.search = event.target.value;
    state.limit = 6;
    renderStories();
  });
  document.getElementById('resetFilters').addEventListener('click', reset);
  document.getElementById('loadMore').addEventListener('click', () => { state.limit += 6; renderStories(); });
  document.getElementById('surpriseHero').addEventListener('click', randomStory);
  document.getElementById('closeStory').addEventListener('click', closeStory);
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeStory();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    if (window.location.hash.startsWith('#story-')) history.replaceState(null, '', window.location.pathname + window.location.search);
    if (previousFocus && previousFocus.isConnected) previousFocus.focus();
  });
  document.addEventListener('click', event => {
    const target = event.target.closest('button');
    if (!target) return;
    if (target.hasAttribute('data-story')) openStory(target.dataset.story);
    else if (target.hasAttribute('data-guide')) {
      reset(); state.era = target.dataset.guide; renderFilters(); renderStories();
      document.getElementById('explore').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    } else if (target.hasAttribute('data-journey')) {
      state.journey = target.dataset.journey; renderJourney();
    } else if (target.hasAttribute('data-reset')) reset();
    else if (target.hasAttribute('data-random')) randomStory();
    else if (target.hasAttribute('data-copy-story')) copyStory();
    else if (target.hasAttribute('data-answer') && state.answer === null) {
      state.answer = Number(target.dataset.answer);
      if (state.answer === content.quiz[state.question].correct) state.score++;
      renderQuiz();
    } else if (target.hasAttribute('data-next-question') && state.answer !== null) {
      state.question++; state.answer = null; renderQuiz();
    } else if (target.hasAttribute('data-restart')) {
      state.question = 0; state.answer = null; state.score = 0; renderQuiz();
    }
  });
  window.addEventListener('hashchange', () => {
    if (window.location.hash.startsWith('#story-')) openStory(window.location.hash.slice(7), false);
    else if (dialog.open) closeStory();
  });
  renderStories(); renderJourney(); renderQuiz();
  if (window.location.hash.startsWith('#story-')) openStory(window.location.hash.slice(7), false);
})();
