(function () {
  'use strict';

  const data = window.IMAGINE_CASES;
  const article = document.getElementById('article');
  const tocList = document.getElementById('tocList');
  const progressBar = document.getElementById('progressBar');

  if (!data || !Array.isArray(data.chapters) || !data.chapters.length) {
    article.innerHTML = '<p class="caution">内容加载失败，请刷新页面重试。</p>';
    return;
  }

  const chapters = data.chapters;
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);

  let current = chapters[0].id;

  function chapterIndex(id) {
    return chapters.findIndex(item => item.id === id);
  }

  function renderToc() {
    tocList.innerHTML = chapters.map(chapter => `
      <a class="toc-link" href="#${chapter.id}" data-chapter="${chapter.id}">
        <em>${escapeHtml(chapter.number)}</em>
        <span>${escapeHtml(chapter.title)}</span>
      </a>`).join('');
    document.getElementById('tocList').classList.add('toc-list');
  }

  function markActive() {
    tocList.querySelectorAll('.toc-link').forEach(link => {
      const active = link.dataset.chapter === current;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  function caseHtml(chapter) {
    return `
      <header class="chapter-head">
        <p class="chapter-number">${escapeHtml(chapter.number)}</p>
        <p class="chapter-kicker">${escapeHtml(chapter.kicker)}</p>
        <h1>${escapeHtml(chapter.title)}</h1>
        <p class="chapter-lead">${escapeHtml(chapter.lead)}</p>
      </header>
      <div class="scene">
        <p class="block-label">场景</p>
        ${chapter.scene.map(item => `<p>${escapeHtml(item)}</p>`).join('')}
      </div>
      <section class="misread">
        <p class="block-label">常见的误读</p>
        <p class="misread-quote">「${escapeHtml(chapter.misread.common)}」</p>
        <p class="misread-note">${escapeHtml(chapter.misread.note)}</p>
      </section>
      <section class="naming">
        <p class="block-label">它在心理学里叫什么</p>
        <h3>${escapeHtml(chapter.naming.term)}<span>${escapeHtml(chapter.naming.en)}</span></h3>
        <p>${escapeHtml(chapter.naming.definition)}</p>
      </section>
      <section class="layers">
        <p class="block-label">由浅入深</p>
        <ol>${chapter.layers.map(layer => `
          <li>
            <p class="layer-label">${escapeHtml(layer.label)}</p>
            <h4>${escapeHtml(layer.title)}</h4>
            ${layer.body.map(item => `<p>${escapeHtml(item)}</p>`).join('')}
          </li>`).join('')}
        </ol>
      </section>
      <section class="disciplines">
        <p class="block-label">这一章动用了哪些学科</p>
        <div class="disc-grid">
          ${chapter.disciplines.map(item => `
            <div class="disc"><b>${escapeHtml(item.name)}</b><p>${escapeHtml(item.question)}</p></div>`).join('')}
        </div>
      </section>
      <section class="evidence">
        <p class="block-label">研究笔记</p>
        <ol>${chapter.evidence.map(item => `
          <li><b>${escapeHtml(item.source)}</b><span>${escapeHtml(item.finding)}</span></li>`).join('')}
        </ol>
      </section>
      <section class="actions">
        <p class="block-label">可以怎么做</p>
        <div class="action-grid">
          ${chapter.actions.map(group => `
            <div class="action">
              <h4>${escapeHtml(group.for)}</h4>
              <ul>${group.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
            </div>`).join('')}
        </div>
      </section>
      <blockquote class="closing">${escapeHtml(chapter.closing)}</blockquote>
      <section class="reading">
        <p class="block-label">延伸阅读</p>
        <ul>${chapter.reading.map(item => `
          <li><b>${escapeHtml(item.title)}</b> <em>${escapeHtml(item.author)}</em><p>${escapeHtml(item.note)}</p></li>`).join('')}
        </ul>
      </section>
      <p class="caution">${escapeHtml(chapter.caution)}</p>`;
  }

  function essayHtml(chapter) {
    return `
      <header class="chapter-head">
        <p class="chapter-number">${escapeHtml(chapter.number)}</p>
        <p class="chapter-kicker">${escapeHtml(chapter.kicker)}</p>
        <h1>${escapeHtml(chapter.title)}</h1>
        <p class="chapter-lead">${escapeHtml(chapter.lead)}</p>
      </header>
      ${chapter.essay.map(section => `
        <section class="essay-section">
          <h3>${escapeHtml(section.title)}</h3>
          ${section.body.map(item => `<p>${escapeHtml(item)}</p>`).join('')}
        </section>`).join('')}
      <blockquote class="closing">${escapeHtml(chapter.closing)}</blockquote>
      <p class="caution">${escapeHtml(chapter.caution)}</p>`;
  }

  function pagerHtml(index) {
    const prev = chapters[index - 1];
    const next = chapters[index + 1];
    const prevLink = prev
      ? `<a class="prev" href="#${prev.id}">← 上一章<b>${escapeHtml(prev.title)}</b></a>`
      : '<span></span>';
    const nextLink = next
      ? `<a class="next" href="#${next.id}">下一章 →<b>${escapeHtml(next.title)}</b></a>`
      : '<a class="next" href="../index.html">回到 Imagine<b>继续逛这座书架</b></a>';
    return `<nav class="pager" aria-label="章节翻页">${prevLink}${nextLink}</nav>`;
  }

  function render(id, options) {
    const index = chapterIndex(id);
    if (index < 0) return false;
    const chapter = chapters[index];
    current = chapter.id;
    article.innerHTML = (chapter.kind === 'essay' ? essayHtml(chapter) : caseHtml(chapter)) + pagerHtml(index);
    markActive();
    document.title = `${chapter.title} · 行为背后`;
    if (options && options.scroll) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      article.focus({ preventScroll: true });
    }
    updateProgress();
    return true;
  }

  function idFromHash() {
    return decodeURIComponent((location.hash || '').replace(/^#/, ''));
  }

  function route() {
    const id = idFromHash();
    if (!id) {
      render(chapters[0].id, { scroll: false });
      return;
    }
    render(id, { scroll: true });
  }

  function updateProgress() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
    progressBar.style.width = `${(ratio * 100).toFixed(2)}%`;
  }

  renderToc();
  route();

  window.addEventListener('hashchange', route);
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);

  document.addEventListener('click', event => {
    const link = event.target.closest('.pager a, .toc-link');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (href.startsWith('#')) {
      event.preventDefault();
      const id = href.slice(1);
      if (history.replaceState) history.replaceState(null, '', href);
      else location.hash = href;
      render(id, { scroll: true });
    }
  });
})();
