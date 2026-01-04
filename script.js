// DedSec Project — UI + Language + Theme + Search
// Lightweight vanilla JS. No tracking.

(() => {
  const LOGO_DARK = "https://raw.githubusercontent.com/dedsec1121fk/DedSec/main/Extra%20Content/Assets/Images/Logos/Black%20Purple%20Butterfly%20Logo.jpeg";
  const LOGO_LIGHT = "https://raw.githubusercontent.com/dedsec1121fk/DedSec/main/Extra%20Content/Assets/Images/Logos/White%20Purple%20Butterfly%20Logo.jpeg";

  let currentLanguage = localStorage.getItem('language') || 'en';

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function setFaviconForTheme() {
    const isLight = document.body.classList.contains('light-theme');
    const href = isLight ? LOGO_DARK : LOGO_LIGHT; // match logo contrast
    const icon = document.querySelector('link[rel="icon"]') || document.querySelector('link[rel="shortcut icon"]');
    if (icon) icon.setAttribute('href', href);
  }

  function setLogoForTheme() {
    const isLight = document.body.classList.contains('light-theme');
    const logo = $('#site-logo');
    if (logo) {
      // White logo for dark theme, dark logo for light theme
      logo.src = isLight ? LOGO_DARK : LOGO_LIGHT;
    }
  
    setFaviconForTheme();
  }


  function applyLanguage(lang) {
    currentLanguage = lang;
    document.documentElement.lang = lang;
    localStorage.setItem('language', lang);

    $$('[data-en]').forEach(el => {
      const t = el.getAttribute(`data-${lang}`) || el.getAttribute('data-en');
      if (!t) return;
      if (el.children.length === 0) {
        el.textContent = t;
      } else {
        // Preserve icons/children; replace text nodes.
        el.childNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
            node.textContent = t;
          }
        });
      }
    });

    // Toggle language-specific sections if they exist
    $$('[data-lang-section]').forEach(el => {
      const isMatch = el.dataset.langSection === lang;
      el.style.display = isMatch ? 'block' : 'none';
    });
  }

  function initNavigation() {
    const burger = $('#burger-menu');
    const menu = $('#nav-menu');
    if (!burger || !menu) return;

    burger.addEventListener('click', () => {
      burger.classList.toggle('active');
      menu.classList.toggle('active');
    });

    $$('.nav-link').forEach(a => a.addEventListener('click', () => {
      burger.classList.remove('active');
      menu.classList.remove('active');
    }));

    document.addEventListener('click', (e) => {
      if (!menu.classList.contains('active')) return;
      const actions = document.querySelector('.nav-actions');
      if (!menu.contains(e.target) && !burger.contains(e.target) && !actions?.contains(e.target)) {
        burger.classList.remove('active');
        menu.classList.remove('active');
      }
    });
  }

  function initTheme() {
    const btn = $('#nav-theme-switcher');
    const updateLabel = () => {
      const span = btn?.querySelector('span');
      if (!span) return;
      const isLight = document.body.classList.contains('light-theme');
      span.setAttribute('data-en', isLight ? 'Light' : 'Dark');
      span.setAttribute('data-gr', isLight ? 'Φωτεινό' : 'Σκοτεινό');
      span.textContent = span.getAttribute(`data-${currentLanguage}`) || span.getAttribute('data-en') || span.textContent;
    };

    if (localStorage.getItem('theme') === 'light') {
      document.body.classList.add('light-theme');
    }
    setLogoForTheme();
    updateLabel();

    btn?.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      const isLight = document.body.classList.contains('light-theme');
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
      setLogoForTheme();
      updateLabel();
    });
  }

  // ---------- MODALS ----------
  function makeModal(id, titleEn, titleGr, bodyHtmlEn, bodyHtmlGr) {
    if (document.getElementById(id)) return;

    const overlay = document.createElement('div');
    overlay.id = id;
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="${id}-title">
        <div class="modal-header">
          <h2 id="${id}-title" data-en="${titleEn}" data-gr="${titleGr}">${titleEn}</h2>
          <button class="modal-close" type="button" aria-label="Close">✕</button>
        </div>
        <div class="modal-body">
          <div data-lang-section="en">${bodyHtmlEn}</div>
          <div data-lang-section="gr" style="display:none">${bodyHtmlGr}</div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.classList.remove('active');
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    overlay.querySelector('.modal-close')?.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });

    return overlay;
  }

  function showModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('active');
    // keep language content in sync
    applyLanguage(currentLanguage);
  }

  function initLanguageModal() {
    const overlay = makeModal(
      'language-modal',
      'Choose Language',
      'Επιλογή Γλώσσας',
      `<p class="muted">Switch language across the whole website.</p>
       <div style="display:flex;gap:10px;flex-wrap:wrap">
         <button class="chip" id="lang-en" type="button">English</button>
         <button class="chip" id="lang-gr" type="button">Ελληνικά</button>
       </div>`,
      `<p class="muted">Αλλαγή γλώσσας σε όλο το website.</p>
       <div style="display:flex;gap:10px;flex-wrap:wrap">
         <button class="chip" id="lang-en" type="button">English</button>
         <button class="chip" id="lang-gr" type="button">Ελληνικά</button>
       </div>`
    );

    $('#nav-lang-switcher')?.addEventListener('click', () => showModal('language-modal'));
    overlay?.querySelector('#lang-en')?.addEventListener('click', () => {
      applyLanguage('en');
      overlay.classList.remove('active');
    });
    overlay?.querySelector('#lang-gr')?.addEventListener('click', () => {
      applyLanguage('gr');
      overlay.classList.remove('active');
    });
  }

  function initDisclaimerModal() {
    makeModal(
      'disclaimer-modal',
      'Disclaimer & Terms of Use',
      'Αποποίηση Ευθύνης & Όροι Χρήσης',
      `
        <div class="glass" style="padding:14px;border-radius:18px;border:1px solid var(--line);background:rgba(255,255,255,.04)">
          <p><strong>Read before using the resources.</strong></p>
          <ul class="muted" style="line-height:1.7;margin:10px 0 0;padding-left:18px">
            <li>Use everything responsibly and legally.</li>
            <li>Educational / informational purpose only.</li>
            <li>No warranties; you are responsible for your actions and compliance.</li>
            <li>Trademarks belong to their owners; this project is independent.</li>
          </ul>
        </div>
      `,
      `
        <div class="glass" style="padding:14px;border-radius:18px;border:1px solid var(--line);background:rgba(255,255,255,.04)">
          <p><strong>Διάβασέ το πριν χρησιμοποιήσεις τους πόρους.</strong></p>
          <ul class="muted" style="line-height:1.7;margin:10px 0 0;padding-left:18px">
            <li>Χρησιμοποίησε τα πάντα υπεύθυνα και νόμιμα.</li>
            <li>Μόνο για εκπαιδευτικούς / ενημερωτικούς σκοπούς.</li>
            <li>Χωρίς εγγυήσεις· εσύ είσαι υπεύθυνος/η για πράξεις και συμμόρφωση.</li>
            <li>Τα trademarks ανήκουν στους ιδιοκτήτες τους· το project είναι ανεξάρτητο.</li>
          </ul>
        </div>
      `
    );

    const openers = ['#open-disclaimer', '#open-disclaimer-2'];
    openers.forEach(sel => $(sel)?.addEventListener('click', () => showModal('disclaimer-modal')));
  }

  // ---------- SEARCH ----------
  const SEARCH_PAGES = [
    { url: 'index.html', title: 'Home' },
    { url: 'Pages/learn-about-the-tools.html', title: 'Tools' },
    { url: 'Pages/guide-for-installation.html', title: 'Setup Guide' },
    { url: 'Pages/faq.html', title: 'FAQ' },
    { url: 'Pages/store.html', title: 'Store' },
    { url: 'Pages/collaborations.html', title: 'Collaborations' },
    { url: 'Pages/portfolio-github-info.html', title: 'Portfolio & GitHub' },
    { url: 'Pages/contact-credits.html', title: 'Contact & Credits' },
    { url: 'Pages/privacy-policy.html', title: 'Privacy Policy' },
  ];

  let searchIndex = null;

  function normalize(s) {
    return (s || '').toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu,'');
  }

  function inferBase() {
    // If we're in /Pages/, prefix '../' for fetches.
    const isInPages = location.pathname.includes('/Pages/');
    return isInPages ? '../' : '';
  }

  async function buildSearchIndex() {
    if (searchIndex) return searchIndex;

    const base = inferBase();
    const results = [];

    for (const p of SEARCH_PAGES) {
      const url = base + p.url;
      try {
        const res = await fetch(url, { cache: 'force-cache' });
        if (!res.ok) continue;
        const text = await res.text();
        const doc = new DOMParser().parseFromString(text, 'text/html');

        const main = doc.querySelector('.page-content') || doc.body;
        const headings = Array.from(main.querySelectorAll('h1,h2,h3'));

        // page entry
        const pageTitle = doc.title || p.title;
        const pageText = normalize(main.innerText).slice(0, 20000);
        results.push({
          title: pageTitle,
          url: p.url,
          hash: '',
          snippet: main.innerText.trim().slice(0, 220),
          hay: normalize(pageTitle + ' ' + pageText)
        });

        headings.forEach(h => {
          const id = h.getAttribute('id');
          if (!id) return;
          const title = h.innerText.trim();
          const section = h.closest('.content-section, .tool-category, .faq-item, .glass, section, article') || h.parentElement;
          const snippet = (section?.innerText || '').trim().replace(/\s+/g,' ').slice(0, 240);
          const hay = normalize(title + ' ' + snippet);
          results.push({
            title,
            url: p.url,
            hash: '#' + id,
            snippet,
            hay
          });
        });
      } catch (_) {
        // ignore
      }
    }

    searchIndex = results;
    return results;
  }

  function injectSearchModal() {
    if (document.getElementById('search-modal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'search-modal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="search-title">
        <div class="modal-header">
          <div style="display:flex;flex-direction:column;gap:4px">
            <h2 id="search-title" data-en="Search" data-gr="Αναζήτηση">Search</h2>
            <div class="tiny muted">
              <span data-en="Tip: press" data-gr="Tip: πάτα">Tip: press</span> <kbd>/</kbd>
              <span data-en="to open search" data-gr="για να ανοίξεις αναζήτηση">to open search</span>
            </div>
          </div>
          <button class="modal-close" type="button" aria-label="Close">✕</button>
        </div>
        <div class="modal-body">
          <div class="search-box">
            <input class="search-input" id="search-input" type="search" autocomplete="off"
              placeholder="Search pages & sections..." />
            <button class="chip" id="search-clear" type="button" data-en="Clear" data-gr="Καθαρισμός">Clear</button>
          </div>
          <div class="search-results" id="search-results"></div>
          <div class="tiny muted" id="search-status" style="margin-top:10px"></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.classList.remove('active');
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    overlay.querySelector('.modal-close')?.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });

    return overlay;
  }

  function openSearch(prefill = '') {
    const overlay = injectSearchModal();
    if (!overlay) return;
    overlay.classList.add('active');
    applyLanguage(currentLanguage);

    const input = overlay.querySelector('#search-input');
    const list = overlay.querySelector('#search-results');
    const status = overlay.querySelector('#search-status');

    if (input) {
      input.value = prefill || '';
      setTimeout(() => input.focus(), 50);
    }

    const render = (items, q) => {
      if (!list) return;
      list.innerHTML = '';
      if (!q) {
        status.textContent = currentLanguage === 'gr'
          ? 'Πληκτρολόγησε για να δεις αποτελέσματα.'
          : 'Type to see results.';
        return;
      }
      if (!items.length) {
        status.textContent = currentLanguage === 'gr'
          ? 'Δεν βρέθηκαν αποτελέσματα.'
          : 'No results found.';
        return;
      }
      status.textContent = currentLanguage === 'gr'
        ? `${items.length} αποτελέσματα`
        : `${items.length} results`;

      items.slice(0, 18).forEach(item => {
        const el = document.createElement('div');
        el.className = 'search-result';
        el.innerHTML = `
          <div class="sr-title">${item.title}</div>
          <div class="sr-meta">${item.url}${item.hash}</div>
          <div class="sr-snippet">${item.snippet}</div>
        `;
        el.addEventListener('click', () => {
          overlay.classList.remove('active');
          const target = inferBase() + item.url + item.hash;
          // same-page smooth scroll when possible
          const current = (inferBase() + location.pathname.replace(/.*\//,''));
          if (item.url.endsWith(current) || location.pathname.endsWith(item.url)) {
            if (item.hash) {
              const id = item.hash.slice(1);
              const node = document.getElementById(id);
              if (node) {
                node.scrollIntoView({ behavior: 'smooth', block: 'start' });
                history.replaceState(null, '', item.hash);
                return;
              }
            }
          }
          location.href = target;
        });
        list.appendChild(el);
      });
    };

    const run = async () => {
      const q = normalize(input?.value || '');
      if (!q) return render([], '');
      status.textContent = currentLanguage === 'gr' ? 'Φόρτωση…' : 'Loading…';
      const idx = await buildSearchIndex();
      const matches = idx.filter(it => it.hay.includes(q));
      render(matches, q);
    };

    input?.addEventListener('input', () => run());
    overlay.querySelector('#search-clear')?.addEventListener('click', () => {
      if (input) input.value = '';
      render([], '');
      input?.focus();
    });

    // initial
    run();
  }

  function initSearchTriggers() {
    $('#nav-search')?.addEventListener('click', () => openSearch(''));
    $$('[data-open-search]').forEach(b => b.addEventListener('click', () => openSearch('')));

    document.addEventListener('keydown', (e) => {
      // "/" to open search (ignore inputs)
      const t = e.target;
      const isTyping = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (!isTyping && e.key === '/') {
        e.preventDefault();
        openSearch('');
      }
    });

    // handle ?q=
    const q = new URLSearchParams(location.search).get('q');
    if (q) openSearch(q);
  }

  // ---------- INIT ----------
  document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initTheme();
    initLanguageModal();
    initDisclaimerModal();
    applyLanguage(currentLanguage);
    initSearchTriggers();
  });
})();
