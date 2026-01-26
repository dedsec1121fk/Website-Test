/* ============================================================================
   MAINTENANCE (DedSec Blog)
   - This file renders the Blog listing.
   - Primary mode: fetch posts from GitHub (auto-detects repo on *.github.io).
   - Offline fallback: EMBEDDED_POSTS below (update when you add/remove posts).
   ============================================================================ */
(() => {
  'use strict';

  const GRID_ID = 'blog-posts-grid';
  const DEFAULT_CFG = {
    github: {
      owner: 'dedsec1121fk',
      repo: 'dedsec1121fk.github.io',
      branch: 'main',
      blogDir: 'Blog'
    }
  };

  // Offline fallback for ZIP builds / rate limits.
  // Keep this list aligned with the "final" (non-redirect) posts you want to show in the Blog listing.
  const EMBEDDED_POSTS = [
  {
    "file": "ai-and-cybersecurity-2026.html",
    "href": "../Blog/ai-and-cybersecurity-2026.html",
    "titleEn": "AI and Cybersecurity (2026): Deepfakes, Crime, and the Defensive Upside",
    "titleGr": "AI και Κυβερνοασφάλεια (2026): Deepfakes, Έγκλημα και το Αμυντικό Όφελος",
    "descEn": "Generative AI makes scams cheaper and more convincing—but it also helps defenders. Here’s the threat map and a practical defense playbook.",
    "descGr": "Η γενετική AI κάνει τις απάτες φθηνότερες και πιο πειστικές—αλλά βοηθά και τους αμυνόμενους. Ιδού ο χάρτης απειλών και ένα πρακτικό playbook άμυνας.",
    "date": "2026-01-11",
    "section": "Artificial Intelligence",
    "tags": [
      "AI",
      "Cybersecurity",
      "Threat modeling",
      "Defense",
      "Automation"
    ]
  },
  {
    "file": "ai-terminator-myth-vs-reality.html",
    "href": "../Blog/ai-terminator-myth-vs-reality.html",
    "titleEn": "Humanoid Robots & Artificial Muscles: The Real ‘Terminator’ Question",
    "titleGr": "Ανθρωποειδή Ρομπότ & Τεχνητοί Μύες: Το πραγματικό ερώτημα «Terminator»",
    "descEn": "Robots are getting better bodies and better AI—but the scary part is not sci‑fi killers; it’s autonomy, security, and governance.",
    "descGr": "Τα ρομπότ αποκτούν καλύτερα σώματα και καλύτερη AI—αλλά το τρομακτικό δεν είναι sci‑fi δολοφόνοι· είναι η αυτονομία, η ασφάλεια και η διακυβέρνηση.",
    "date": "2026-01-11",
    "section": "Artificial Intelligence",
    "tags": [
      "Humanoid robots",
      "Autonomy",
      "Artificial muscles",
      "Safety",
      "Regulation"
    ]
  },
  {
    "file": "digital-identity-benefits-risks-safeguards.html",
    "href": "../Blog/digital-identity-benefits-risks-safeguards.html",
    "titleEn": "Digital ID, Surveillance, and Social Credit: Benefits, Control Risks, and Safeguards (China + UK)",
    "titleGr": "Ψηφιακή Ταυτότητα, Επιτήρηση και Social Credit: Οφέλη, Κίνδυνοι Ελέγχου και Δικλείδες (Κίνα + ΗΒ)",
    "descEn": "Digital identity can reduce fraud and friction—but if it becomes a mandatory gate, it can also enable mass surveillance and automated punishment.",
    "descGr": "Η ψηφιακή ταυτότητα μπορεί να μειώσει απάτες και τριβές—αλλά αν γίνει υποχρεωτική πύλη, μπορεί να επιτρέψει μαζική επιτήρηση και αυτοματοποιημένη τιμωρία.",
    "date": "2026-01-11",
    "section": "Law",
    "tags": [
      "Digital ID",
      "Privacy",
      "Authentication",
      "Civil liberties",
      "Safeguards"
    ]
  },
  {
    "file": "migration-geopolitics-weaponization-and-resilience.html",
    "href": "../Blog/migration-geopolitics-weaponization-and-resilience.html",
    "titleEn": "Migration, Crime, and Demographic Change: Facts, Fear, and Geopolitical Manipulation",
    "titleGr": "Μετανάστευση, Έγκλημα και Δημογραφία: Γεγονότα, Φόβος και Γεωπολιτική Εργαλειοποίηση",
    "descEn": "How migration becomes a pressure tool, what crime evidence actually shows, and why “overtake” narratives are usually political weapons—not data.",
    "descGr": "Πώς η μετανάστευση γίνεται εργαλείο πίεσης, τι δείχνουν πραγματικά τα δεδομένα για το έγκλημα και γιατί τα αφηγήματα «υπερίσχυσης» είναι συνήθως πολιτικά όπλα—not δεδομένα.",
    "date": "2026-01-11",
    "section": "Cybersecurity",
    "tags": [
      "Migration",
      "Geopolitics",
      "Border policy",
      "Disinformation",
      "Resilience"
    ]
  },
  {
    "file": "watch-dogs-vs-real-life-2026.html",
    "href": "../Blog/watch-dogs-vs-real-life-2026.html",
    "titleEn": "Watch Dogs vs Reality: How ctOS Became a Metaphor for 2026",
    "titleGr": "Watch Dogs vs Πραγματικότητα: Πώς το ctOS έγινε μεταφορά για το 2026",
    "descEn": "A game-by-game breakdown (WD1, WD2, Legion) and the real tech stack that makes Watch Dogs feel less fictional every year.",
    "descGr": "Ανάλυση ανά παιχνίδι (WD1, WD2, Legion) και το πραγματικό tech stack που κάνει το Watch Dogs να μοιάζει όλο και λιγότερο φανταστικό.",
    "date": "2026-01-11",
    "section": "Technology",
    "tags": [
      "Watch Dogs",
      "Surveillance",
      "Smart cities",
      "Hacking culture",
      "Privacy"
    ]
  }
];

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function fileNameToTitle(name) {
    return String(name || '')
      .replace(/\.html?$/i, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (m) => m.toUpperCase());
  }

  function getCurrentLang() {
    return (localStorage.getItem('language') || 'en').toLowerCase();
  }

  async function loadConfig() {
    try {
      const res = await fetch('../site-config.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('config fetch failed');
      const cfg = await res.json();
      return { ...DEFAULT_CFG, ...cfg, github: { ...DEFAULT_CFG.github, ...(cfg.github || {}) } };
    } catch (_) {
      return DEFAULT_CFG;
    }
  }

  function detectGitHubRepoFromLocation() {
    // If the site is hosted on *.github.io, derive owner/repo from the URL so copied repos work automatically.
    const host = String(location.hostname || '').toLowerCase();
    if (!host.endsWith('github.io')) return null;

    const owner = host.split('.')[0];
    const parts = String(location.pathname || '').split('/').filter(Boolean);

    // User/organization site: https://owner.github.io/       => repo is owner.github.io
    // Project site:          https://owner.github.io/repo/  => repo is the first path segment
    const repo = parts.length ? parts[0] : `${owner}.github.io`;
    return { owner, repo };
  }

  async function fetchRepoDirectory({ owner, repo, branch, blogDir }) {
    const base = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(blogDir)}`;
    const withRef = branch ? `${base}?ref=${encodeURIComponent(branch)}` : base;

    let res = await fetch(withRef, {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store'
    });

    // If the branch name is wrong (common when copying the site to a new repo),
    // retry without specifying a ref so GitHub uses the repo’s default branch.
    if (!res.ok && branch) {
      res = await fetch(base, {
        headers: { Accept: 'application/vnd.github+json' },
        cache: 'no-store'
      });
    }

    if (!res.ok) {
      throw new Error(`GitHub API returned ${res.status}`);
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.filter((x) => x && x.type === 'file' && /\.html?$/i.test(x.name));
  }

  function parseMetaRefreshRedirect(doc) {
    const m = doc.querySelector('meta[http-equiv="refresh" i]');
    if (!m) return null;
    const content = String(m.getAttribute('content') || '');
    // formats: "0; url=target.html" or "0;url=target.html"
    const match = content.match(/url\s*=\s*([^;]+)\s*$/i);
    if (!match) return null;
    const url = String(match[1] || '').trim().replace(/^['"]|['"]$/g, '');
    return url || null;
  }

  async function fetchPostMeta(entry) {
    let titleEn = fileNameToTitle(entry.name);
    let titleGr = titleEn;
    let descEn = '';
    let descGr = '';
    let date = '';
    let section = '';
    let tags = [];
    let isRedirect = false;
    let redirectTo = '';

    try {
      const htmlText = await (await fetch(entry.download_url, { cache: 'no-store' })).text();
      const doc = new DOMParser().parseFromString(htmlText, 'text/html');

      // Detect "Moved" stub pages (meta refresh) and remove them from the listing later.
      const redir = parseMetaRefreshRedirect(doc);
      if (redir) {
        isRedirect = true;
        redirectTo = redir;
      }

      const h1 = doc.querySelector('.page-header h1');
      const p = doc.querySelector('.page-header p');

      const metaDesc = doc.querySelector('meta[name="description"]');
      const published = doc.querySelector('meta[property="article:published_time"]');
      const sectionMeta = doc.querySelector('meta[property="article:section"]');
      const tagMetas = Array.from(doc.querySelectorAll('meta[property="article:tag"]'));

      if (h1) {
        titleEn = (h1.getAttribute('data-en') || h1.textContent || titleEn).trim();
        titleGr = (h1.getAttribute('data-gr') || titleGr).trim();
      }
      if (p) {
        descEn = (p.getAttribute('data-en') || p.textContent || '').trim();
        descGr = (p.getAttribute('data-gr') || descGr).trim();
      } else if (metaDesc) {
        descEn = (metaDesc.getAttribute('content') || '').trim();
        descGr = descEn;
      }

      if (published) date = (published.getAttribute('content') || '').trim();
      if (sectionMeta) section = String(sectionMeta.getAttribute('content') || '').trim();
      if (tagMetas && tagMetas.length) {
        tags = tagMetas
          .map(m => String(m.getAttribute('content') || '').trim())
          .filter(Boolean);
      }
    } catch (_) {
      // keep fallbacks
    }

    return {
      file: entry.name,
      href: `../Blog/${entry.name}`,
      titleEn,
      titleGr,
      descEn,
      descGr,
      date,
      section,
      tags,
      isRedirect,
      redirectTo
    };
  }

  function renderPosts(grid, posts) {
    if (!posts.length) {
      grid.innerHTML = `
        <div class="feature-card" style="grid-column: 1 / -1;">
          <h3 class="feature-title" data-en="No posts found" data-gr="Δεν βρέθηκαν άρθρα">No posts found</h3>
          <p data-en="Upload an HTML file into the /Blog folder and it will appear here automatically." data-gr="Ανέβασε ένα HTML αρχείο στον φάκελο /Blog και θα εμφανιστεί εδώ αυτόματα.">
            Upload an HTML file into the /Blog folder and it will appear here automatically.
          </p>
        </div>`;
      return;
    }

    const cards = posts.map((p) => {
      const titleEn = escapeHtml(p.titleEn);
      const titleGr = escapeHtml(p.titleGr || p.titleEn);
      const descEn = escapeHtml(p.descEn || '');
      const descGr = escapeHtml(p.descGr || p.descEn || '');

      const taxonomy = (() => {
        const out = [];
        if (p.section) out.push(`<span class="badge">${escapeHtml(p.section)}</span>`);
        if (Array.isArray(p.tags)) {
          p.tags.slice(0, 3).forEach(t => out.push(`<span class="badge">#${escapeHtml(t)}</span>`));
        }
        return out.length
          ? `<div class="blog-taxonomy">${out.join('')}</div>`
          : '';
      })();

      const badge = p.date
        ? `<span class="badge" data-en="Updated ${escapeHtml(p.date)}" data-gr="Ενημέρωση ${escapeHtml(p.date)}">Updated ${escapeHtml(p.date)}</span>`
        : '';

      return `
        <a class="feature-card" href="${escapeHtml(p.href)}">
          <div class="feature-icon"><i class="fas fa-book-open"></i></div>
          <h3 class="feature-title" data-en="${titleEn}" data-gr="${titleGr}">${titleEn}</h3>
          <p data-en="${descEn}" data-gr="${descGr}">${descEn}</p>
          ${taxonomy}
          ${badge}
        </a>`;
    });

    grid.innerHTML = cards.join('');
  }

  function setupFilters(posts, grid) {
    const catWrap = document.getElementById('category-chips');
    const tagWrap = document.getElementById('tag-chips');
    const filtersBox = document.getElementById('blog-filters');
    if (!catWrap || !tagWrap) return;

    const allCats = Array.from(new Set(posts.map(p => (p.section || '').trim()).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b));
    const allTags = Array.from(new Set(posts.flatMap(p => Array.isArray(p.tags) ? p.tags : []).map(t => String(t).trim()).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b));

    // Hide the whole filter UI if there is nothing to filter by
    if ((!allCats.length) && (!allTags.length)) {
      if (filtersBox) filtersBox.style.display = 'none';
      return;
    }

    const params = new URLSearchParams(location.search || '');
    let selectedCat = params.get('cat') || 'All';
    let selectedTag = params.get('tag') || 'All';

    function mkChip(labelEn, labelGr, value, selected, onPick) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip' + (selected === value ? ' is-active' : '');
      b.setAttribute('data-en', labelEn);
      b.setAttribute('data-gr', labelGr);
      b.textContent = labelEn;
      b.addEventListener('click', () => onPick(value));
      return b;
    }

    function renderChips(wrap, items, selected, onPick) {
      wrap.innerHTML = '';
      wrap.appendChild(mkChip('All', 'Όλα', 'All', selected, onPick));
      items.forEach(v => {
        // Categories/tags are stored in English (SEO). Keep label the same in both languages.
        const label = String(v);
        wrap.appendChild(mkChip(label, label, v, selected, onPick));
      });
      wrap.parentElement?.classList.toggle('is-empty', items.length === 0);
    }

    function apply() {
      const filtered = posts.filter(p => {
        const okCat = (selectedCat === 'All') || (String(p.section || '') === selectedCat);
        const okTag = (selectedTag === 'All') || (Array.isArray(p.tags) && p.tags.includes(selectedTag));
        return okCat && okTag;
      });

      // keep query params in sync (clean URLs)
      const next = new URLSearchParams(location.search || '');
      if (selectedCat === 'All') next.delete('cat'); else next.set('cat', selectedCat);
      if (selectedTag === 'All') next.delete('tag'); else next.set('tag', selectedTag);
      const nextStr = next.toString();
      const nextUrl = nextStr ? `${location.pathname}?${nextStr}` : location.pathname;
      history.replaceState(null, '', nextUrl);

      renderChips(catWrap, allCats, selectedCat, (v) => { selectedCat = v; apply(); });
      renderChips(tagWrap, allTags, selectedTag, (v) => { selectedTag = v; apply(); });

      renderPosts(grid, filtered);

      // Re-apply language on dynamically injected nodes
      if (typeof window.changeLanguage === 'function') {
        window.changeLanguage(getCurrentLang());
      }
    }

    apply();
  }

  function normalizePosts(posts) {
    // Remove redirect "Moved" stub pages from the listing.
    const out = (Array.isArray(posts) ? posts : []).filter(p => !p?.isRedirect);
    // Also remove duplicates by file/href
    const seen = new Set();
    return out.filter(p => {
      const key = String(p.href || p.file || '');
      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async function main() {
    const grid = document.getElementById(GRID_ID);
    if (!grid) return;

    const cfg = await loadConfig();

    // If this is a GitHub Pages URL (owner.github.io[/repo]/...), auto-detect the repo so the blog works in any copied/testing repository.
    const detected = detectGitHubRepoFromLocation();
    if (detected) {
      cfg.github = { ...cfg.github, ...detected, branch: '' };
    }

    let posts = [];
    try {
      const entries = await fetchRepoDirectory(cfg.github);
      const metas = await Promise.all(entries.map(fetchPostMeta));

      metas.sort((a, b) => {
        const d = (b.date || '').localeCompare(a.date || '');
        if (d) return d;
        return (a.titleEn || '').localeCompare(b.titleEn || '');
      });

      posts = metas;
    } catch (_) {
      // ignore and fall back to embedded list
    }

    // If GitHub API failed (offline / rate limit), use embedded posts from the ZIP build.
    if (!posts.length && Array.isArray(EMBEDDED_POSTS) && EMBEDDED_POSTS.length) {
      posts = EMBEDDED_POSTS.slice();
    }

    posts = normalizePosts(posts);

    if (!posts.length) {
      grid.innerHTML = `
        <div class="feature-card" style="grid-column: 1 / -1;">
          <h3 class="feature-title" data-en="Couldn’t load posts" data-gr="Αδυναμία φόρτωσης άρθρων">Couldn’t load posts</h3>
          <p data-en="Posts exist, but the list couldn’t be generated. If you’re viewing locally, open the site with a local server (not file://). On GitHub Pages, try refreshing." data-gr="Τα άρθρα υπάρχουν, αλλά η λίστα δεν μπόρεσε να δημιουργηθεί. Αν το βλέπεις τοπικά, άνοιξε το site με local server (όχι file://). Στο GitHub Pages δοκίμασε ανανέωση.">
            Posts exist, but the list couldn’t be generated. If you’re viewing locally, open the site with a local server (not file://). On GitHub Pages, try refreshing.
          </p>
        </div>`;
      return;
    }

    renderPosts(grid, posts);
    try { setupFilters(posts, grid); } catch (_) {}

    // Apply the saved language after rendering
    if (typeof window.changeLanguage === 'function') {
      window.changeLanguage(getCurrentLang());
    }
  }

  document.addEventListener('DOMContentLoaded', main);
})();
