/* =============================================================
   thinklab · shared theme.js
   scroll progress / back-to-top / anchor scroll / code blocks /
   j/k nav / sticky TOC / mermaid init / article index (home only)
   ============================================================= */
(() => {
  // ---------- helpers ----------
  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }
  // Some keydown targets (document, shadow roots, detached nodes) don't have
  // .matches(); guarding with a typeof check avoids "not a function" crashes.
  function isTextInput(target) {
    return !!(target && typeof target.matches === 'function' && target.matches('input,textarea'));
  }
  // "YYYY-MM-DD" — if input already matches, return it as-is. Parsing through
  // new Date() would shift the wall-clock date by one day in east-of-UTC locales.
  function formatDate(iso) {
    const s = String(iso || '');
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    try { return new Date(s).toISOString().slice(0, 10); } catch { return s; }
  }

  // ---------- 1. scroll progress bar + back-to-top ----------
  function initScrollUI() {
    const progress = document.getElementById('scroll-progress');
    const toTopBtn = document.getElementById('to-top');
    if (!progress && !toTopBtn) return;

    let docHeight = 0;
    let ticking = false;
    let lastPw = -1;
    let lastShow = null;

    function recalcDocHeight() {
      docHeight = document.documentElement.scrollHeight - window.innerHeight;
    }
    function update() {
      const pw = docHeight > 0 ? Math.min(100, (window.scrollY / docHeight) * 100) : 0;
      if (progress && pw !== lastPw) {
        progress.style.setProperty('--pw', pw + '%');
        lastPw = pw;
      }
      const show = window.scrollY > 600;
      if (toTopBtn && show !== lastShow) {
        toTopBtn.classList.toggle('show', show);
        lastShow = show;
      }
      ticking = false;
    }
    function onScroll() {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }

    recalcDocHeight();
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { recalcDocHeight(); onScroll(); }, { passive: true });
    if (toTopBtn) {
      toTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
  }

  // ---------- 2. anchor smooth scroll (delegated) ----------
  function initAnchorScroll() {
    document.addEventListener('click', e => {
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 20;
      window.scrollTo({ top, behavior: 'smooth' });
      history.replaceState(null, '', '#' + id);
    });
  }

  // ---------- 3. code-block enhancement (lang label + copy button) ----------
  function detectLang(codeEl) {
    const m = (codeEl.className || '').match(/language-(\w+)/);
    if (m) return m[1];
    const txt = codeEl.textContent;
    if (/^\s*[\{\[]/.test(txt) && /[:"}]/.test(txt)) return 'json';
    if (/^(import |from |def |class |#)/m.test(txt)) return 'python';
    if (/^\$\s|^sudo |^pip |^curl /m.test(txt)) return 'bash';
    return '';
  }
  function enhanceCodeBlock(codeEl) {
    const pre = codeEl.parentElement;
    if (pre.closest('.code-block')) return;
    const lang = detectLang(codeEl);
    if (lang && !codeEl.className.includes('language-')) {
      codeEl.classList.add('language-' + lang);
      pre.classList.add('language-' + lang);
    }
    const wrap = document.createElement('div');
    wrap.className = 'code-block';
    const head = document.createElement('div');
    head.className = 'code-head';
    const label = document.createElement('span');
    label.className = 'lang';
    label.textContent = lang || 'code';
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.type = 'button';
    btn.textContent = 'Copy';
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(codeEl.textContent);
        btn.textContent = '✓ Copied';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1500);
      } catch { btn.textContent = 'Failed'; }
    });
    head.appendChild(label);
    head.appendChild(btn);
    // Insert wrap in place, then move head + pre inside. Single reflow.
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(head);
    wrap.appendChild(pre);
    return codeEl;
  }
  function initCodeBlocks() {
    const codeEls = document.querySelectorAll('pre > code');
    if (!codeEls.length) return;
    const wrapped = [];
    for (const codeEl of codeEls) {
      const done = enhanceCodeBlock(codeEl);
      if (done) wrapped.push(done);
    }
    if (window.Prism && wrapped.length) {
      const highlight = () => { for (const el of wrapped) Prism.highlightElement(el); };
      if ('requestIdleCallback' in window) requestIdleCallback(highlight);
      else setTimeout(highlight, 0);
    }
  }

  // ---------- article: sticky TOC sidebar ----------
  // Injects <nav class="toc"> into any body.page-article; lists every top-level
  // <section id> found in the article, highlights the one in view. CSS hides it
  // on narrow viewports — j/k keyboard nav remains the fallback.
  function initStickyToc() {
    if (!document.body.classList.contains('page-article')) return;
    const sections = [...document.querySelectorAll('section[id]')];
    if (sections.length < 3) return; // not worth a TOC for tiny articles

    // Label picker: prefer first h2/h3 inside the section, else the id itself.
    // Strips decorative "// desc-inline" hints so the label reads clean.
    function labelFor(section) {
      if (!section) return '';
      const h2 = section.querySelector('h2, h3');
      if (!h2) return section.id;
      const clone = h2.cloneNode(true);
      clone.querySelectorAll('.desc-inline').forEach(n => n.remove());
      return (clone.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
    }

    const nav = document.createElement('nav');
    nav.className = 'toc';
    nav.setAttribute('aria-label', 'Article contents');
    const list = document.createElement('ol');
    const items = new Map(); // section id -> <a>
    for (const sec of sections) {
      const li = document.createElement('li');
      if (sec.id.includes('-')) li.classList.add('sub');
      const a = document.createElement('a');
      a.href = '#' + sec.id;
      a.textContent = labelFor(sec);
      li.appendChild(a);
      list.appendChild(li);
      items.set(sec.id, a);
    }
    nav.appendChild(list);
    document.body.appendChild(nav);

    // Highlight the section whose top is closest to the viewport's top third.
    let current = null;
    const io = new IntersectionObserver(entries => {
      // Pick the section with the largest intersection ratio (fallback: first)
      let best = null;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
      }
      if (!best) return;
      const id = best.target.id;
      if (id === current) return;
      const next = items.get(id);
      if (!next) return;
      if (current && items.has(current)) items.get(current).classList.remove('active');
      next.classList.add('active');
      current = id;
    }, {
      // 20% from top acts as the "reading line"
      rootMargin: '-20% 0px -70% 0px',
      threshold: [0, 0.01, 0.25, 0.5, 0.75, 1],
    });
    for (const sec of sections) io.observe(sec);
  }

  // ---------- 4. j/k keyboard section nav ----------
  function initKeyboardNav() {
    if (!document.querySelectorAll('section[id]').length) return;
    document.addEventListener('keydown', e => {
      if (isTextInput(e.target)) return;
      if (e.key !== 'j' && e.key !== 'k') return;
      const sections = [...document.querySelectorAll('section[id]')].filter(s => s.offsetParent !== null);
      if (!sections.length) return;
      const y = window.scrollY + 120;
      let idx = sections.findIndex(s => s.offsetTop + s.offsetHeight > y);
      if (idx < 0) idx = sections.length - 1;
      if (e.key === 'j' && idx < sections.length - 1) idx++;
      else if (e.key === 'k' && idx > 0) idx--;
      const top = sections[idx].getBoundingClientRect().top + window.scrollY - 60;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  }

  // ---------- 5. mermaid neon palette (reads CSS vars, one source of truth) ----------
  // Mermaid v10 note: `startOnLoad: true` only auto-runs if initialize() is
  // called BEFORE DOMContentLoaded. Our boot() fires on DOMContentLoaded, so
  // by the time initialize() runs mermaid's auto-trigger has already missed
  // the train — we must call mermaid.run() ourselves. We also pass
  // startOnLoad:false to avoid a second pass if the timing ever flips.
  function initMermaid() {
    if (!window.mermaid) return;
    const css = getComputedStyle(document.documentElement);
    const v = name => css.getPropertyValue(name).trim();
    const accentRgb = v('--accent-rgb') || '57,255,136';
    const cyanRgb = v('--cyan-rgb') || '0,229,255';
    window.mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        darkMode: true,
        background: v('--bg-0') || '#05070a',
        primaryColor: v('--bg-1') || '#0a0e14',
        primaryTextColor: v('--fg-0') || '#e6edf3',
        primaryBorderColor: `rgba(${accentRgb}, 0.55)`,
        secondaryColor: '#0e1219',
        tertiaryColor: v('--bg-2') || '#10151d',
        lineColor: v('--accent') || '#39ff88',
        textColor: v('--fg-1') || '#c9d1d9',
        clusterBkg: 'rgba(10,14,20,0.55)',
        clusterBorder: `rgba(${cyanRgb}, 0.25)`,
        edgeLabelBackground: v('--bg-1') || '#0a0e14',
        mainBkg: v('--bg-1') || '#0a0e14',
        nodeBorder: `rgba(${accentRgb}, 0.55)`,
        fontFamily: "'JetBrains Mono','SF Mono',monospace",
        fontSize: '13px',
      },
      flowchart: { curve: 'basis', padding: 16, useMaxWidth: true, htmlLabels: true, nodeSpacing: 44, rankSpacing: 54 },
      securityLevel: 'loose',
    });
    try {
      const nodes = document.querySelectorAll('.mermaid');
      if (nodes.length && typeof window.mermaid.run === 'function') {
        window.mermaid.run({ nodes });
      }
    } catch (err) {
      console.error('mermaid.run failed:', err);
    }
  }

  // ---------- 6. article index (homepage) ----------

  // Pre-escape once per article at fetch time so keystroke search doesn't re-escape.
  function prepareArticle(a) {
    const title = escapeHTML(a.title || a.slug);
    const thesis = escapeHTML(a.thesis || '');
    const summary = escapeHTML(a.summary || '');
    const haystack = [a.title, a.thesis, a.summary]
      .filter(Boolean).join(' ').toLowerCase();
    a._render = { title, thesis, summary, haystack };
    return a;
  }

  // Thesis-first card: no cover art, every element is authored content.
  //   meta row (date ↔ read →)  →  title  →  thesis pull-quote  →  summary
  // If an article has no thesis yet we fall back to summary-only.
  function renderCard(a) {
    const r = a._render;
    const link = escapeHTML(a.path || ('articles/' + (a.slug || '') + '/'));
    const date = escapeHTML(formatDate(a.date || ''));
    const thesisBlock = r.thesis
      ? `<blockquote class="card-thesis">${r.thesis}</blockquote>`
      : '';
    return `
      <a class="article-card" href="${link}">
        <div class="body">
          <div class="meta">
            <span class="meta-date">${date}</span>
            <span class="card-cta" aria-hidden="true">read <span class="arrow">→</span></span>
          </div>
          <h3 class="card-title">${r.title}</h3>
          ${thesisBlock}
          <p class="card-summary">${r.summary}</p>
        </div>
      </a>
    `;
  }

  function initArticleIndex() {
    if (!document.body.classList.contains('page-index')) return;
    const grid = document.getElementById('article-grid');
    const search = document.getElementById('search-input');
    if (!grid) return;

    let articles = [];
    let query = '';

    function matchArticle(a) {
      if (!query) return true;
      return a._render.haystack.includes(query.toLowerCase());
    }

    function render() {
      const visible = articles.filter(matchArticle);
      if (!visible.length) {
        grid.innerHTML = `<div class="no-results">— no matching articles —</div>`;
      } else {
        grid.innerHTML = visible.map(renderCard).join('');
      }
    }

    fetch('./articles.json')
      .then(r => r.json())
      .then(data => {
        articles = (data.articles || [])
          .slice()
          .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
          .map(prepareArticle);
        const n = articles.length;
        const latest = articles[0] && articles[0].date ? articles[0].date : '';
        const gridCountEl = document.getElementById('grid-count');
        if (gridCountEl) gridCountEl.textContent = n;
        const gridLatestEl = document.getElementById('grid-latest');
        if (gridLatestEl) gridLatestEl.textContent = latest
          ? `last ${latest}`
          : '';
        render();
      })
      .catch(err => {
        const gridCountEl = document.getElementById('grid-count');
        if (gridCountEl) gridCountEl.textContent = '?';
        grid.innerHTML = `<div class="no-results">Could not load articles.json — serve over HTTP (e.g. <code>python3 -m http.server</code>)</div>`;
        console.error(err);
      });

    if (search) {
      search.addEventListener('input', e => {
        query = e.target.value.trim();
        render();
      });
      document.addEventListener('keydown', e => {
        if (e.key === '/' && !isTextInput(e.target)) {
          e.preventDefault();
          search.focus();
        }
      });
    }
  }

  // ---------- boot ----------
  function boot() {
    initScrollUI();
    initAnchorScroll();
    initCodeBlocks();
    initKeyboardNav();
    initStickyToc();
    initMermaid();
    initArticleIndex();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
