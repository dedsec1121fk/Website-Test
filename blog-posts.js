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

  const EMBEDDED_POSTS = [
  {
    "file": "watch-dogs-vs-real-life-2026.html",
    "href": "../Blog/watch-dogs-vs-real-life-2026.html",
    "titleEn": "Watch Dogs vs Real Life (2026): What’s Accurate, What’s Not",
    "titleGr": "Watch Dogs vs Real Life (2026): What’s Accurate, What’s Not",
    "descEn": "A grounded comparison between the games’ ctOS fantasy and the real-world tech landscape of 2026.",
    "descGr": "A grounded comparison between the games’ ctOS fantasy and the real-world tech landscape of 2026.",
    "date": "2026-01-10"
  },
  {
    "file": "termux-new-user-guide.html",
    "href": "../Blog/termux-new-user-guide.html",
    "titleEn": "Termux: All a New User Needs to Know",
    "titleGr": "Termux: All a New User Needs to Know",
    "descEn": "A practical starter guide: setup, packages, storage, and good habits.",
    "descGr": "A practical starter guide: setup, packages, storage, and good habits.",
    "date": "2026-01-10"
  },
  {
    "file": "termux-errors-fixes.html",
    "href": "../Blog/termux-errors-fixes.html",
    "titleEn": "Termux Errors and How to Solve Them",
    "titleGr": "Termux Errors and How to Solve Them",
    "descEn": "Common errors explained with quick fixes and commands.",
    "descGr": "Common errors explained with quick fixes and commands.",
    "date": "2026-01-10"
  },
  {
    "file": "termux-run-distros.html",
    "href": "../Blog/termux-run-distros.html",
    "titleEn": "Run Distros & OSes in Termux Using Only Your Phone",
    "titleGr": "Run Distros & OSes in Termux Using Only Your Phone",
    "descEn": "Use proot-distro to run Debian/Ubuntu/Alpine safely without root.",
    "descGr": "Use proot-distro to run Debian/Ubuntu/Alpine safely without root.",
    "date": "2026-01-10"
  },
  {
    "file": "mass-surveillance-digital-id.html",
    "href": "../Blog/mass-surveillance-digital-id.html",
    "titleEn": "Mass Surveillance Through Technology & Digital ID",
    "titleGr": "Mass Surveillance Through Technology & Digital ID",
    "descEn": "How modern tracking works, where digital ID fits in, and practical privacy steps.",
    "descGr": "How modern tracking works, where digital ID fits in, and practical privacy steps.",
    "date": "2026-01-10"
  },
  {
    "file": "learn-python-in-termux.html",
    "href": "../Blog/learn-python-in-termux.html",
    "titleEn": "Learn Python Using Termux: Getting Started",
    "titleGr": "Learn Python Using Termux: Getting Started",
    "descEn": "Install Python, create projects, and build a daily learning routine on Android.",
    "descGr": "Install Python, create projects, and build a daily learning routine on Android.",
    "date": "2026-01-10"
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

  async function fetchRepoDirectory({ owner, repo, branch, blogDir }) {
    const api = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(blogDir)}?ref=${encodeURIComponent(branch || 'main')}`;
    const res = await fetch(api, {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store'
    });
    if (!res.ok) {
      throw new Error(`GitHub API returned ${res.status}`);
    }
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.filter((x) => x && x.type === 'file' && /\.html?$/i.test(x.name));
  }

  async function fetchPostMeta(entry) {
    let titleEn = fileNameToTitle(entry.name);
    let titleGr = titleEn;
    let descEn = '';
    let descGr = '';
    let date = '';

    try {
      const html = await (await fetch(entry.download_url, { cache: 'no-store' })).text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      const h1 = doc.querySelector('.page-header h1');
      const p = doc.querySelector('.page-header p');

      const metaDesc = doc.querySelector('meta[name="description"]');
      const published = doc.querySelector('meta[property="article:published_time"]');

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
      date
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

      const badge = p.date
        ? `<span class="badge" data-en="Updated ${escapeHtml(p.date)}" data-gr="Ενημέρωση ${escapeHtml(p.date)}">Updated ${escapeHtml(p.date)}</span>`
        : '';

      return `
        <a class="feature-card" href="${escapeHtml(p.href)}">
          <div class="feature-icon"><i class="fas fa-book-open"></i></div>
          <h3 class="feature-title" data-en="${titleEn}" data-gr="${titleGr}">${titleEn}</h3>
          <p data-en="${descEn}" data-gr="${descGr}">${descEn}</p>
          ${badge}
        </a>`;
    });

    grid.innerHTML = cards.join('');
  }

  async function main() {
    const grid = document.getElementById(GRID_ID);
    if (!grid) return;

    const cfg = await loadConfig();
    
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

if (!posts.length) {
  grid.innerHTML = `
    <div class="feature-card" style="grid-column: 1 / -1;">
      <h3 class="feature-title" data-en="Couldn’t load posts" data-gr="Αδυναμία φόρτωσης άρθρων">Couldn’t load posts</h3>
      <p data-en="Posts exist, but the list couldn’t be generated. If you’re viewing locally, open the site with a local server (not file://). On GitHub Pages, try refreshing." data-gr="Τα άρθρα υπάρχουν, αλλά η λίστα δεν μπόρεσε να δημιουργηθεί. Αν το βλέπεις τοπικά, άνοιξε το site με local server (όχι file://). Στο GitHub Pages δοκίμασε ανανέωση.">
        Posts exist, but the list couldn’t be generated. If you’re viewing locally, open the site with a local server (not file://). On GitHub Pages, try refreshing.
      </p>
    </div>`;
} else {
  renderPosts(grid, posts);

  // Apply the saved language after rendering
  if (typeof window.changeLanguage === 'function') {
    window.changeLanguage(getCurrentLang());
  }
}
  }

  document.addEventListener('DOMContentLoaded', main);
})();